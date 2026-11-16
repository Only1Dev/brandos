# 🧪 BrandOS Sample Test Assets for Evaluators & Judges

This directory contains ready-to-test assets designed specifically for hackathon evaluators to test all autonomous capabilities of BrandOS in under 3 minutes without preparing custom files.

---

## 📁 Directory Structure & Test Scenarios

### 1. `samples/text/` — Copy & Text Governance Scenarios
| File | Test Target | Expected Firewall Verdict |
|---|---|---|
| `01_compliant_launch_announcement.txt` | Aureon FinTech Product Launch | **APPROVED (100/100 PASS)** — Matches registered domain, SOC2 requirements, and ground truth 42% fraud reduction. |
| `02_offbrand_domain_infiltration.txt` | Kitchen Mixer Grinder Infiltration | **BLOCKED (0/100 FIREWALL)** — Critical finding: `BRAND-IDENTITY-001: Brand Identity & Domain Misalignment`. |
| `03_unverified_metric_hallucination.txt` | Factual Metric Hallucination (95% vs 42%) | **FLAGGED / BLOCKED** — Critical finding: `Factual Metric Conflict (FACT-FRAUD42)` detected by TruthMark engine. |
| `04_solaria_compliant_ingredient_spec.txt` | Solaria Wellness Clinical Nutrition Spec | **APPROVED (100/100 PASS)** — Verified against 300mg elderberry ground truth specification. |

### 2. `samples/documents/` — Brand Brain Manual Ingestion
| File | Format | Purpose |
|---|---|---|
| `Aureon_Brand_Guidelines.pdf` | PDF | Upload at `/knowledge/guidelines` $\rightarrow$ parses rules, tone vectors, and registers into Aureon's knowledge graph. |
| `Solaria_Wellness_Guidelines.pdf` | PDF | Upload at `/knowledge/guidelines` $\rightarrow$ parses clinical claims and wellness terminology rules. |

### 3. `samples/images/` — VisualGuard™ Image & Logo Inspection
| File | Format | Purpose |
|---|---|---|
| `sample_violation_creative.png` | PNG | Contains non-compliant neon colors and stretched logo $\rightarrow$ triggers Gemini Vision visual violation findings. |
| `official_brand_banner.png` | PNG | Compliant typography and verified high-contrast WCAG color palette. |

### 4. Video Creative — Multimodal Video Analysis
| Format | Purpose |
|---|---|
| Short MP4 / WebM video | Video upload test at `/reviews/new` $\rightarrow$ verifies multimodal audio/keyframe transcription, speech consistency, and pre-publication video firewall. |

---

## ⚡ Quick Testing Instructions
1. Navigate to the live web app: **[https://brandos-jet.vercel.app](https://brandos-jet.vercel.app)**
2. Click **+ New Review** in top navigation.
3. Drag & drop or paste content from any file above.
4. Click **Run Governance Analysis** and inspect the real-time multi-agent verdict!
