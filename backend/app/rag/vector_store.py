"""
In-process Vector Store interface using ChromaDB or in-memory cosine fallback.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
import math

logger = logging.getLogger(__name__)


class VectorStore:
    """Vector database interface for BrandOS knowledge base."""

    def __init__(self, collection_name: str = "brandos_knowledge") -> None:
        self.collection_name = collection_name
        self.documents: List[Dict[str, Any]] = []

    def add_documents(
        self,
        docs: List[str],
        metadatas: List[Dict[str, Any]],
        embeddings: List[List[float]],
        ids: List[str],
    ) -> None:
        for doc, meta, emb, doc_id in zip(docs, metadatas, embeddings, ids):
            self.documents.append({
                "id": doc_id,
                "document": doc,
                "metadata": meta,
                "embedding": emb,
            })

    def query(
        self,
        query_embedding: List[float],
        n_results: int = 5,
        where: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Cosine similarity search."""
        if not self.documents:
            return []

        def cosine_similarity(v1: List[float], v2: List[float]) -> float:
            dot = sum(a * b for a, b in zip(v1, v2))
            norm1 = math.sqrt(sum(a * a for a in v1)) or 1.0
            norm2 = math.sqrt(sum(b * b for b in v2)) or 1.0
            return dot / (norm1 * norm2)

        scored = []
        for item in self.documents:
            # Check filter
            if where:
                match = True
                for k, v in where.items():
                    if item["metadata"].get(k) != v:
                        match = False
                        break
                if not match:
                    continue

            score = cosine_similarity(query_embedding, item["embedding"])
            scored.append({
                "id": item["id"],
                "document": item["document"],
                "metadata": item["metadata"],
                "score": score,
            })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:n_results]
