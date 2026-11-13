"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Filter,
  Search,
  Sparkles,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDate, getStatusBadge } from "@/lib/utils";
import { useBrand } from "@/context/BrandContext";

export default function ReviewsListPage() {
  const { activeBrand, brandConfig, canEditBrandBrain } = useBrand();
  const [reviews, setReviews] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const filter = statusFilter === "all" ? undefined : statusFilter;
      const data = await api.getReviews(filter, activeBrand);
      setReviews(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [statusFilter, activeBrand]);

  const handleDeleteReview = async (id: string, title: string) => {
    if (!confirm(`Delete review record for "${title}"?`)) return;
    try {
      setDeletingId(id);
      await api.deleteReview(id);
      await loadReviews();
    } catch (e: any) {
      alert("Delete failed: " + e.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Filter reviews
  const filteredReviews = reviews.filter((rev) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      rev.content_title?.toLowerCase().includes(q) ||
      rev.creator_name?.toLowerCase().includes(q) ||
      rev.creator_email?.toLowerCase().includes(q) ||
      rev.channel?.toLowerCase().includes(q) ||
      rev.decision?.toLowerCase().includes(q)
    );
  });

  const totalReviews = reviews.length;
  const blockedCount = reviews.filter((r) => (r.decision || r.status) === "BLOCKED" || (r.decision || r.status) === "REJECTED").length;
  const passedCount = reviews.filter((r) => (r.decision || r.status) === "PASS" || (r.decision || r.status) === "APPROVED").length;
  const reviewRequiredCount = reviews.filter((r) => (r.decision || r.status) === "REVIEW_REQUIRED").length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              BrandFlow™ Governance Firewall
            </span>
            <span className="text-xs text-slate-400">• {brandConfig.name}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Pre-Publication Content Firewall & Reviews
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated multi-agent inspection stream auditing text, claims, and visual assets before distribution.
          </p>
        </div>
      </div>

      {/* Firewall Performance Stream KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Submissions
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalReviews}</div>
          <div className="text-[11px] text-slate-400 mt-1">Multi-channel campaigns</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Firewall Intercepted
          </div>
          <div className="text-2xl font-extrabold text-red-600 mt-1">{blockedCount}</div>
          <div className="text-[11px] text-red-600 font-semibold mt-1">
            Perimeter violations quarantined
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Approved &amp; Certified
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{passedCount}</div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">Ready for distribution</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Audit Latency SLA
          </div>
          <div className="text-2xl font-extrabold text-indigo-600 mt-1">1.2s</div>
          <div className="text-[11px] text-indigo-600 font-semibold mt-1">
            Deterministic + Vision pipeline
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Reviews", count: totalReviews },
            { id: "completed", label: "Passed (Clean)", count: passedCount },
            { id: "review_required", label: "Needs Sign-off", count: reviewRequiredCount },
            { id: "rejected", label: "Firewall Blocked", count: blockedCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === tab.id ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reviews by title, creator..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading firewall reviews stream...</div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ShieldCheck className="h-8 w-8 text-slate-300 mx-auto" />
            <div className="text-xs font-bold text-slate-700">No review records found</div>
            <p className="text-[11px] text-slate-400">
              {searchQuery
                ? "No reviews match your query."
                : `No reviews found for ${brandConfig.name} in this status.`}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Content &amp; Directive</th>
                <th className="py-3.5 px-4">Submitter</th>
                <th className="py-3.5 px-4">Channel</th>
                <th className="py-3.5 px-4">Firewall Verdict</th>
                <th className="py-3.5 px-4">Governance Score</th>
                <th className="py-3.5 px-4">Pillar Findings</th>
                <th className="py-3.5 px-4 text-right">Audit &amp; Remediate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReviews.map((rev) => {
                const isBlocked = (rev.decision || rev.status) === "BLOCKED" || (rev.decision || rev.status) === "REJECTED";
                const isPass = (rev.decision || rev.status) === "PASS" || (rev.decision || rev.status) === "APPROVED";

                return (
                  <tr key={rev.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-900 max-w-xs">
                      <div className="truncate">{rev.content_title}</div>
                      {rev.reviewer_comment ? (
                        <div className="text-[10px] text-amber-800 bg-amber-50 rounded-md px-2 py-0.5 mt-1 border border-amber-200 inline-flex items-center gap-1 font-medium truncate max-w-[260px]">
                          <span>Directive:</span>
                          <span className="truncate">{rev.reviewer_comment}</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          ID: {rev.id.slice(0, 8)}...
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-800">
                        {rev.creator_name || "Enterprise Creator"}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                        {rev.creator_email || "creator@enterprise.internal"}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 capitalize border border-slate-200">
                        {rev.channel || "General"}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase border flex items-center gap-1 w-max ${
                          isPass
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : isBlocked
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {isPass ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : isBlocked ? (
                          <XCircle className="h-3.5 w-3.5" />
                        ) : (
                          <AlertTriangle className="h-3.5 w-3.5" />
                        )}
                        <span>{rev.decision || rev.status}</span>
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-baseline gap-1">
                        <span
                          className={`font-mono text-base font-extrabold ${
                            Number(rev.governance_score) >= 85
                              ? "text-emerald-600"
                              : Number(rev.governance_score) >= 60
                              ? "text-amber-600"
                              : "text-red-600"
                          }`}
                        >
                          {rev.governance_score !== null ? rev.governance_score : "0"}
                        </span>
                        <span className="text-[10px] text-slate-400">/ 100</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {rev.error_count > 0 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            {rev.error_count} Critical
                          </span>
                        )}
                        {rev.warning_count > 0 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {rev.warning_count} Warning
                          </span>
                        )}
                        {(rev.error_count || 0) === 0 && (rev.warning_count || 0) === 0 && (
                          <span className="text-emerald-700 text-[11px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> 100% Clean
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/reviews/${rev.id}`}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold text-xs transition-all shadow-2xs flex items-center gap-1 group"
                        >
                          <span>Deep Audit</span>
                          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>

                        {canEditBrandBrain && (
                          <button
                            onClick={() => handleDeleteReview(rev.id, rev.content_title)}
                            disabled={deletingId === rev.id}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Purge review record"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
