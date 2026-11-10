"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  AlertTriangle,
  Clock,
  Sparkles,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { api } from "@/lib/api";

export default function AnalyticsPage() {
  const [drift, setDrift] = useState<any[]>([]);
  const [expiring, setExpiring] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [driftData, expiringData, dashData] = await Promise.all([
          api.getGuidelineDrift().catch(() => []),
          api.getExpiringClaims(30).catch(() => []),
          api.getDashboard().catch(() => null),
        ]);
        setDrift(driftData);
        setExpiring(expiringData);
        setDashboard(dashData);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Governance Intelligence & Drift Detection</h1>
        <p className="text-sm text-slate-500 mt-1">
          Turns review data into organizational intelligence: identifies ambiguous guidelines, expiring claims, and recurring risks.
        </p>
      </div>

      {/* Differentiator 1: Guideline Drift Detection (PRD FR-25) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Guideline Drift & Ambiguity Detection</h2>
              <p className="text-xs text-slate-500">
                Rules repeatedly misunderstood or triggered at high volume across creators.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded text-xs font-bold">
            Automated Root-Cause Detection
          </span>
        </div>

        <div className="space-y-4">
          {drift.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-amber-50/40 border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                  {item.rule_id}
                </span>
                <span className="text-xs font-bold text-red-600">
                  Triggered {item.trigger_count} times ({item.misinterpretation_rate}% creator misinterpretation rate)
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900">{item.rule_name}</div>
              <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-amber-200 font-medium">
                💡 <strong>Intelligence Recommendation: </strong> {item.recommendation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Differentiator 2: Proactive Claim Expiration Warnings (PRD FR-26) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Clock className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Proactive Claim Expiration Warnings</h2>
              <p className="text-xs text-slate-500">
                Identifies claims approaching validity expiration before published content becomes legally outdated.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-500">30-day lookahead window</span>
        </div>

        <div className="space-y-3">
          {expiring.map((claim, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                    ⚠️ Expires in {claim.days_remaining} days ({claim.valid_until})
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Appears in <strong className="text-slate-800">{claim.affected_content_items} published content assets</strong>
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-800">{claim.statement}</div>
              </div>
              <button className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors whitespace-nowrap">
                Review Affected Content
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recurring Issues Detailed List (PRD FR-24) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900">Top Governance Violations (Last 30 Days)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-2xl font-black text-red-600">37</span>
            <div className="font-bold text-xs text-slate-800">Unsupported Numerical Claims</div>
            <p className="text-[11px] text-slate-500">Creators claiming percentages not backed by audited facts database.</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-2xl font-black text-amber-600">24</span>
            <div className="font-bold text-xs text-slate-800">Prohibited Absolute Guarantees</div>
            <p className="text-[11px] text-slate-500">Usage of &quot;100% protection&quot; or &quot;zero risk&quot; across campaigns.</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-2xl font-black text-indigo-600">19</span>
            <div className="font-bold text-xs text-slate-800">Deprecated Terminology Usage</div>
            <p className="text-[11px] text-slate-500">Using phased-out terminology instead of preferred naming conventions.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
