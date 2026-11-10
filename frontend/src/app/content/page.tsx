"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Plus, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function ContentPage() {
  const [contentList, setContentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getContentList();
        setContentList(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Organizational Content Inventory</h1>
          <p className="text-sm text-slate-500 mt-1">
            All submitted marketing copy, documents, and creative assets tracked with versioning.
          </p>
        </div>
        <Link
          href="/reviews/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Submit New Content</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4">Channel</th>
              <th className="py-3 px-4">Content Type</th>
              <th className="py-3 px-4">Current Version</th>
              <th className="py-3 px-4">Created Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contentList.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3.5 px-4 font-bold text-slate-900">{c.title}</td>
                <td className="py-3.5 px-4 capitalize text-slate-600">{c.channel}</td>
                <td className="py-3.5 px-4 capitalize text-slate-600">{c.content_type}</td>
                <td className="py-3.5 px-4 font-bold text-indigo-700">v{c.current_version}</td>
                <td className="py-3.5 px-4 text-slate-500">{formatDate(c.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
