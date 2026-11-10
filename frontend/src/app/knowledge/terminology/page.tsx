"use client";

import { useEffect, useState } from "react";
import { Plus, Tag, Trash2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useBrand } from "@/context/BrandContext";

export default function TerminologyPage() {
  const { activeBrand } = useBrand();
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [term, setTerm] = useState("");
  const [preferred, setPreferred] = useState("");
  const [status, setStatus] = useState("forbidden");
  const [context, setContext] = useState("");

  const loadTerms = async () => {
    try {
      setLoading(true);
      const data = await api.getTerminology();
      setTerms(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTerms();
  }, [activeBrand]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTerminology({
        term,
        preferred_alternative: preferred,
        status,
        context,
      });
      setShowAddModal(false);
      setTerm("");
      setPreferred("");
      setContext("");
      await loadTerms();
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deactivate this terminology rule?")) return;
    try {
      await api.deleteTerminology(id);
      await loadTerms();
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Approved Terminology</h1>
          <p className="text-sm text-slate-500 mt-1">
            Enforces preferred, deprecated, and forbidden terms across all content deterministically.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add Terminology Rule</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Subject Term</th>
              <th className="py-3 px-4">Rule Classification</th>
              <th className="py-3 px-4">Approved Replacement</th>
              <th className="py-3 px-4">Context / Guidance</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {terms.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{t.term}</td>
                <td className="py-3.5 px-4">
                  {t.status === "forbidden" && (
                    <span className="text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-max">
                      <XCircle className="h-3 w-3" /> Forbidden
                    </span>
                  )}
                  {t.status === "deprecated" && (
                    <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-max">
                      <AlertTriangle className="h-3 w-3" /> Deprecated
                    </span>
                  )}
                  {t.status === "preferred" && (
                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-max">
                      <CheckCircle2 className="h-3 w-3" /> Preferred
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">{t.preferred_alternative}</td>
                <td className="py-3.5 px-4 text-slate-600 text-[11px] max-w-sm">{t.context || "Standard terminology rule"}</td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Define Terminology Rule</h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Flagged Term</label>
                <input
                  type="text"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="e.g. fraud protection platform"
                  className="w-full mt-1 p-2 rounded border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Classification</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full mt-1 p-2 rounded border border-slate-300 bg-white"
                >
                  <option value="forbidden">Forbidden (Block / High Severity)</option>
                  <option value="deprecated">Deprecated (Warn / Medium Severity)</option>
                  <option value="preferred">Approved Preferred Term</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Approved Alternative Replacement</label>
                <input
                  type="text"
                  value={preferred}
                  onChange={(e) => setPreferred(e.target.value)}
                  placeholder="e.g. fraud prevention platform"
                  className="w-full mt-1 p-2 rounded border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Context & Rationale</label>
                <textarea
                  rows={2}
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Why this term is preferred over alternatives..."
                  className="w-full mt-1 p-2 rounded border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-indigo-600 text-white font-bold hover:bg-indigo-700"
                >
                  Save Term
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
