"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Plus, Search, Trash2, Filter, AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useBrand } from "@/context/BrandContext";

export default function ContentPage() {
  const { activeBrand, brandConfig, canEditBrandBrain, currentRole } = useBrand();
  const [contentList, setContentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadContent = async () => {
    try {
      setLoading(true);
      const data = await api.getContentList(activeBrand);
      setContentList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [activeBrand]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}" and all its review versions?`)) {
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

  // Filter content
  const filteredList = contentList.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.channel?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content_type?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      selectedType === "all" || item.content_type?.toLowerCase() === selectedType.toLowerCase();

    return matchesSearch && matchesType;
  });

  const contentTypes = ["all", "social_post", "document", "article", "website"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Organizational Content Inventory</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {brandConfig?.name || "Active Brand"}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            All submitted marketing copy, documents, and creative assets tracked with versioning.
          </p>
        </div>
      </div>

      {/* Role notice if not admin */}
      {!canEditBrandBrain && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 text-xs text-amber-900">
          <Lock className="h-4 w-4 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">Role: {currentRole.toUpperCase()}</span> — You have read-only access to the content inventory. Administrators can delete or purge content records.
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, channel, or type..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" /> Type:
          </span>
          {contentTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                selectedType === type
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {type.replace("_", " ")}
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
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedType("all");
              }}
              className="text-indigo-600 hover:underline text-[11px] font-semibold"
            >
              Clear filters
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
              {searchQuery
                ? "No content matches your filter criteria. Try adjusting your search query."
                : `No content records registered for ${brandConfig?.name || "this workspace"} yet.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Content Type</th>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  {canEditBrandBrain && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{c.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {c.id.slice(0, 8)}...</div>
                    </td>
                    <td className="py-3.5 px-4 capitalize text-slate-600">{c.channel}</td>
                    <td className="py-3.5 px-4 capitalize">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {c.content_type?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        v{c.current_version}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{formatDate(c.created_at)}</td>
                    {canEditBrandBrain && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDelete(c.id, c.title)}
                          disabled={deletingId === c.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold text-xs transition-colors disabled:opacity-50"
                          title="Delete content and reviews"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>{deletingId === c.id ? "Deleting..." : "Delete"}</span>
                        </button>
                      </td>
                    )}
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