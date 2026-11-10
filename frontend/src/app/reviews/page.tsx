"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ShieldCheck, Filter, Search, Sparkles, Trash2 } from "lucide-react";
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
      setReviews(data);
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
      rev.channel?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Content Reviews & Firewall</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {brandConfig?.name || "Active Brand"}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Pre-publication governance reviews across text, documents, and visual content.
          </p>
        </div>
        <Link
          href="/reviews/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Review</span>
        </Link>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["all", "completed", "review_required", "approved", "rejected", "pending"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                statusFilter === s
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reviews..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading reviews...</div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ShieldCheck className="h-8 w-8 text-slate-300 mx-auto" />
            <div className="text-xs font-bold text-slate-700">No reviews found</div>
            <p className="text-[11px] text-slate-400">
              {searchQuery
                ? "No reviews match your search query."
                : `No reviews recorded for ${brandConfig?.name || "this workspace"} with status "${statusFilter}".`}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Content Title</th>
                <th className="py-3.5 px-4">Creator / Submitter</th>
                <th className="py-3.5 px-4">Channel</th>
                <th className="py-3.5 px-4">Verdict</th>
                <th className="py-3.5 px-4">Governance Score</th>
                <th className="py-3.5 px-4">Findings Breakdown</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReviews.map((rev) => (
                <tr key={rev.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4 font-bold text-slate-900">
                    <div>{rev.content_title}</div>
                    {rev.reviewer_comment && (
                      <div className="text-[10px] text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 mt-1 border border-amber-200 inline-flex items-center gap-1 font-medium">
                        <span>Directive:</span>
                        <span className="truncate max-w-[200px]">{rev.reviewer_comment}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-semibold text-slate-800">{rev.creator_name || "Enterprise Creator"}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{rev.creator_email}</div>
                  </td>
                  <td className="py-4 px-4 text-slate-600 capitalize">{rev.channel}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getStatusBadge(rev.decision || rev.status)}`}>
                      {rev.decision || rev.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-extrabold text-slate-900 text-sm">
                    {rev.governance_score !== null ? `${rev.governance_score}/100` : "Pending"}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 font-medium">
                      {rev.error_count > 0 && (
                        <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 text-[11px] font-bold">
                          {rev.error_count} Critical/High
                        </span>
                      )}
                      {rev.warning_count > 0 && (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px] font-semibold">
                          {rev.warning_count} Medium
                        </span>
                      )}
                      {rev.total_findings === 0 && <span className="text-emerald-700 font-semibold">Clean (0)</span>}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-500">{formatDate(rev.created_at)}</td>
                  <td className="py-4 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Link
                        href={`/reviews/${rev.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white font-semibold transition-colors"
                      >
                        Open Review
                      </Link>
                      {canEditBrandBrain && (
                        <button
                          onClick={() => handleDeleteReview(rev.id, rev.content_title)}
                          disabled={deletingId === rev.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete review record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}