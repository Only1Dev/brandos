# BrandOS

> **The pre-publication governance layer for human + AI content.**

BrandOS is an AI-powered brand governance and content integrity platform that evaluates text, documents, and visual content against your organisation's approved brand guidelines, terminology, facts, claims, assets, and policies.

## 🏗️ Architecture

```
Frontend (Next.js 15) → Backend (FastAPI) → AI Agents (Groq + Gemini) → Governance Engine
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- pnpm

### Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
pnpm install
pnpm dev
```

### Environment Variables

Copy `.env.example` files and fill in your keys:

- `backend/.env` — Supabase, Groq, Gemini, HuggingFace keys
- `frontend/.env.local` — Supabase public keys, backend URL

## 🔑 Required API Keys (All Free Tier)

| Service | Purpose | Sign Up |
|---------|---------|---------|
| Supabase | Database + Auth + Storage | https://supabase.com |
| Groq | LLM inference (text analysis) | https://console.groq.com |
| Google AI Studio | Vision/multimodal (Gemini) | https://aistudio.google.com |
| HuggingFace | Embeddings for RAG | https://huggingface.co |

## 📁 Project Structure

```
brandos/
├── frontend/          # Next.js 15 + Tailwind + shadcn/ui
├── backend/           # FastAPI + SQLAlchemy + AI Agents
├── .gitignore
└── README.md
```

## ⚠️ Security

- All API keys are stored in `.env` files (never committed)
- `.gitignore` excludes all env files
- Supabase Row Level Security enforces tenant isolation
- API keys never leave the server

## 📄 License

MIT
