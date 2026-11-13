"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Filter,
  AlertCircle,
  CheckCircle2,
  Lock,
  Eye,
  ExternalLink,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Layers,
  Copy,
  Check,
  X,
  Share2,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useBrand } from "@/context/BrandContext";

export default function ContentPage() {
  const { activeBrand, brandConfig, canEditBrandBrain, currentRole } = useBrand();
  const [contentList, setContentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Quick preview modal state
  const [previewContent, setPreviewContent] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadContent = async () => {
    try {
      setLoading(true);
      const data = await api.getContentList(activeBrand);
      setContentList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setContentList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [activeBrand]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}" and all associated review versions?`)) {
      return;
    }
    try {
      setDeletingId(id);
      await api.deleteContent(id);
      await loadContent();
    } catch (e: any) {
      alert("Delete failed: " + e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenPreview = async (item: any) => {
    setPreviewContent(item);
    setPreviewLoading(true);
    try {
      const details = await api.getContentDetails(item.id);
      if (details) {
        setPreviewContent((prev: any) => ({ ...prev, ...details }));
      }
    } catch (e) {
      console.error("Failed to load full content details:", e);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Derive stats
  const totalCount = contentList.length;
  const approvedCount = contentList.filter(
    (c) => c.review_decision === "PASS" || (c.review_score && c.review_score >= 85)
  ).length;
  const quarantinedCount = contentList.filter(
    (c) => c.review_decision === "BLOCKED" || (c.review_score && c.review_score < 70)
  ).length;
  const underReviewCount = Math.max(0, totalCount - approvedCount - quarantinedCount);

  // Channel helper
  const getChannelBadge = (channel: string) => {
    const ch = (channel || "").toLowerCase();
    if (ch.includes("instagram")) {
      return {
        label: "Instagram",
        bg: "bg-pink-50 text-pink-700 border-pink-200",
        icon: "📷",
      };
    }
    if (ch.includes("linkedin")) {
      return {
        label: "LinkedIn",
        bg: "bg-sky-50 text-sky-700 border-sky-200",
        icon: "💼",
      };
    }
    if (ch.includes("press") || ch.includes("release")) {
      return {
        label: "Press Release",
        bg: "bg-amber-50 text-amber-800 border-amber-200",
        icon: "📰",
      };
    }
    if (ch.includes("memo") || ch.includes("internal")) {
      return {
        label: "Internal Memo",
        bg: "bg-purple-50 text-purple-700 border-purple-200",
        icon: "📑",
      };
    }
    if (ch.includes("audit") || ch.includes("financial") || ch.includes("document")) {
      return {
        label: "Document",
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: "📊",
      };
    }
    return {
      label: channel || "General",
      bg: "bg-slate-100 text-slate-700 border-slate-200",
      icon: "🌐",
    };
  };

  // Filter content
  const filteredList = contentList.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.channel?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.raw_snippet?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      selectedType === "all" ||
      item.content_type?.toLowerCase().replace("_", "") === selectedType.toLowerCase().replace("_", "");

    const matchesChannel =
      selectedChannel === "all" ||
      (item.channel || "").toLowerCase().includes(selectedChannel.toLowerCase());

    return matchesSearch && matchesType && matchesChannel;
  });

  const contentTypes = [
    { id: "all", label: "All Types" },
    { id: "social_post", label: "Social Post" },
    { id: "document", label: "Document" },
    { id: "article", label: "Article" },
    { id: "website", label: "Website" },
    { id: "image", label: "Creative Asset" },
  ];

  const channelFilters = [
    { id: "all", label: "All Channels" },
    { id: "instagram", label: "Instagram" },
    { id: "linkedin", label: "LinkedIn" },
    { id: "press", label: "Press Release" },
    { id: "memo", label: "Internal Memo" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Organizational Content Inventory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {brandConfig?.name || "Active Brand"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete registry of all draft campaigns, published collateral, and multi-channel marketing assets tracked with version history and pre-publication firewall audits.
          </p>
        </div>

        <Link
          href="/reviews/new"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Review Draft</span>
        </Link>
      </div>

      {/* Role notice if not admin */}
      {!canEditBrandBrain && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 text-xs text-amber-900">
          <Lock className="h-4 w-4 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">Role: {currentRole.toUpperCase()}</span> — You have read-only access to organizational content records. Administrators can purge records and manage global permissions.
          </div>
        </div>
      )}

      {/* Inventory KPI Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Content Items
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">{totalCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">All channels & versions</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-emerald-200/80 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Firewall Approved</span>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-700">{approvedCount}</div>
          <div className="mt-1 text-[11px] text-emerald-600">Passed policy criteria</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-red-200/80 shadow-2xs">
          <div className="text-[11px] font-semibold text-red-700 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
            <span>Quarantined</span>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-red-700">{quarantinedCount}</div>
          <div className="mt-1 text-[11px] text-red-600">Zero-tolerance flags detected</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-indigo-200/80 shadow-2xs">
          <div className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-indigo-600" />
            <span>In Review / Warnings</span>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-indigo-700">{underReviewCount}</div>
          <div className="mt-1 text-[11px] text-indigo-600">Pending reviewer sign-off</div>
        </div>
      </div>

      {/* Search & Channel Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, channel, snippet, or content type..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1 shrink-0">
              <Share2 className="h-3.5 w-3.5" /> Channel:
            </span>
            {channelFilters.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setSelectedChannel(ch.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedChannel === ch.id
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {ch.label}
              </button>
            ))}
          </div>
        </div>

        {/* Type tabs */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 overflow-x-auto">
          <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1 shrink-0">
            <Filter className="h-3.5 w-3.5" /> Format:
          </span>
          {contentTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setSelectedType(type.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                selectedType === type.id
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>
            Showing <strong className="text-slate-800">{filteredList.length}</strong> of{" "}
            <strong className="text-slate-800">{contentList.length}</strong> content records
          </span>
          {(searchQuery || selectedType !== "all" || selectedChannel !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedType("all");
                setSelectedChannel("all");
              }}
              className="text-indigo-600 hover:underline text-[11px] font-semibold cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading content inventory...</div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FileText className="h-8 w-8 text-slate-300 mx-auto" />
            <div className="text-xs font-bold text-slate-700">No content found</div>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              {searchQuery || selectedType !== "all" || selectedChannel !== "all"
                ? "No content matches your filter criteria. Try adjusting your query or resetting filters."
                : `No content records registered for ${brandConfig?.name || "this workspace"} yet.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Title & Description</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4 text-center">Version</th>
                  <th className="py-3 px-4">Firewall Status & Score</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((c) => {
                  const chBadge = getChannelBadge(c.channel);
                  const isBlocked =
                    c.review_decision === "BLOCKED" ||
                    (c.review_score !== null && c.review_score !== undefined && c.review_score < 70);
                  const isApproved =
                    c.review_decision === "PASS" ||
                    (c.review_score !== null && c.review_score !== undefined && c.review_score >= 85);

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Title & Preview */}
                      <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                        <div className="font-bold text-slate-900">{c.title}</div>
                        {c.raw_snippet && (
                          <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            "{c.raw_snippet}"
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          ID: {c.id.slice(0, 8)}...
                        </div>
                      </td>

                      {/* Channel Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${chBadge.bg}`}
                        >
                          <span>{chBadge.icon}</span>
                          <span>{chBadge.label}</span>
                        </span>
                      </td>

                      {/* Format */}
                      <td className="py-3.5 px-4 capitalize">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {c.content_type?.replace("_", " ")}
                        </span>
                      </td>

                      {/* Version */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-xs">
                          v{c.current_version}
                        </span>
                      </td>

                      {/* Firewall Status & Score */}
                      <td className="py-3.5 px-4">
                        {c.review_score !== null && c.review_score !== undefined ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                isApproved
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : isBlocked
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {isApproved ? "Approved" : isBlocked ? "Quarantined" : "Warnings"}
                            </span>
                            <span className="text-xs font-extrabold text-slate-700">
                              {c.review_score}/100
                            </span>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            Awaiting Review
                          </span>
                        )}
                      </td>

                      {/* Submitted Date */}
                      <td className="py-3.5 px-4 text-slate-500 text-xs">
                        {formatDate(c.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Quick Preview Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenPreview(c)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Quick preview content"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Direct link to Review Audit */}
                          {c.review_id && (
                            <Link
                              href={`/reviews/${c.review_id}`}
                              className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Inspect full firewall review & multi-agent findings"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          )}

                          {/* Delete */}
                          {canEditBrandBrain && (
                            <button
                              type="button"
                              onClick={() => handleDelete(c.id, c.title)}
                              disabled={deletingId === c.id}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                              title="Permanently delete record"
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
          </div>
        )}
      </div>

      {/* Quick Content Preview Modal */}
      {previewContent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  v{previewContent.current_version} · {previewContent.content_type?.replace("_", " ").toUpperCase()}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1.5">
                  {previewContent.title}
                </h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  Submitted on {formatDate(previewContent.created_at)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewContent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Body Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Submitted Text & Copy</span>
                {previewContent.raw_snippet && (
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyText(
                        previewContent.versions?.[0]?.raw_text ||
                          previewContent.raw_snippet ||
                          ""
                      )
                    }
                    className="text-indigo-600 hover:text-indigo-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 font-mono whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">
                {previewLoading ? (
                  <span className="text-slate-400">Loading full copy...</span>
                ) : previewContent.versions?.[0]?.raw_text ? (
                  previewContent.versions[0].raw_text
                ) : previewContent.raw_snippet ? (
                  previewContent.raw_snippet
                ) : (
                  <span className="text-slate-400 italic">No text copy recorded (Asset / Image submission).</span>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPreviewContent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close Preview
              </button>

              {previewContent.review_id && (
                <Link
                  href={`/reviews/${previewContent.review_id}`}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Open Full Governance Audit →</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
