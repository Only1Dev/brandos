"use client";

import { useEffect, useState } from "react";
import { Plus, FileCheck2, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function ClaimsPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [statement, setStatement] = useState("");
  const [category, setCategory] = useState("marketing");
  const [validUntil, setValidUntil] = useState("2026-11-27");

  const loadClaims = async () => {
    try {
      setLoading(true);
      const data = await api.getClaims();
      setClaims(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createClaim({
        statement,
        category,
        valid_until: validUntil || null,
      });
      setShowAddModal(false);
      setStatement("");
      await loadClaims();
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Claim Lifecycle Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track marketing & performance claims through their complete lifecycle from submission to expiration.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Claim</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Claim Statement</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Lifecycle State</th>
              <th className="py-3 px-4">Valid Until</th>
              <th className="py-3 px-4">Expiration Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {claims.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-md">{c.statement}</td>
                <td className="py-3.5 px-4 capitalize text-slate-600">{c.category}</td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded font-bold text-[10px] uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {c.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-600">{formatDate(c.valid_until)}</td>
                <td className="py-3.5 px-4">
                  {c.is_expired ? (
                    <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded text-[11px] font-bold border border-red-200 flex items-center gap-1 w-max">
                      <AlertTriangle className="h-3 w-3" /> Expired
                    </span>
                  ) : (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-bold border border-emerald-200 flex items-center gap-1 w-max">
                      <Clock className="h-3 w-3" /> Active Claim
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Create Organizational Claim</h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Claim Statement</label>
                <textarea
                  rows={3}
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  placeholder="e.g. Aureon Shield delivers proven 42% fraud reduction across digital banking channels."
                  className="w-full mt-1 p-2 rounded border border-slate-300"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full mt-1 p-2 rounded border border-slate-300 bg-white"
                  >
                    <option value="marketing">Marketing</option>
                    <option value="performance">Performance</option>
                    <option value="compliance">Compliance</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Expiration Date</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full mt-1 p-2 rounded border border-slate-300"
                  />
                </div>
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
                  Create Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
