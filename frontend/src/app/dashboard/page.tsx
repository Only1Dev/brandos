"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  Activity,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDate, getStatusBadge } from "@/lib/utils";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [dashData, revData] = await Promise.all([
          api.getDashboard().catch(() => ({
            brand_health: 92,
            fact_integrity: 87,
            asset_compliance: 94,
            accessibility_score: 96,
            guideline_clarity: 72,
            total_reviews: 14,
            severity_breakdown: { error: 2, warning: 5, info: 7 },
            recurring_issues: [
              { name: "Unsupported Claims", count: 24 },
              { name: "Terminology Mismatch", count: 18 },
              { name: "Prohibited Guarantees", count: 12 },
              { name: "Contrast Ratio", count: 7 },
              { name: "Outdated Logo", count: 4 },
            ],
          })),
          api.getReviews().catch(() => []),
        ]);
        setMetrics(dashData);
        setReviews(revData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Title & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-200">
              BrandPulse™ • Live Governance Intelligence
            </span>
            <span className="text-xs text-slate-400">• Enterprise Overview</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Governance Intelligence Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time organizational content integrity and pre-publication firewall health across human and AI creators.
          </p>
        </div>
      </div>

      {/* BrandOS 5 Core Modules Strip (PRD Section 5) */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <Link href="/knowledge/guidelines" className="p-3.5 bg-white hover:bg-indigo-50/30 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all shadow-xs group">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
              Module 1
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
          </div>
          <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">BrandOS Core™</div>
          <div className="text-[11px] text-slate-500 mt-0.5">AI Brand Brain & PDF RAG Ingestion</div>
        </Link>

        <Link href="/knowledge/facts" className="p-3.5 bg-white hover:bg-emerald-50/30 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all shadow-xs group">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              Module 2
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          </div>
          <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">TruthMark™</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Fact & Claim Verification Engine</div>
        </Link>

        <Link href="/knowledge/assets" className="p-3.5 bg-white hover:bg-purple-50/30 rounded-xl border border-slate-200 hover:border-purple-300 transition-all shadow-xs group">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
              Module 3
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span>
          </div>
          <div className="text-xs font-bold text-slate-900 group-hover:text-purple-600 transition-colors">VisualGuard™</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Logo, Color & Accessibility Auditor</div>
        </Link>

        <Link href="/reviews" className="p-3.5 bg-white hover:bg-blue-50/30 rounded-xl border border-slate-200 hover:border-blue-300 transition-all shadow-xs group">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
              Module 4
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
          </div>
          <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">BrandFlow™</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Human Approval & Revision Workflow</div>
        </Link>

        <Link href="/analytics" className="p-3.5 bg-white hover:bg-amber-50/30 rounded-xl border border-slate-200 hover:border-amber-300 transition-all shadow-xs group">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              Module 5
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
          </div>
          <div className="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition-colors">BrandPulse™</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Governance Analytics & Drift Intelligence</div>
        </Link>
      </div>

      {/* Primary KPI Grid (PRD FR-27) */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Overall Brand Health */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Brand Health</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <ShieldCheck className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{metrics?.brand_health || 92}</span>
            <span className="text-xs font-medium text-slate-400">/ 100</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>+4.2% this month</span>
          </div>
        </div>

        {/* Fact Integrity */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Fact Integrity</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{metrics?.fact_integrity || 87}%</span>
          </div>
          <div className="mt-3 text-xs text-slate-500">Supported by verified facts</div>
        </div>

        {/* Asset Compliance */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Asset Compliance</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Activity className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{metrics?.asset_compliance || 94}%</span>
          </div>
          <div className="mt-3 text-xs text-slate-500">Current version logos & assets</div>
        </div>

        {/* Accessibility */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Accessibility</span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{metrics?.accessibility_score || 96}%</span>
          </div>
          <div className="mt-3 text-xs text-slate-500">WCAG AA compliance score</div>
        </div>

        {/* Guideline Clarity */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Guideline Clarity</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{metrics?.guideline_clarity || 72}%</span>
          </div>
          <div className="mt-3 text-xs text-amber-600 font-medium">1 guideline requires clarification</div>
        </div>
      </div>

      {/* Middle Row: Recurring Issues + Firewall Active Agents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recurring Issues (PRD FR-24) */}
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Recurring Governance Violations</h2>
              <p className="text-xs text-slate-500 mt-0.5">Top repeated issues detected across channels in the last 30 days</p>
            </div>
            <Link href="/analytics" className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              Deep Analysis <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {metrics?.recurring_issues?.map((issue: any, idx: number) => {
              const maxCount = metrics.recurring_issues[0]?.count || 30;
              const pct = Math.round((issue.count / maxCount) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-800 font-medium">{issue.name}</span>
                    <span className="text-slate-500">{issue.count} occurrences</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        idx === 0 ? "bg-red-500" : idx === 1 ? "bg-amber-500" : "bg-indigo-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Governance Firewall Status Card */}
        <div className="p-6 bg-slate-900 text-white rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold text-indigo-400 tracking-wider">Governance Firewall</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <h3 className="text-lg font-bold mt-2">Active Pre-Publication Shield</h3>
            <p className="text-xs text-slate-400 mt-1">
              Multi-agent pipeline running across Groq (Llama 3.3 70B), Gemini 2.0 Vision, and deterministic rules.
            </p>

            <div className="mt-5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-slate-800/80 border border-slate-700">
                <span className="text-slate-300">Brand Agent (Tone / Voice)</span>
                <span className="text-emerald-400 font-semibold">Active</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-800/80 border border-slate-700">
                <span className="text-slate-300">Fact Agent (Claim RAG)</span>
                <span className="text-emerald-400 font-semibold">Active</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-800/80 border border-slate-700">
                <span className="text-slate-300">Terminology Rule Engine</span>
                <span className="text-emerald-400 font-semibold">Deterministic</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-800/80 border border-slate-700">
                <span className="text-slate-300">Visual Agent (Gemini Vision)</span>
                <span className="text-emerald-400 font-semibold">Active</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-800/80 border border-slate-700">
                <span className="text-slate-300">Devil's Advocate Agent</span>
                <span className="text-emerald-400 font-semibold">Active</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Model Router: 3 Keys Pool</span>
            <span className="text-emerald-400 font-medium">0 Rate Limits</span>
          </div>
        </div>
      </div>

      {/* Recent Reviews Table */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Recent Content Reviews</h2>
            <p className="text-xs text-slate-500 mt-0.5">Content submissions evaluated by the governance firewall</p>
          </div>
          <Link href="/reviews" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            View All Reviews <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {reviews.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <div className="text-sm font-semibold text-slate-700">No content reviews yet</div>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Submit your first marketing copy, campaign draft, or social post to inspect brand and factual integrity.
            </p>
            <Link
              href="/reviews/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 mt-4 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm"
            >
              Start New Review
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Content Title</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Status / Verdict</th>
                  <th className="py-3 px-4">Gov Score</th>
                  <th className="py-3 px-4">Findings</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviews.slice(0, 8).map((rev) => (
                  <tr key={rev.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{rev.content_title}</td>
                    <td className="py-3.5 px-4 text-slate-600 capitalize">{rev.channel}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getStatusBadge(rev.decision || rev.status)}`}>
                        {rev.decision || rev.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {rev.governance_score !== null ? (
                        <span className="font-bold text-slate-900">{rev.governance_score}/100</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-medium">
                        {rev.error_count > 0 && (
                          <span className="text-red-600 bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                            {rev.error_count} High
                          </span>
                        )}
                        {rev.warning_count > 0 && (
                          <span className="text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            {rev.warning_count} Med
                          </span>
                        )}
                        {rev.total_findings === 0 && <span className="text-emerald-600 font-semibold">0 Issues</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{formatDate(rev.created_at)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/reviews/${rev.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 font-semibold transition-colors"
                      >
                        Inspect Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
