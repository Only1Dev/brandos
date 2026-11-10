"""
AI model routing layer.
- Rotates across 3 Groq API keys with automatic retry on 429.
- Routes text tasks to Groq (Llama 3.3 70B).
- Routes vision tasks to Gemini.
- Routes embeddings to HuggingFace.
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any, Dict, List, Optional

import httpx
from groq import AsyncGroq, RateLimitError, APIError

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Groq models
GROQ_MODEL_LARGE = "openai/gpt-oss-120b"
GROQ_MODEL_SMALL = "openai/gpt-oss-20b"

# HuggingFace embedding model
HF_EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
HF_API_URL = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{HF_EMBEDDING_MODEL}"


class ModelRouter:
    """
    Central routing layer for all AI model calls.
    Manages Groq key rotation, retries, and fallbacks.
    """

    def __init__(self) -> None:
        self._groq_keys = settings.groq_api_keys
        self._current_key_index = 0
        self._key_cooldowns: Dict[int, float] = {}  # index -> earliest_retry_time
        self._lock = asyncio.Lock()
        self._gemini_key = settings.gemini_api_key
        self._hf_token = settings.hf_api_token

    def _get_groq_client(self, key_index: int | None = None) -> AsyncGroq:
        idx = key_index if key_index is not None else self._current_key_index
        return AsyncGroq(api_key=self._groq_keys[idx])

    async def _rotate_key(self, failed_index: int, cooldown_seconds: float = 60.0) -> int:
        """Mark a key as rate-limited and rotate to the next available key."""
        async with self._lock:
            self._key_cooldowns[failed_index] = time.time() + cooldown_seconds
            now = time.time()
            for i in range(len(self._groq_keys)):
                candidate = (failed_index + 1 + i) % len(self._groq_keys)
                if self._key_cooldowns.get(candidate, 0) <= now:
                    self._current_key_index = candidate
                    logger.info(f"Rotated to Groq key index {candidate}")
                    return candidate

            # All keys on cooldown — find the one that expires soonest
            soonest = min(self._key_cooldowns, key=self._key_cooldowns.get)
            wait_time = max(0, self._key_cooldowns[soonest] - now)
            logger.warning(f"All Groq keys on cooldown. Waiting {wait_time:.1f}s")
            await asyncio.sleep(wait_time)
            self._current_key_index = soonest
            self._key_cooldowns.pop(soonest, None)
            return soonest

    async def completion(
        self,
        prompt: str,
        system_prompt: str | None = None,
        model: str = GROQ_MODEL_LARGE,
        temperature: float = 0.3,
        max_tokens: int = 4096,
        max_retries: int = 3,
    ) -> str:
        """
        Send a text completion request to Groq with key rotation and retry.
        Returns the assistant's message content.
        """
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        last_error: Exception | None = None
        for attempt in range(max_retries):
            key_idx = self._current_key_index
            client = self._get_groq_client(key_idx)
            try:
                response = await client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                return response.choices[0].message.content or ""
            except RateLimitError as e:
                logger.warning(
                    f"Groq rate limit on key {key_idx} (attempt {attempt+1}): {e}"
                )
                last_error = e
                # Parse retry-after header if available
                cooldown = 60.0
                await self._rotate_key(key_idx, cooldown)
            except APIError as e:
                logger.error(f"Groq API error on key {key_idx}: {e}")
                last_error = e
                if attempt < max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
            except Exception as e:
                logger.error(f"Unexpected error calling Groq: {e}")
                last_error = e
                if attempt < max_retries - 1:
                    await asyncio.sleep(1)

        raise RuntimeError(f"All Groq completion attempts failed: {last_error}")

    async def gemini_text_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
    ) -> str:
        """Fallback to Gemini Flash for large documents or when Groq is rate-limited."""
        combined_text = ""
        for m in messages:
            role = m.get("role", "user")
            content = m.get("content", "")
            if role == "system":
                combined_text += f"SYSTEM INSTRUCTIONS:\n{content}\n\n"
            else:
                combined_text += f"USER CONTENT:\n{content}\n\n"

        models = ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-2.5-flash"]
        async with httpx.AsyncClient(timeout=45.0) as client:
            for model_name in models:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self._gemini_key}"
                payload = {
                    "contents": [{"parts": [{"text": combined_text}]}],
                    "generationConfig": {"temperature": temperature, "maxOutputTokens": 4096},
                }
                try:
                    res = await client.post(url, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            if parts:
                                return parts[0].get("text", "").strip()
                except Exception as e:
                    logger.warning(f"Gemini text fallback error with {model_name}: {e}")
        return ""

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str = GROQ_MODEL_LARGE,
        temperature: float = 0.2,
        max_tokens: int = 2048,
        max_retries: int = 3,
    ) -> str:
        """
        Chat completion with list of messages, rotating Groq keys, and automatic Gemini Flash fallback.
        """
        last_error: Exception | None = None
        for attempt in range(max_retries):
            key_idx = self._current_key_index
            client = self._get_groq_client(key_idx)
            try:
                response = await client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                return response.choices[0].message.content or ""
            except RateLimitError as e:
                logger.warning(f"Groq rate limit on key {key_idx}: {e}")
                last_error = e
                await self._rotate_key(key_idx, 60.0)
            except APIError as e:
                logger.error(f"Groq API error on key {key_idx}: {e}")
                last_error = e
                # If error is 413 (request too large), immediately fallback to Gemini
                if "413" in str(e) or "too large" in str(e).lower():
                    logger.info("Request exceeds Groq token limit. Falling back to Gemini Flash (1M context)...")
                    return await self.gemini_text_completion(messages, temperature)
                await self._rotate_key(key_idx, 10.0)
            except Exception as e:
                logger.error(f"Unexpected Groq error: {e}")
                last_error = e
                if attempt < max_retries - 1:
                    await asyncio.sleep(1)

        # Fallback to Gemini if Groq fails
        logger.info("Groq attempts exhausted. Falling back to Gemini Flash...")
        fallback_res = await self.gemini_text_completion(messages, temperature)
        if fallback_res:
            return fallback_res

        raise RuntimeError(f"All Groq completion attempts and Gemini fallback failed: {last_error}")

    async def gemini_vision(
        self,
        prompt: str,
        image_bytes: bytes,
        mime_type: str = "image/png",
    ) -> str:
        return await self.vision_analysis(image_bytes=image_bytes, prompt=prompt, mime_type=mime_type)

    async def vision_analysis(
        self,
        image_bytes: bytes,
        prompt: str,
        mime_type: str = "image/png",
    ) -> str:
        """
        Send an image + prompt to Gemini for vision analysis & OCR transcription.
        """
        import base64
        import io
        from PIL import Image

        # Optimize image size for sub-second upload and latency
        if len(image_bytes) > 800 * 1024:
            try:
                im = Image.open(io.BytesIO(image_bytes))
                if im.mode in ("RGBA", "P"):
                    im = im.convert("RGB")
                im.thumbnail((1280, 1280))
                out = io.BytesIO()
                im.save(out, format="JPEG", quality=85)
                image_bytes = out.getvalue()
                mime_type = "image/jpeg"
            except Exception as e:
                logger.warning(f"Image resize note: {e}")

        image_data = base64.b64encode(image_bytes).decode("utf-8")

        models = ["gemini-3.1-flash-lite", "gemini-3.8-flash"]
        last_error = None

        async with httpx.AsyncClient(timeout=60.0) as client:
            for model_name in models:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self._gemini_key}"
                payload = {
                    "contents": [
                        {
                            "parts": [
                                {"text": prompt},
                                {
                                    "inline_data": {
                                        "mime_type": mime_type,
                                        "data": image_data,
                                    }
                                },
                            ]
                        }
                    ]
                }
                try:
                    res = await client.post(url, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            if parts:
                                return parts[0].get("text", "").strip()
                    else:
                        logger.warning(f"Gemini {model_name} HTTP {res.status_code}: {res.text[:120]}")
                        last_error = Exception(f"HTTP {res.status_code}: {res.text[:120]}")
                except Exception as e:
                    logger.warning(f"Gemini vision call error with {model_name}: {e}")
                    last_error = e

        if last_error:
            logger.error(f"All Gemini vision model attempts failed: {last_error}")
        return ""

    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings using HuggingFace Inference API (all-MiniLM-L6-v2).
        """
        if not texts:
            return []

        headers = {"Authorization": f"Bearer {self._hf_token}"}
        payload = {"inputs": texts, "options": {"wait_for_model": True}}

        async with httpx.AsyncClient(timeout=60.0) as client:
            for attempt in range(3):
                response = await client.post(
                    HF_API_URL, headers=headers, json=payload
                )
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 503:
                    # Model loading
                    wait = response.json().get("estimated_time", 20)
                    logger.info(f"HF model loading, waiting {wait}s...")
                    await asyncio.sleep(min(wait, 30))
                else:
                    logger.error(f"HF embedding error {response.status_code}: {response.text}")
                    if attempt < 2:
                        await asyncio.sleep(2 ** attempt)

        raise RuntimeError("Failed to generate embeddings after retries")


# Singleton
_router_instance: ModelRouter | None = None


def get_model_router() -> ModelRouter:
    global _router_instance
    if _router_instance is None:
        _router_instance = ModelRouter()
    return _router_instance
