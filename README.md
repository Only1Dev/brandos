# BrandOS Enterprise — Autonomous Pre-Publication Brand Governance Firewall

> **The enterprise zero-tolerance pre-publication firewall for human and AI-generated content.**

[![Live Web Application](https://img.shields.io/badge/Live%20App-brandos--jet.vercel.app-6366f1?style=for-the-badge&logo=vercel)](https://brandos-jet.vercel.app)
[![Backend API](https://img.shields.io/badge/API%20Docs-brandos--xwh1.onrender.com-10b981?style=for-the-badge&logo=fastapi)](https://brandos-xwh1.onrender.com/docs)
[![Repository](https://img.shields.io/badge/GitHub-Only1Dev%2Fbrandos-181717?style=for-the-badge&logo=github)](https://github.com/Only1Dev/brandos)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

---

## 🎯 Executive Summary for Evaluators & Judges

Modern enterprises deploy AI and distributed human teams to produce content across dozens of channels. Existing tools only check spelling, grammar, or run post-publishing audits after brand damage has already occurred.

**BrandOS** is the first **autonomous pre-publication governance firewall**. It intercepts text, social copy, proposals, PDFs, visual assets, and videos **before** release, evaluating them across a 5-axis governance compliance vector:

1. **Domain & Entity Alignment** (Zero-tolerance perimeter defense against off-brand infiltration or cross-tenant drift)
2. **Factual Ground Truth** (TruthMark topic-isolated metric and claim verification against approved knowledge base)
3. **Brand Voice & Tone** (Authoritative, non-sensational, superlative-free tone enforcement)
4. **Lexicon & Terminology Control** (Forbidden terms, deprecated idioms, and mandatory keyword inclusion)
5. **Visual & Multimodal Governance** (Gemini Vision + Audio video analysis, logo integrity, and WCAG AA contrast ratio)

---

## 🚀 The Three Round-2 Commitments Delivered

At Round 2, Team We Code Coders committed to delivering three major enterprise capabilities for Round 3. All three are fully built, deployed, and verifiable on the live production prototype:

| Committed Improvement | What Was Delivered | Verification Link |
|---|---|---|
| **1. Video Upload & Multimodal Analysis** | Full video upload pipeline supporting MP4/WebM. Gemini Vision & multimodal analysis transcribe speech, sample keyframes, check on-screen text, verify visual brand consistency, and detect factual misrepresentations in video content. | Test with short MP4/WebM video creative on `/reviews/new` |
| **2. Content Inventory Management** | Dedicated Content Hub (`/content`) that centralizes, indexes, searches, filters, and manages all enterprise brand copy, campaigns, images, and videos in one searchable repository with metadata, channels, governance scores, and review history. | Navigate to `/content` in sidebar |
| **3. AI Improvements & Adaptive Auto-Remediation** | Elevated 1-click Auto-Remediation engine powered by reviewer feedback and historical audit reports. Suggests precise drop-in replacements for tone, prohibited superlatives, and metric misalignments based on human decisions in the audit trail. | Open any blocked/warning review and click **✨ Auto-Remediate** |

---

## 🌐 Live Prototype & Interactive Access

| Component | Production URL | Status |
|-----------|----------------|--------|
| **Production Web Application** | **[https://brandos-jet.vercel.app](https://brandos-jet.vercel.app)** | 🟢 Deployed & Live |
| **Backend API Engine** | **[https://brandos-xwh1.onrender.com](https://brandos-xwh1.onrender.com)** | 🟢 Deployed & Live |
| **Interactive API Documentation** | **[https://brandos-xwh1.onrender.com/docs](https://brandos-xwh1.onrender.com/docs)** | 🟢 Swagger / OpenAPI |
| **Source Code Repository** | **[https://github.com/Only1Dev/brandos](https://github.com/Only1Dev/brandos)** | 🟢 Public Repository |

### Enterprise Workspaces & Demo Personas

BrandOS supports true multi-tenant workspace isolation with role-based access control (RBAC):

| Workspace | Persona | Role | Quick Access Key | Capabilities |
|---|---|---|---|---|
| **Aureon Technologies** (FinTech & Security) | **Priya Sharma** | **Enterprise Brand Admin** | `aureon-admin` *(or click Auto-Fill)* | Full Governance: Admin Override & Approve, Edit Facts, Add Dynamic Rules, Delete Content, View Audit Trail |
| **Aureon Technologies** | **David Chen** | **Lead Content Reviewer** | `aureon-reviewer` | Review content, request revisions, trigger Auto-Remediation. **Blocked by Firewall** from approving critical non-compliant copy |
| **Aureon Technologies** | **Aarav Patel** | **Creator / Copywriter** | `aureon-creator` | Submit copy drafts, upload PDFs/images/videos, trigger auto-remediation |
| **Solaria Wellness** (Nutraceuticals) | **Dr. Elena Vance** | **Brand Admin** | `solaria-admin` *(or click Auto-Fill)* | Complete isolated knowledge base: clinical facts, organic ingredient guidelines, botanical terminology |
| **Global Oversight** | **Master SuperAdmin** | **Chief Governance Officer** | Click *Master SuperAdmin Console* | Multi-tenant governance: approve self-registered brands, delete firms with type-CONFIRM verification, view cross-firm health |

---

## 🧪 3-Minute Evaluation Guide for Judges

We have placed pre-made test files in the [`samples/`](./samples/) directory to make verification effortless:

### Step 1: Zero-Tolerance Pre-Publication Firewall (Blocked Copy)
1. Go to **[https://brandos-jet.vercel.app](https://brandos-jet.vercel.app)** and select **Aureon Technologies**.
2. Click **+ New Review** in the top navigation.
3. Open `samples/text/02_offbrand_domain_infiltration.txt` (or paste: *"Announcing the Aureon BlendMaster Pro: 750W high-speed kitchen mixer grinder with 3 stainless steel jars"*).
4. Click **Run Governance Analysis**.
5. **Verdict:** Firewall immediately blocks publication (`Score: 0/100`). Finding: `BRAND-IDENTITY-001: Brand Identity & Domain Misalignment` (Critical).

### Step 2: TruthMark™ Fact Grounding & Numerical Claim Verification
1. Click **+ New Review**.
2. Open `samples/text/03_unverified_metric_hallucination.txt` (claims: *"Aureon Shield platform achieves an audited 95% average reduction in transaction fraud"*).
3. Click **Run Governance Analysis**.
4. **Verdict:** Flagged with `Factual Metric Conflict (FACT-FRAUD42)`. Ground truth in Aureon's Brand Brain is **42%**, catching the 95% exaggeration before public release.

### Step 3: Round 2 Commitment #1 — Multimodal Video Governance
1. Click **+ New Review** and select the **Video** tab.
2. Drag and drop any short MP4/WebM video creative.
3. Click **Run Governance Analysis**.
4. Watch the live multimodal ingestion and analysis stream: keyframes are extracted, speech is transcribed, and Gemini analyzes on-screen brand elements and messaging consistency.

### Step 4: Round 2 Commitment #2 — Content Inventory Management
1. In the left navigation, click **Content** (`/content`).
2. Search, filter by channel, status (Approved / Blocked / Under Review), and inspect historical submissions.
3. Click any row to preview full review findings or launch remediation.

### Step 5: Round 2 Commitment #3 — Adaptive Auto-Remediation
1. Open any review with tone or superlative findings.
2. Click the **✨ Auto-Remediate** button in the action bar.
3. The engine uses reviewer feedback and audit history to rewrite non-compliant phrasing into publication-ready copy.

### Step 6: SuperAdmin Governance & Type-CONFIRM Deletion
1. Click **Log Out** $\rightarrow$ Click **SuperAdmin Master Console** at the bottom of the login modal.
2. View cross-enterprise tenant health and pending brand approvals.
3. Test enterprise deletion security: clicking Delete opens an unstop-style confirmation modal requiring typing `CONFIRM` to prevent accidental firm destruction.

---

## 🏛️ Autonomous Multi-Agent Architecture

```
                                  [ Submitted Copy / Asset / Video ]
                                                  │
                                  ┌───────────────┴───────────────┐
                                  ▼                               ▼
                         [ Text & Claims ]                [ Video / Image ]
                                  │                               │
          ┌───────────────────────┼───────────────────────┐       │
          ▼                       ▼                       ▼       ▼
   ┌──────────────┐       ┌──────────────┐       ┌─────────────────┐
   │ Brand Agent  │       │  Fact Agent  │       │ Visual & Video  │
   │ (Groq Llama) │       │ (TruthMark)  │       │ (Gemini Multi)  │
   └──────┬───────┘       └──────┬───────┘       └────────┬────────┘
          │                       │                       │
          └───────────────────────┼───────────────────────┘
                                  ▼
                      ┌───────────────────────┐
                      │ Devil's Advocate Agent│  (Filters False Positives)
                      └───────────┬───────────┘
                                  │
                                  ▼
                      ┌───────────────────────┐
                      │   Governance Engine   │  (5-Axis Risk Vector & Firewall Verdict)
                      └───────────┬───────────┘
                                  │
                   ┌──────────────┴──────────────┐
                   ▼                             ▼
          [ APPROVED (PASS) ]           [ BLOCKED (FIREWALL) ]
                   │                             │
                   ▼                             ▼
         Governance Certificate            Auto-Remediation &
                                           Admin Override Workflow
```

### Specialized Agents:
1. **Brand Voice Agent (`Llama 3.3 70B via Groq`):** Evaluates voice fingerprint, tone alignment, domain boundaries, and required keywords.
2. **Fact Grounding Agent (`TruthMark™ Engine`):** Sentence-level topic-isolated factual validation against registered ground truth.
3. **Devil's Advocate Agent:** Adversarially stress-tests potential findings against channel context to eliminate false-positive friction.
4. **Visual & Multimodal Agent (`Gemini 1.5 Pro`):** Keyframe extraction, video speech transcription, logo fidelity, and WCAG AA contrast.
5. **Deterministic Policy Engine:** Regex and token-level enforcement of prohibited lexicons, compliance rules, and formatting constraints.

---

## 💻 Local Quickstart (Clone & Run)

Follow these steps to run BrandOS locally in under 3 minutes:

### Prerequisites
- Python 3.11+ (or Python 3.13)
- Node.js 18+ & npm (or pnpm)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/Only1Dev/brandos.git
cd brandos
```

### 2. Backend Setup
```bash
cd backend
python -m venv .venv

# Windows:
.venv\Scripts\activate
# macOS / Linux:
# source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env  # Or update with your Gemini / Groq / Supabase keys
uvicorn app.main:app --reload --port 8000
```
Backend will be live at `http://127.0.0.1:8000` with Swagger docs at `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 🗺️ Product Roadmap & Future Milestones

- **Q1 2027 — Enterprise DAM & CMS Integrations:** Direct plugins for Figma, Adobe Experience Manager, Contentful, and Canva for in-design firewall warnings.
- **Q2 2027 — Autonomous Publishing Webhooks:** Connect approved reviews to Twitter/X API, LinkedIn Pages API, and HubSpot for continuous automated distribution.
- **Q3 2027 — Enterprise SSO & SCIM:** Okta, Azure AD, and Google Workspace SAML 2.0 integration for enterprise team provisioning.

---

## 📄 Team & Event Submission Details

- **Project Name:** BrandOS Enterprise
- **Team Name:** Team We Code Coders
- **Event:** AI Hackathon 2026 — Round 3 Final Submission
- **License:** MIT License
