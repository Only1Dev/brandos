"""
Embeddings client using HuggingFace Inference API with fallback.
"""

from __future__ import annotations

import logging
from typing import List
import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

HF_EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
HF_URL = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{HF_EMBEDDING_MODEL}"


class EmbeddingService:
    """Generates vector embeddings for semantic RAG."""

    def __init__(self) -> None:
        self.token = settings.hf_api_token

    async def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []

        headers = {"Authorization": f"Bearer {self.token}"}
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    HF_URL,
                    headers=headers,
                    json={"inputs": texts, "options": {"wait_for_model": True}},
                )
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list) and len(data) > 0:
                        return data
                logger.warning(f"HF embedding failed with status {response.status_code}: {response.text}")
            except Exception as e:
                logger.warning(f"HF embedding connection failed: {e}")

        # Fallback deterministic pseudo-embedding (384 dimensions) for offline/rate-limit resilience
        return [self._fallback_embedding(t) for t in texts]

    def _fallback_embedding(self, text: str, dim: int = 384) -> List[float]:
        """Deterministic hash-based embedding for resilient offline tests."""
        vec = [0.0] * dim
        for i, ch in enumerate(text.lower()):
            idx = (ord(ch) * (i + 1)) % dim
            vec[idx] += 1.0
        # Normalize
        norm = sum(x * x for x in vec) ** 0.5 or 1.0
        return [round(x / norm, 5) for x in vec]
