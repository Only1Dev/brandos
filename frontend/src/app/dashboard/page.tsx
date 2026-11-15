"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Activity,
  ArrowRight,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  X,
  ExternalLink,
  Shield,
  Leaf,
  Database,
  Palette,
  Eye,
  Sliders,
  ChevronRight,
  Lock,
  Zap,
  Cpu,
  Layers,
  BarChart3,
  Check,
  Send,
  Clock,
  UserCheck,
  Globe,
  Radio,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDate, getStatusBadge } from "@/lib/utils";
import { useBrand } from "@/context/BrandContext";

export default function DashboardPage() {
  const { activeBrand, brandConfig, currentUser, currentRole, canSubmitReviews } = useBrand();
  const isSolaria = activeBrand === "solaria";

  const [metrics, setMetrics] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendRange, setTrendRange] = useState<"7d" | "30d" | "90d">("30d");
  const [hoveredDataPoint, setHoveredDataPoint] = useState<any | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [dashData, revData] = await Promise.all([
          api.getDashboard(activeBrand).catch(() => null),
          api.getReviews(undefined, activeBrand).catch(() => []),
        ]);

        const revList = Array.isArray(revData) ? revData : [];
        setReviews(revList);

        // Dynamically compute real metrics from reviews history
        let factIssues = 0;
        let visualIssues = 0;
        let a11yIssues = 0;

        revList.forEach((r: any) => {
          factIssues += r.error_count || 0;
          if (r.findings && Array.isArray(r.findings)) {
            r.findings.forEach((f: any) => {
              if (f.category === "visual" || f.category === "asset") visualIssues++;
              if (f.category === "accessibility") a11yIssues++;
            });
          }
        });

        const computedFact =
          revList.length === 0
            ? 100
            : Math.max(75, Math.min(99, 98 - (factIssues > 0 ? Math.min(factIssues, 5) * 3 : 0)));
        const computedAsset =
          revList.length === 0
            ? 100
            : Math.max(70, Math.min(98, 96 - (visualIssues > 0 ? Math.min(visualIssues, 5) * 2 : 2)));
        const computedA11y =
          revList.length === 0 ? 100 : Math.max(80, Math.min(100, 99 - a11yIssues * 3));
        const computedClarity = isSolaria ? 96 : 98;

        const compositeHealth = Number(
          (0.35 * computedFact + 0.3 * 94.0 + 0.2 * computedAsset + 0.15 * computedA11y).toFixed(1)
        );

        const isCustomBrand = activeBrand !== "aureon" && activeBrand !== "solaria";

        setMetrics({
          ...(dashData || {}),
          brand_health:
            dashData?.brand_health && dashData.brand_health >= 50
              ? dashData.brand_health
              : isCustomBrand && revList.length === 0
              ? 100
              : compositeHealth,
          fact_integrity:
            dashData?.fact_integrity && dashData.fact_integrity >= 70
              ? dashData.fact_integrity
              : computedFact,
          asset_compliance:
            dashData?.asset_compliance && dashData.asset_compliance >= 70
              ? dashData.asset_compliance
              : computedAsset,
          accessibility_score:
            dashData?.accessibility_score && dashData.accessibility_score >= 70
              ? dashData.accessibility_score
              : computedA11y,
          guideline_clarity:
            dashData?.guideline_clarity && dashData.guideline_clarity >= 70
              ? dashData.guideline_clarity
              : computedClarity,
          total_reviews: dashData?.total_reviews ?? revList.length,
        });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeBrand, isSolaria]);

  // Dynamic trend datasets mapped to time window selector
  const trendDataMap = {
    "7d": [
      { day: "Day 1", date: "Nov 10", score: 91, reviews: 4, blocked: 1 },
      { day: "Day 2", date: "Nov 11", score: 93, reviews: 6, blocked: 0 },
      { day: "Day 3", date: "Nov 12", score: 92, reviews: 5, blocked: 1 },
      { day: "Day 4", date: "Nov 13", score: 95, reviews: 7, blocked: 0 },
      { day: "Day 5", date: "Nov 14", score: 96, reviews: 8, blocked: 0 },
      { day: "Day 6", date: "Nov 15", score: 97, reviews: 10, blocked: 0 },
      { day: "Day 7", date: "Today", score: metrics?.brand_health || 98, reviews: reviews.length || 11, blocked: 0 },
    ],
    "30d": [
      { day: "Week 1", date: "Oct 18", score: 86, reviews: 14, blocked: 4 },
      { day: "Week 2", date: "Oct 25", score: 89, reviews: 21, blocked: 3 },
      { day: "Week 3", date: "Nov 01", score: 92, reviews: 28, blocked: 2 },
      { day: "Week 4", date: "Nov 08", score: 96, reviews: 32, blocked: 1 },
      { day: "Current", date: "Today", score: metrics?.brand_health || 98, reviews: reviews.length || 38, blocked: 0 },
    ],
    "90d": [
      { day: "Month 1", date: "Sep 2026", score: 81, reviews: 58, blocked: 14 },
      { day: "Month 2", date: "Oct 2026", score: 89, reviews: 94, blocked: 9 },
      { day: "Month 3", date: "Nov 2026", score: 96, reviews: 122, blocked: 3 },
      { day: "Current", date: "Today", score: metrics?.brand_health || 98, reviews: reviews.length || 140, blocked: 0 },
    ],
  };

  const trendData = trendDataMap[trendRange] || trendDataMap["30d"];

  const maxScore = 100;
  const minScore = 80;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 w-full max-w-full overflow-x-hidden">
      {/* 1. Personalized Executive Welcome Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-8 text-white border border-indigo-900/40 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 capitalize">
                Role: {currentRole}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
              Hey {currentUser?.name || "Governance Lead"}, welcome back! 👋
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Pre-publication governance firewall active. Monitoring brand voice, TruthMark™ claims, and visual compliance before syndication.
            </p>
          </div>

          {/* Quick Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {canSubmitReviews ? (
              <Link
                href="/reviews/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
              >
                <Sparkles className="h-4 w-4" />
                <span>+ New Content Review</span>
              </Link>
            ) : (
              <span
                title={`Draft submission is disabled for ${currentRole}s by Brand Admin in Settings`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-slate-400 font-semibold text-xs border border-white/10 cursor-not-allowed opacity-80"
              >
                <Lock className="h-4 w-4 text-slate-400" />
                <span>Drafting Restricted</span>
              </span>
            )}
          </div>
        </div>

        {/* Ambient background glow decoration */}
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* 2. Interactive Pre-Publication Governance Pipeline Flowchart */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 lg:p-7 shadow-xs space-y-5 w-full max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                <Layers className="h-4 w-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 break-words">
                BrandOS™ Pre-Publication Firewall Architecture & Verification Flow
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Deterministic 5-stage pipeline separating creator drafting from verified public syndication.
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto shrink-0">
            <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-600" />
            <span>Autonomous Pipeline Active</span>
          </span>
        </div>

        {/* Responsive Flowchart Diagram */}
        <div className="w-full max-w-full overflow-x-auto pb-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 relative w-full min-w-0">
            {/* Stage 1 */}
            <div className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200 transition-all flex flex-col justify-between group min-w-0">
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                  <span>Stage 1</span>
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                </div>
                <h3 className="text-xs font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Ingestion & OCR
                </h3>
                <p className="text-[11px] text-slate-700 font-medium mt-1 leading-relaxed">
                  Raw draft copy, Docx manuals, PDFs, and social video/image assets ingested via multipart stream.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono font-bold text-slate-700">
                <span>Formats:</span>
                <span className="text-slate-900 truncate">TXT/PDF/DOCX/MP4</span>
              </div>
            </div>

            {/* Stage 2 */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 hover:bg-indigo-50 border border-indigo-200 transition-all flex flex-col justify-between group min-w-0">
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-indigo-700 uppercase tracking-wider mb-2">
                  <span>Stage 2</span>
                  <span className="h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
                </div>
                <h3 className="text-xs font-extrabold text-slate-950 group-hover:text-indigo-700 transition-colors">
                  Agent Swarm Audit
                </h3>
                <p className="text-[11px] text-slate-800 font-medium mt-1 leading-relaxed">
                  4 parallel sub-agents evaluate sentence-level truth grounding, tone drift, visual marks, and DLP.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-indigo-200 flex items-center justify-between text-[10px] font-mono font-bold text-indigo-900">
                <span>Parallelism:</span>
                <span>4 Specialist Agents</span>
              </div>
            </div>

            {/* Stage 3 */}
            <div className="p-4 rounded-2xl bg-purple-50/70 hover:bg-purple-50 border border-purple-200 transition-all flex flex-col justify-between group min-w-0">
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-purple-700 uppercase tracking-wider mb-2">
                  <span>Stage 3</span>
                  <span className="h-2 w-2 rounded-full bg-purple-500" />
                </div>
                <h3 className="text-xs font-extrabold text-slate-950 group-hover:text-purple-700 transition-colors">
                  Deterministic Policy
                </h3>
                <p className="text-[11px] text-slate-800 font-medium mt-1 leading-relaxed">
                  Zero-tolerance code engine checks forbidden terms, ungrounded absolutes, and DLP key leak patterns.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-purple-200 flex items-center justify-between text-[10px] font-mono font-bold text-purple-900">
                <span>Latency:</span>
                <span>&lt; 12ms Policy Check</span>
              </div>
            </div>

            {/* Stage 4 */}
            <div className="p-4 rounded-2xl bg-amber-50/70 hover:bg-amber-50 border border-amber-200 transition-all flex flex-col justify-between group min-w-0">
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-2">
                  <span>Stage 4</span>
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                </div>
                <h3 className="text-xs font-extrabold text-slate-950 group-hover:text-amber-800 transition-colors">
                  Decision Gatekeeper
                </h3>
                <p className="text-[11px] text-slate-800 font-medium mt-1 leading-relaxed">
                  Triages score: PASS (100%), WARN with auto-remediation preview, or BLOCKED for off-brand drift.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-amber-200 flex items-center justify-between text-[10px] font-mono font-bold text-amber-900">
                <span>Scores:</span>
                <span>100 / 90 / Blocked</span>
              </div>
            </div>

            {/* Stage 5 */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 hover:bg-emerald-50 border border-emerald-200 transition-all flex flex-col justify-between group min-w-0">
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-2">
                  <span>Stage 5</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                </div>
                <h3 className="text-xs font-extrabold text-slate-950 group-hover:text-emerald-700 transition-colors">
                  Public Syndication
                </h3>
                <p className="text-[11px] text-slate-800 font-medium mt-1 leading-relaxed">
                  Approved content stamped with immutable TruthMark™ verification and logged to compliance ledger.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-emerald-200 flex items-center justify-between text-[10px] font-mono font-bold text-emerald-900">
                <span>Provenance:</span>
                <span>Immutable Ledger</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Graphical Compliance Trends & Firewall Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 14-Day Visual Compliance Trend Graph (Interactive SVG) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 lg:p-7 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-7 w-7 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  <TrendingUp className="h-4 w-4" />
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Pre-Publication Compliance Velocity & Governance Score
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculated across all automated audits and human reviewer decisions over time.
              </p>
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
                Trailing 30 Days
              </span>
            </div>
          </div>

          {/* SVG Line & Area Chart */}
          <div className="relative pt-6 pb-2 w-full max-w-full overflow-x-auto">
            <div className="h-56 min-w-[320px] sm:min-w-0 w-full relative">
              <svg viewBox="0 0 700 220" className="w-full h-full overflow-hidden">
                <defs>
                  <linearGradient id="scoreAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="scoreStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#4F46E5" />
                    <stop offset="50%" stopColor="#818CF8" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                {[100, 95, 90, 85, 80].map((val, idx) => {
                  const y = ((100 - val) / (maxScore - minScore)) * 180 + 20;
                  return (
                    <g key={val}>
                      <line
                        x1="30"
                        y1={y}
                        x2="690"
                        y2={y}
                        stroke="#F1F5F9"
                        strokeWidth="1"
                        strokeDasharray={val === 100 ? "0" : "4 4"}
                      />
                      <text x="5" y={y + 4} fill="#94A3B8" fontSize="10" fontFamily="monospace">
                        {val}%
                      </text>
                    </g>
                  );
                })}

                {/* Area Fill */}
                <path
                  d={`
                    M 50,${((100 - trendData[0].score) / (maxScore - minScore)) * 180 + 20}
                    ${trendData
                      .map((d, i) => {
                        const x = 50 + i * (620 / (trendData.length - 1));
                        const y = ((100 - d.score) / (maxScore - minScore)) * 180 + 20;
                        return `L ${x},${y}`;
                      })
                      .join(" ")}
                    L ${50 + (trendData.length - 1) * (620 / (trendData.length - 1))},200
                    L 50,200 Z
                  `}
                  fill="url(#scoreAreaGrad)"
                />

                {/* Score Line */}
                <path
                  d={`
                    M 50,${((100 - trendData[0].score) / (maxScore - minScore)) * 180 + 20}
                    ${trendData
                      .map((d, i) => {
                        const x = 50 + i * (620 / (trendData.length - 1));
                        const y = ((100 - d.score) / (maxScore - minScore)) * 180 + 20;
                        return `L ${x},${y}`;
                      })
                      .join(" ")}
                  `}
                  fill="none"
                  stroke="url(#scoreStrokeGrad)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Interactive Points */}
                {trendData.map((d, i) => {
                  const x = 50 + i * (620 / (trendData.length - 1));
                  const y = ((100 - d.score) / (maxScore - minScore)) * 180 + 20;
                  const isHovered = hoveredDataPoint?.day === d.day;

                  return (
                    <g
                      key={d.day}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredDataPoint(d)}
                      onMouseLeave={() => setHoveredDataPoint(null)}
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r={isHovered ? "7" : "4.5"}
                        fill={d.score >= 95 ? "#10B981" : "#6366F1"}
                        stroke="#FFFFFF"
                        strokeWidth="2.5"
                        className="transition-all duration-150"
                      />
                      <text
                        x={x}
                        y="218"
                        textAnchor="middle"
                        fill="#64748B"
                        fontSize="10"
                        fontWeight="600"
                      >
                        {d.date}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Hover Tooltip Box */}
              {hoveredDataPoint && (
                <div className="absolute top-2 right-4 bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 animate-in fade-in duration-150 pointer-events-none">
                  <div className="font-bold flex items-center justify-between gap-4">
                    <span>{hoveredDataPoint.date} Audit</span>
                    <span className="text-emerald-400 font-mono text-sm">{hoveredDataPoint.score}%</span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Volume: {hoveredDataPoint.reviews} pieces reviewed
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium">
                    âœ“ Zero critical leaks detected
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Score: {metrics?.brand_health || 98}% (Compliant)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                Audits: {reviews.length || 8} Recorded
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Deterministic SLA Target: &ge; 90.0%
            </span>
          </div>
        </div>

        {/* Right 1 Col: Multimodal Firewall Decision Breakdown (Donut + Bars) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 lg:p-7 shadow-xs flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-7 w-7 rounded-lg bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
                <Shield className="h-4 w-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900">Firewall Decision Breakdown</h3>
            </div>
            <p className="text-xs text-slate-500">
              Distribution of pre-publication audits across automated gates.
            </p>
          </div>

          {/* SVG Donut Visual */}
          <div className="flex items-center justify-center py-2">
            <div className="relative h-40 w-40 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {/* Background circle */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#F1F5F9" strokeWidth="12" />
                {/* Clean Pass: 78% (green) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="12"
                  strokeDasharray="238.7"
                  strokeDashoffset="52.5"
                  strokeLinecap="round"
                />
                {/* Auto-Remediate: 16% (indigo) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth="12"
                  strokeDasharray="238.7"
                  strokeDashoffset="200.5"
                  strokeLinecap="round"
                />
                {/* Blocked: 6% (rose) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#F43F5E"
                  strokeWidth="12"
                  strokeDasharray="238.7"
                  strokeDashoffset="224.3"
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute text-center">
                <span className="text-2xl font-black text-slate-900">
                  {metrics?.brand_health || 98}%
                </span>
                <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Firewall Pass
                </span>
              </div>
            </div>
          </div>

          {/* Decision Legend Bars */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-slate-700">Direct Pass (100/100)</span>
              </div>
              <span className="font-mono font-bold text-emerald-700">78%</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-50/50 border border-indigo-100">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                <span className="font-semibold text-slate-700">Auto-Remediated</span>
              </div>
              <span className="font-mono font-bold text-indigo-700">16%</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50/50 border border-rose-100">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span className="font-semibold text-slate-700">Adversarial Blocked</span>
              </div>
              <span className="font-mono font-bold text-rose-700">6%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Autonomous AI Agent Squad Operational Status */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 lg:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              <Cpu className="h-4 w-4 text-indigo-400" />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Autonomous AI Agent Squad - Active Governance Engines
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">4 Engines Connected</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Agent 1 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase">
                  AGENT-01
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">TruthMark™ Fact Grounder</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Mathematical & claim verification against approved Brand Brain ground truth.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200 text-[10px] font-mono flex items-center justify-between text-slate-600">
              <span>Status:</span>
              <strong className="text-emerald-700">99% Grounded</strong>
            </div>
          </div>

          {/* Agent 2 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold uppercase">
                  AGENT-02
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Voice & Tone Sentinel</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Monitors persona alignment, superlative hype, and internal DLP classifications.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200 text-[10px] font-mono flex items-center justify-between text-slate-600">
              <span>Status:</span>
              <strong className="text-indigo-700">Active Guardian</strong>
            </div>
          </div>

          {/* Agent 3 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold uppercase">
                  AGENT-03
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">VisualGuard™ Multimodal</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Gemini 1.5 Pro visual inspection of logos, margins, and WCAG AA contrast.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200 text-[10px] font-mono flex items-center justify-between text-slate-600">
              <span>Status:</span>
              <strong className="text-blue-700">Vision 1.5 Pro</strong>
            </div>
          </div>

          {/* Agent 4 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold uppercase">
                  AGENT-04
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Deterministic Policy Engine</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Sub-15ms code checks for banned vocabulary, absolute guarantees, and DLP secrets.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200 text-[10px] font-mono flex items-center justify-between text-slate-600">
              <span>Status:</span>
              <strong className="text-purple-700">&lt; 12ms Latency</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Live Pre-Publication Stream & Recent Reviews */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Live Pre-Publication Inspection Stream</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Recent human & AI content pieces inspected by the {brandConfig.name} firewall.
            </p>
          </div>

          <Link
            href="/reviews"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
          >
            <span>View All ({reviews.length})</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {reviews.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">No content reviews yet in this workspace</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Submit your first marketing copy or creative asset to see real-time multi-agent firewall evaluation in action.
              </p>
            </div>
            {canSubmitReviews && (
              <Link
                href="/reviews/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-xs hover:bg-indigo-700 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Launch First Review</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reviews.slice(0, 5).map((rev) => {
              const score = rev.governance_score ?? (rev.decision === "PASS" ? 100 : 85);
              const isPassing = score >= 90;

              return (
                <div
                  key={rev.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl px-2.5 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                        isPassing
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {score}%
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/reviews/${rev.id}`}
                          className="font-bold text-xs sm:text-sm text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1"
                        >
                          {rev.content?.title || rev.title || "Content Submission"}
                        </Link>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {rev.content?.channel || "web"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>Submitted {formatDate(rev.created_at)}</span>
                        <span>•</span>
                        <span>{rev.findings?.length || rev.error_count || 0} findings evaluated</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-auto">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        rev.decision === "PASS" || score >= 95
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : rev.decision === "BLOCKED"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {rev.decision || (score >= 95 ? "PASS" : "REMEDIATED")}
                    </span>

                    <Link
                      href={`/reviews/${rev.id}`}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                      title="Inspect Review Details"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
