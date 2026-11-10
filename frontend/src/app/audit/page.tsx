"use client";

import { useEffect, useState } from "react";
import { History, Shield, Filter, Search, CheckCircle2, User, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("");

  const loadAudit = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs(undefined, filterAction || undefined);
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, [filterAction]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Immutable Compliance Audit Trail</h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete provenance log connecting Content → Finding → Rule/Evidence → AI Recommendation → Human Decision → Approval.
          </p>
        </div>
        <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-emerald-600" />
          <span>Immutable Ledger Active</span>
        </span>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white text-slate-700"
        >
          <option value="">All Governance Actions</option>
          <option value="review_analyzed">Review Analyzed</option>
          <option value="suggestion_accepted">Suggestion Accepted</option>
          <option value="finding_overridden">Finding Overridden</option>
          <option value="review_approved">Review Approved</option>
          <option value="review_rejected">Review Rejected</option>
          <option value="rule_created">Rule Created</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Action Event</th>
              <th className="py-3 px-4">Entity Type</th>
              <th className="py-3 px-4">Entity ID</th>
              <th className="py-3 px-4">Audit Details & Provenance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <History className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  No audit events recorded for current filter.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[11px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 capitalize text-slate-600">{log.entity_type}</td>
                  <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400">{log.entity_id ? log.entity_id.slice(0, 8) + "..." : "—"}</td>
                  <td className="py-3.5 px-4 text-slate-700 text-[11px]">
                    {log.details ? (
                      typeof log.details === "object" ? (
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {log.details.score !== undefined && (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                log.details.score >= 85
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : "bg-red-100 text-red-800 border border-red-300"
                              }`}
                            >
                              Score: {log.details.score}/100
                            </span>
                          )}
                          {log.details.decision && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                              {log.details.decision}
                            </span>
                          )}
                          {log.details.admin_override && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              Admin Override
                            </span>
                          )}
                          {log.details.findings !== undefined && (
                            <span className="text-[10px] text-slate-500 font-medium">
                              ({log.details.findings} findings)
                            </span>
                          )}
                          {log.details.replacement && (
                            <span className="text-slate-700 truncate max-w-xs font-mono text-[10px] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                              → {log.details.replacement}
                            </span>
                          )}
                          {log.details.comment && (
                            <span className="text-slate-600 italic">
                              "{log.details.comment}"
                            </span>
                          )}
                          {log.details.rule_code && (
                            <span className="font-mono text-[10px] text-indigo-700">
                              Rule: {log.details.rule_code}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="font-mono text-slate-600">{String(log.details)}</span>
                      )
                    ) : (
                      <span className="text-slate-400 italic">Provenance verified</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
