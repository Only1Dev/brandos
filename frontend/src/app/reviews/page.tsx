"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ShieldCheck, Filter, Search, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate, getStatusBadge } from "@/lib/utils";

export default function ReviewsListPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const filter = statusFilter === "all" ? undefined : statusFilter;
        const data = await api.getReviews(filter);
        setReviews(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Content Reviews & Firewall</h1>
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

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {["all", "completed", "review_required", "approved", "rejected", "pending"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              statusFilter === s
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reviews.map((rev) => (
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
                  <Link
                    href={`/reviews/${rev.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white font-semibold transition-colors"
                  >
                    Open Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
