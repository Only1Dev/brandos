# BrandOS Enterprise — Autonomous Pre-Publication Brand Governance Firewall

> **The enterprise zero-tolerance pre-publication firewall for human and AI-generated content.**

[![Live Web Application](https://img.shields.io/badge/Live%20App-brandos--jet.vercel.app-6366f1?style=for-the-badge&logo=vercel)](https://brandos-jet.vercel.app)
[![Backend API](https://img.shields.io/badge/API%20Docs-brandos--xwh1.onrender.com-10b981?style=for-the-badge&logo=fastapi)](https://brandos-xwh1.onrender.com/docs)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

---

## 🎯 Executive Summary for Evaluators & Judges

Modern enterprises deploy AI and distributed human teams to produce content across dozens of channels. Existing tools only check spelling, grammar, or run post-publishing audits after brand damage has already occurred.

**BrandOS** is the first **autonomous pre-publication governance firewall**. It intercepts text, social copy, proposals, PDFs, and visual assets **before** release, evaluating them across a 5-axis governance compliance vector:

1. **Domain & Entity Alignment** (Zero-tolerance perimeter defense against off-brand infiltration or cross-tenant drift)
2. **Factual Ground Truth** (TruthMark topic-isolated metric and claim verification against approved knowledge base)
3. **Brand Voice & Tone** (Authoritative, non-sensational, superlative-free tone enforcement)
4. **Lexicon & Terminology Control** (Forbidden terms, deprecated idioms, and mandatory keyword inclusion)
5. **Visual & Accessibility Compliance** (Logo integrity, clear space, and WCAG AA contrast ratio)

---

## 🌐 Live Prototype & Interactive Access

| Component | URL | Status |
|-----------|-----|--------|
| **Production Frontend** | [https://brandos-jet.vercel.app](https://brandos-jet.vercel.app) | 🟢 Live |
| **Production Backend API** | [https://brandos-xwh1.onrender.com](https://brandos-xwh1.onrender.com) | 🟢 Live |
| **Interactive OpenAPI / Swagger** | [https://brandos-xwh1.onrender.com/docs](https://brandos-xwh1.onrender.com/docs) | 🟢 Live |

### Enterprise Workspaces & Demo Personas

BrandOS supports true multi-tenant workspace isolation with role-based access control (RBAC):

| Persona | Role | Default Password / Key | Capabilities |
|---------|------|------------------------|--------------|
| **Priya Sharma** | **Enterprise Brand Admin** | Click *Auto-Fill Default Key* (`aureon-admin`) | Full Governance: Admin Override & Approve, Edit/Add Facts, Add Dynamic Rules, Delete Content, View Audit Trail |
| **David Chen** | **Lead Content Reviewer (Manager)** | `aureon-reviewer` | Review content, request revisions, trigger Auto-Remediation, save reviewer directives. **Blocked by Firewall** from approving critical non-compliant copy |
| **Aarav Patel** | **Creator / FinTech Copywriter** | `aureon-creator` | Submit copy drafts, upload PDFs/images, trigger auto-remediation |
| **Master SuperAdmin** | **Chief Governance Officer** | Click *Master SuperAdmin Portal* tab | Global multi-tenant oversight across both Aureon Technologies & Solaria Wellness |

---

## 🧪 Judge's Interactive Verification Guide (Step-by-Step)

Here is the recommended 5-minute walkthrough to verify all core autonomous capabilities of the prototype:

### Step 1: Test the Zero-Tolerance Pre-Publication Firewall (Blocked Copy)
1. Navigate to [https://brandos-jet.vercel.app](https://brandos-jet.vercel.app).
2. Click **+ New Content Review** in the top navigation.
3. **Test 1A — Meaningless Placeholder Copy / Gibberish Detection:**
   - Channel: `Instagram`
   - Content Title: `Quick draft`
   - Body Text: `abcd`
   - Click **Run Governance Analysis**.
   - **Expected Result:** The firewall blocks publication (`Score: 0/100`). Detected finding: `BRAND-SUBSTANCE-001: Content Quality Standard: Meaningless Placeholder Copy` with `critical` severity.
4. **Test 1B — Category & Domain Infiltration:**
   - Click **+ New Content Review**.
   - Body Text: `Announcing the Aureon BlendMaster Pro: 750W high-speed kitchen mixer grinder with 3 stainless steel jars for domestic food preparation.`
   - Click **Run Governance Analysis**.
   - **Expected Result:** Flagged with `BRAND-IDENTITY-001: Brand Identity & Domain Misalignment` (Critical). Publication blocked.
5. **Test 1C — Factual Metric Conflict:**
   - Body Text: `Aureon Shield platform achieves an audited 95% average reduction in transaction fraud.`
   - Click **Run Governance Analysis**.
   - **Expected Result:** Flagged with `Factual Metric Conflict (FACT-FRAUD42)`. Content claims 95% whereas approved ground truth in Brand Brain is 42%.

---

### Step 2: Test Role-Based Publishing Control & Admin Override
1. Open any **Blocked** review (from Step 1).
2. Switch identity to **David Chen (Manager)** via the bottom-left identity switcher.
   - Note the **Approval Blocked by Firewall** button.
   - Clicking it triggers an alert: *"Firewall Active: Cannot approve publication for content blocked by BrandOS firewall."*
3. Switch identity to **Priya Sharma (Admin)**.
   - Note the **Admin Override & Approve** button appears.
   - Admins can securely override with a documented rationale that is permanently logged to the immutable ledger.

---

### Step 3: Test Dynamic Custom Guideline Rules
1. In the sidebar, navigate to **AI Brand Brain $\rightarrow$ Guidelines & Rules** (`/knowledge/guidelines`).
2. Click **+ Add Rule** (available for Admins).
3. Enter:
   - **Rule Code:** `RULE-SOC2`
   - **Category:** `Terminology`
   - **Severity:** `Error`
   - **Governance Directive / Statement:** `every text must contain the keyword "SOC2"`
4. Click **Save Rule**. Notice it immediately registers dynamically.
5. Go to **New Content Review** and submit a draft without `"SOC2"`:
   - Draft: `Aureon Shield delivers enterprise transaction security.`
   - **Expected Result:** Immediately flagged with `Guideline Rule Violation: Missing Required Keyword 'SOC2' (Rule RULE-SOC2)`.
6. Add `"SOC2"` to the text and re-submit:
   - Draft: `Aureon Shield delivers enterprise SOC2 compliant transaction security.`
   - **Expected Result:** Guideline rule passes!

---

### Step 4: Test Topic-Isolated Fact Verification (Multi-Percentage Facts)
1. In the sidebar, navigate to **AI Brand Brain $\rightarrow$ Approved Facts** (`/knowledge/facts`).
2. Notice Aureon has multiple distinct percentage facts:
   - `42% average reduction in transaction fraud` (Category: Performance)
   - `10% right swipe rate` (Category: Performance)
3. Go to **New Content Review** and submit:
   - Draft: `Aureon Shield has a right swipe rate of 10%.`
4. **Expected Result:** TruthMark isolates topics at sentence level. It **does not** falsely compare swipe rate against fraud reduction. Score is `100/100` (COMPLIANT).

---

### Step 5: Test 1-Click AI Auto-Remediation
1. Open any review with tone or superlative findings (e.g. claims like *"India's #1 fraud platform with 100% protection"*).
2. Click the **✨ Auto-Remediate** button in the top action bar.
3. **Expected Result:** BrandOS synthesizes all agent suggestions, replaces prohibited superlatives with compliant phrasing, aligns metrics to verified facts, and generates a clean publication-ready draft.

---

### Step 6: Test Adversarial Stress Lab
1. In the sidebar, navigate to **Guidelines & Rules** (`/knowledge/guidelines`).
2. Scroll to the **Adversarial Brand Drift & Stress Lab** interactive banner.
3. Click any attack preset:
   - *Category Infiltration* (e.g. mixer grinder)
   - *Factual Hallucination Injection* (unbacked 90% claims)
   - *Tone Dilution & Brand Erosion* (clickbait slang)
   - *Unauthorized Regulatory Claim* (guaranteed zero risk)
4. Click **Launch Adversarial Stress Test** to observe how the multi-agent pipeline dismantles the attack payload in real time.

---

### Step 7: Inspect Immutable Audit Trail & Provenance
1. In the sidebar, navigate to **Audit Trail** (`/audit`).
2. Every action (content creation, review run, auto-remediation, admin override, rule creation, fact update) is recorded on the tamper-evident compliance log connecting `Content` $\rightarrow$ `Finding` $\rightarrow$ `Rule/Evidence` $\rightarrow$ `AI Recommendation` $\rightarrow$ `Human Decision`.

---

## 🏛️ Autonomous Multi-Agent Architecture

```
                                  [ Submitted Copy / Asset ]
                                               │
                                 ┌─────────────┴─────────────┐
                                 ▼                           ▼
                        [ Text & Claims ]             [ Visual Asset ]
                                 │                           │
         ┌───────────────────────┼───────────────────────┐   │
         ▼                       ▼                       ▼   ▼
  ┌──────────────┐       ┌──────────────┐       ┌─────────────────┐
  │ Brand Agent  │       │  Fact Agent  │       │  Visual Agent   │
  │ (Groq Llama) │       │ (TruthMark)  │       │  (Gemini Multi) │
  └──────┬───────┘       └──────┬───────┘       └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                     ┌───────────────────────┐
                     │ Devil's Advocate Agent│  (Challenging False Positives)
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
1. **Brand Agent (`Llama 3.3 70B via Groq`):** Evaluates voice, identity alignment, domain boundary protection, and mandatory inclusions.
2. **Fact Agent (`TruthMark Engine`):** Sentence-level topic-isolated factual validation against registered ground truth.
3. **Devil's Advocate Agent:** Adversarially stress-tests potential findings against context and channel nuance to eliminate false positive friction for creators.
4. **Visual & Multimodal Agent (`Gemini 1.5 Pro`):** Validates logo fidelity, clear space buffers, and WCAG AA contrast.
5. **Accessibility & Terminology Engine:** High-performance deterministic pattern matching for banned/deprecated lexicons and formatting constraints.

---

## 💻 Local Development Setup (Optional)

### Prerequisites
- Python 3.11+
- Node.js 18+ & `pnpm`

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # macOS / Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
pnpm install
pnpm dev
```
Open `http://localhost:3000` in your browser.

---

## 📄 License

BrandOS is licensed under the [MIT License](LICENSE).
