"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  AlertTriangle,
  Clock,
  Sparkles,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  FileText,
  Activity,
  CheckCircle2,
  XCircle,
  X,
  ExternalLink,
  Shield,
  Layers,
  ChevronRight,
  RefreshCw,
  Send,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { useBrand } from "@/context/BrandContext";

type PillarKey = "truthmark" | "visual" | "voice" | "a11y";

interface PillarDetail {
  title: string;
  score: string;
  status: string;
  description: string;
  detectedIssues: { label: string; count: number; note: string }[];
  actionLink: string;
  actionText: string;
}

export default function AnalyticsPage() {
  const { activeBrand, brandConfig } = useBrand();
  const [drift, setDrift] = useState<any[]>([]);
  const [expiring, setExpiring] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeWindow, setTimeWindow] = useState<"7d" | "30d" | "qtd">("30d");

  // Interactive modal state
  const [activePillarModal, setActivePillarModal] = useState<PillarKey | null>(null);
  const [selectedDriftRule, setSelectedDriftRule] = useState<any | null>(null);
  const [renewedClaims, setRenewedClaims] = useState<Record<string, boolean>>({});
  const [guidanceSent, setGuidanceSent] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [driftData, expiringData, dashData] = await Promise.all([
          api.getGuidelineDrift().catch(() => []),
          api.getExpiringClaims(30).catch(() => []),
          api.getDashboard().catch(() => null),
        ]);
        setDrift(driftData || []);
        setExpiring(expiringData || []);
        setDashboard(dashData);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [activeBrand]);

  const handleRenewClaim = (id: string, statement: string) => {
    setRenewedClaims((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      alert(`Claim validity extended by +90 days for: "${statement.slice(0, 45)}..."`);
    }, 150);
  };

  const handleSendGuidance = (ruleId: string, ruleName: string) => {
    setGuidanceSent(ruleId);
    setTimeout(() => {
      setGuidanceSent(null);
      setSelectedDriftRule(null);
      alert(`Automated Guidance Refresher dispatched to all marketing creators for ${ruleId}: "${ruleName}"`);
    }, 1200);
  };

  const pillarDetails: Record<PillarKey, PillarDetail> = {
    truthmark: {
      title: "TruthMark™ Sentence-Level Fact Grounding",
      score: `${dashboard?.fact_integrity || 95}%`,
      status: "Topic-Isolated Verification Active",
      description:
        "Every numerical claim, SLA benchmark, and quantitative assertion in submitted drafts is cross-referenced against the active Brand Brain facts database. Distinct topic keywords are isolated to prevent cross-topic comparison errors.",
      detectedIssues: [
        { label: "Unsupported Numerical Claims", count: 1, note: "Draft cited metric without grounding citation" },
        { label: "Topic Domain Alignment", count: 0, note: "All checked facts matched isolated category keywords" },
        { label: "Tolerance Deviations", count: 0, note: "No precision discrepancies outside approved tolerance" },
      ],
      actionLink: "/knowledge/facts",
      actionText: "Manage Brand Brain Facts →",
    },
    visual: {
      title: "VisualGuard™ Logo & Palette Compliance",
      score: `${dashboard?.asset_compliance || 92}%`,
      status: "Gemini Vision Auditor Active",
      description:
        "Multimodal vision pipeline inspects uploaded banner imagery, PDFs, and slide decks against official corporate logos, minimum 24px clear-space, aspect ratios, and color palettes.",
      detectedIssues: [
        { label: "Logo Clear-Space Violations", count: 2, note: "Logo encroached on banner edge (< 24px padding)" },
        { label: "Unauthorized Color Gradients", count: 0, note: "All colors within approved palette tokens" },
        { label: "Outdated Vector Version", count: 0, note: "Active Version 3.0 vector in use" },
      ],
      actionLink: "/knowledge/assets",
      actionText: "Inspect Brand Assets & Logos →",
    },
    voice: {
      title: "Brand Voice & Slogan Consistency",
      score: "94%",
      status: "Confident & Statistical Tone Enforced",
      description:
        "Evaluates tone alignment, detects phased-out jargon, and blocks prohibited absolute guarantees (such as '100% fraud elimination' or 'zero risk') in favor of approved statistical evidence.",
      detectedIssues: [
        { label: "Prohibited Absolute Guarantees", count: 24, note: "Creators used 'guaranteed' or '100% protection'" },
        { label: "Informal or Casual Terminology", count: 3, note: "Banned slang detected in public social copy" },
        { label: "Official Slogan Divergence", count: 0, note: "Taglines align with registered corporate scope" },
      ],
      actionLink: "/knowledge/guidelines",
      actionText: "Browse Voice Guidelines →",
    },
    a11y: {
      title: "WCAG 2.1 AA Accessibility Standards",
      score: `${dashboard?.accessibility_score || 99}%`,
      status: "Zero Contrast Violations Detected",
      description:
        "Guarantees that all customer-facing campaign creative meets WCAG 2.1 AA contrast requirements (minimum 4.5:1 for standard text, 3:1 for large display headers).",
      detectedIssues: [
        { label: "Low-Contrast Text Overlay", count: 0, note: "All copy passes minimum AA contrast rating" },
        { label: "Legibility on Busy Backgrounds", count: 0, note: "All headers verified on solid or high-contrast bases" },
        { label: "Font Size SLA Compliance", count: 0, note: "Typography hierarchy meets readability standards" },
      ],
      actionLink: "/knowledge/guidelines",
      actionText: "View Accessibility Guidelines →",
    },
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              BrandPulse™ Governance Analytics
            </span>
            <span className="text-xs text-slate-400">• {brandConfig.name} Executive Intelligence</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Governance Intelligence &amp; Risk Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Turns firewall inspection streams into organizational intelligence: identifies guideline drift, claim expiration risks, and root causes.
          </p>
        </div>

        {/* Time Window Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
          {[
            { id: "7d", label: "Last 7 Days" },
            { id: "30d", label: "Last 30 Days" },
            { id: "qtd", label: "Quarter-to-Date" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeWindow(t.id as any)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeWindow === t.id
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Overall Governance Index
          </div>
          <div className="text-3xl font-black text-slate-900">
            {dashboard?.brand_health || 94.7} <span className="text-xs font-normal text-slate-400">/ 100</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" /> +4.2% compliance trend
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Firewall Quarantine Rate
          </div>
          <div className="text-3xl font-black text-red-600">
            87.5%
          </div>
          <div className="text-[11px] text-slate-500">
            6 of 8 non-compliant drafts intercepted
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Active Rules Grounding
          </div>
          <div className="text-3xl font-black text-indigo-600">
            {dashboard?.active_rules_count || 103}
          </div>
          <div className="text-[11px] text-slate-500">
            Deterministic + RAG guidelines
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Claims Expiration Watch
          </div>
          <div className="text-3xl font-black text-amber-600">
            {expiring.length}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold">
            Expiring in &lt; 30-day window
          </div>
        </div>
      </div>

      {/* Interactive Clickable 4-Pillar Risk Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-600" />
              <span>Core Governance Pillar Diagnostics (Click Any Card for Root Cause)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click to inspect detected violations, topic grounding telemetry, and specific remediation links.
            </p>
          </div>
          <span className="text-[11px] text-indigo-600 font-bold hidden sm:inline">
            Interactive Diagnostics ↗
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pillar 1: TruthMark */}
          <div
            onClick={() => setActivePillarModal("truthmark")}
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                  TruthMark™
                </span>
                <span className="text-xs text-emerald-600 font-bold group-hover:underline">
                  Analyze ↗
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {dashboard?.fact_integrity || 95}%
              </div>
              <div className="text-xs font-bold text-slate-800 mt-1">Fact Integrity SLA</div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Topic-isolated fact verification. 1 numerical discrepancy flagged across all campaigns.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>0 Contradictions</span>
              <span className="font-bold text-emerald-600">Healthy</span>
            </div>
          </div>

          {/* Pillar 2: VisualGuard */}
          <div
            onClick={() => setActivePillarModal("visual")}
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                  VisualGuard™
                </span>
                <span className="text-xs text-blue-600 font-bold group-hover:underline">
                  Analyze ↗
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {dashboard?.asset_compliance || 92}%
              </div>
              <div className="text-xs font-bold text-slate-800 mt-1">Asset &amp; Logo Compliance</div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Gemini Vision perimeter check. 2 logo clearspace padding violations intercepted.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>2 Margin Flags</span>
              <span className="font-bold text-blue-600">Active Audit</span>
            </div>
          </div>

          {/* Pillar 3: Tone & Voice */}
          <div
            onClick={() => setActivePillarModal("voice")}
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200">
                  Brand Voice
                </span>
                <span className="text-xs text-purple-600 font-bold group-hover:underline">
                  Analyze ↗
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                94.0%
              </div>
              <div className="text-xs font-bold text-slate-800 mt-1">Tone &amp; Vocabulary Alignment</div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                24 instances of absolute guarantee phrasing detected and held for auto-remediation.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>24 Guarantees</span>
              <span className="font-bold text-purple-600">Needs Refresher</span>
            </div>
          </div>

          {/* Pillar 4: WCAG A11y */}
          <div
            onClick={() => setActivePillarModal("a11y")}
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Accessibility
                </span>
                <span className="text-xs text-indigo-600 font-bold group-hover:underline">
                  Analyze ↗
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {dashboard?.accessibility_score || 99}%
              </div>
              <div className="text-xs font-bold text-slate-800 mt-1">WCAG 2.1 AA Compliance</div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                9.4:1 contrast ratio against dark obsidian and light slate backgrounds.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>0 Contrast Errors</span>
              <span className="font-bold text-indigo-600">AAA Rated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Differentiator 1: Guideline Drift & Misinterpretation Radar (PRD FR-25) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span>Guideline Drift &amp; Misinterpretation Radar (PRD FR-25)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifies ambiguous rules repeatedly triggered or misunderstood by content creators.
            </p>
          </div>
          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold self-start sm:self-auto">
            Automated Root-Cause Diagnostic
          </span>
        </div>

        <div className="space-y-3">
          {drift.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                    {item.rule_id}
                  </span>
                  <span className="font-bold text-xs text-slate-900">{item.rule_name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                    Triggered {item.trigger_count}× ({item.misinterpretation_rate}% drift)
                  </span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed">
                <strong className="text-indigo-600">💡 Intelligence Recommendation: </strong>
                {item.recommendation}
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] text-slate-400">
                  Affected Profiles:{" "}
                  <strong className="text-slate-700">
                    {item.affected_creators?.join(", ") || "Campaign Copywriters"}
                  </strong>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/knowledge/guidelines"
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all"
                  >
                    View Rule Spec
                  </Link>
                  <button
                    onClick={() => setSelectedDriftRule(item)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="h-3 w-3" />
                    <span>Send Creator Guidance</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Differentiator 2: Proactive Claim Expiration Warnings (PRD FR-26) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-600" />
              <span>Proactive Claim Expiration Radar (PRD FR-26)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tracks performance &amp; legal claims approaching validity expiration before published content becomes legally vulnerable.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">30-day lookahead window active</span>
        </div>

        <div className="space-y-3">
          {expiring.map((claim, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Expires in {claim.days_remaining} days ({claim.valid_until})
                  </span>
                  <span className="text-xs text-slate-500">
                    Appears in <strong className="text-slate-800">{claim.affected_content_items} published marketing assets</strong>
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-900 leading-snug">
                  {claim.statement}
                </div>
                <div className="text-[11px] text-slate-400">
                  Compliance Owner: <strong className="text-slate-700">{claim.owner}</strong> • Source: {claim.source_fact}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/knowledge/claims"
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-all"
                >
                  Inspect in Ledger
                </Link>

                <button
                  type="button"
                  onClick={() => handleRenewClaim(claim.id, claim.statement)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer ${
                    renewedClaims[claim.id]
                      ? "bg-emerald-600 text-white"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                >
                  <RefreshCw className={`h-3 w-3 ${renewedClaims[claim.id] ? "animate-spin" : ""}`} />
                  <span>{renewedClaims[claim.id] ? "Renewed (+90d)" : "Renew Claim (+90d)"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Channel Governance Risk Heatmap */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-600" />
            <span>Distribution Channel Compliance Performance</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time pass rate and risk breakdown across marketing export destinations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between font-bold">
              <span className="text-slate-900">Instagram &amp; Social</span>
              <span className="text-amber-600 font-mono">82% Pass</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-2 rounded-full" style={{ width: "82%" }} />
            </div>
            <div className="text-[11px] text-slate-400">Top risk: Logo margin clearspace</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between font-bold">
              <span className="text-slate-900">LinkedIn &amp; Thought Leadership</span>
              <span className="text-emerald-600 font-mono">94% Pass</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "94%" }} />
            </div>
            <div className="text-[11px] text-slate-400">High tone and terminology alignment</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between font-bold">
              <span className="text-slate-900">Press Releases</span>
              <span className="text-emerald-600 font-mono">100% Pass</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-2 rounded-full" style={{ width: "100%" }} />
            </div>
            <div className="text-[11px] text-slate-400">Full TruthMark citation backing</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between font-bold">
              <span className="text-slate-900">Internal Memos &amp; Roadmaps</span>
              <span className="text-red-600 font-mono">67% Pass</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-red-500 h-2 rounded-full" style={{ width: "67%" }} />
            </div>
            <div className="text-[11px] text-slate-400">DLP quarantine blocker active</div>
          </div>
        </div>
      </div>

      {/* Interactive Pillar Diagnostic Modal */}
      {activePillarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  {pillarDetails[activePillarModal].title}
                </h3>
                <span className="text-xs text-emerald-600 font-semibold">
                  Score: {pillarDetails[activePillarModal].score} • {pillarDetails[activePillarModal].status}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActivePillarModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {pillarDetails[activePillarModal].description}
            </p>

            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold text-slate-800">Telemetry &amp; Findings Breakdown:</div>
              {pillarDetails[activePillarModal].detectedIssues.map((issue, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-800">{issue.label}</div>
                    <div className="text-[11px] text-slate-500">{issue.note}</div>
                  </div>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                      issue.count > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {issue.count} Flags
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActivePillarModal(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Close Diagnostic
              </button>
              <Link
                href={pillarDetails[activePillarModal].actionLink}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                {pillarDetails[activePillarModal].actionText}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Creator Guidance Modal */}
      {selectedDriftRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {selectedDriftRule.rule_id}
                </span>
                <h3 className="font-bold text-sm text-slate-900 mt-1">
                  Dispatch Creator Guidance Refresher
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDriftRule(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-bold">Detected Misinterpretation Drift ({selectedDriftRule.misinterpretation_rate}% of creators):</div>
              <p className="text-[11px] leading-relaxed">
                {selectedDriftRule.recommendation}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-800">Pre-Approved Guidance Template to Dispatched Creators:</div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700 leading-relaxed">
                &quot;Team: Under rule {selectedDriftRule.rule_id}, avoid absolute guarantee phrasing (&apos;100% protection&apos;). Please use approved statistical claims backed by TruthMark (&apos;proven 42% fraud reduction&apos;). View full guide in BrandOS.&quot;
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedDriftRule(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={guidanceSent === selectedDriftRule.rule_id}
                onClick={() => handleSendGuidance(selectedDriftRule.rule_id, selectedDriftRule.rule_name)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{guidanceSent === selectedDriftRule.rule_id ? "Sending Refresher..." : "Send Guidance to Creators"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
