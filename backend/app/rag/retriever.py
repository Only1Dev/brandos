"""
Knowledge retriever combining semantic search with keyword/metadata filters.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.rag.embeddings import EmbeddingService
from app.rag.vector_store import VectorStore


class KnowledgeRetriever:
    """Retrieves relevant facts, rules, and claims for incoming content."""

    def __init__(self, vector_store: VectorStore | None = None) -> None:
        self.embedding_service = EmbeddingService()
        self.vector_store = vector_store or VectorStore()

    async def index_facts(self, facts: List[Dict[str, Any]]) -> None:
        if not facts:
            return
        docs = [f"{f.get('name', '')} {f.get('value', '')}" for f in facts]
        embs = await self.embedding_service.get_embeddings(docs)
        metas = [{"type": "fact", "fact_id": f.get("fact_id"), "id": str(f.get("id"))} for f in facts]
        ids = [str(f.get("id")) for f in facts]
        self.vector_store.add_documents(docs, metas, embs, ids)

    async def retrieve_relevant_facts(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        embs = await self.embedding_service.get_embeddings([query])
        if not embs:
            return []
        return self.vector_store.query(embs[0], n_results=top_k, where={"type": "fact"})
