"use client";

import { useEffect, useState } from "react";
import { Plus, Database, CheckCircle2, AlertCircle, Trash2, Lock } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useBrand } from "@/context/BrandContext";

export default function FactsPage() {
  const { canEditBrandBrain, currentRole } = useBrand();
  const [facts, setFacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [statement, setStatement] = useState("");
  const [category, setCategory] = useState("performance");
  const [source, setSource] = useState("");
  const [numericalValue, setNumericalValue] = useState("");
  const [numericalUnit, setNumericalUnit] = useState("%");
  const [validUntil, setValidUntil] = useState("2026-12-31");

  const loadFacts = async () => {
    try {
      setLoading(true);
      const data = await api.getFacts();
      setFacts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacts();
  }, []);

  const handleCreateFact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createFact({
        statement,
        category,
        source,
        numerical_value: numericalValue ? parseFloat(numericalValue) : null,
        numerical_unit: numericalUnit,
        valid_until: validUntil || null,
      });
      setShowAddModal(false);
      setStatement("");
      setSource("");
      setNumericalValue("");
      await loadFacts();
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deactivate this approved fact?")) return;
    try {
      await api.deleteFact(id);
      await loadFacts();
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Approved Organizational Facts</h1>
          <p className="text-sm text-slate-500 mt-1">
            Verified ground-truth metrics, statistics, and product specifications used by the Fact Agent.
          </p>
        </div>
        {canEditBrandBrain ? (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Approved Fact</span>
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
            <Lock className="h-3.5 w-3.5 text-amber-600" />
            <span>Read-Only Mode ({currentRole})</span>
          </div>
        )}
      </div>

      {!canEditBrandBrain && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-xs text-amber-900">
          <Lock className="h-4 w-4 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">Role Limit ({currentRole.toUpperCase()}):</span> Only Administrators can register new verified brand facts or deactivate existing facts. Reviewers and creators can reference facts for auditing.
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Statement / Description</th>
              <th className="py-3 px-4">Approved Value</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Source Evidence</th>
              <th className="py-3 px-4">Valid Until</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {facts.map((f) => (
              <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-sm">{f.statement}</td>
                <td className="py-3.5 px-4">
                  {f.numerical_value !== null ? (
                    <span className="font-extrabold text-indigo-700 text-sm bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {f.numerical_value} {f.numerical_unit}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="py-3.5 px-4 capitalize text-slate-600">{f.category}</td>
                <td className="py-3.5 px-4 text-slate-600 italic text-[11px] max-w-xs">{f.source || "Company Records"}</td>
                <td className="py-3.5 px-4 text-slate-600">{formatDate(f.valid_until)}</td>
                <td className="py-3.5 px-4">
                  {f.is_expired ? (
                    <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded text-[11px] font-bold border border-red-200 flex items-center gap-1 w-max">
                      <AlertCircle className="h-3 w-3" /> Expired
                    </span>
                  ) : (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-bold border border-emerald-200 flex items-center gap-1 w-max">
                      <CheckCircle2 className="h-3 w-3" /> Active
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => handleDelete(f.id)}
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
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Register Approved Fact</h3>
            <form onSubmit={handleCreateFact} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Fact Statement</label>
                <textarea
                  rows={2}
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  placeholder="e.g. Aureon Shield platform achieves 42% average reduction in transaction fraud."
                  className="w-full mt-1 p-2 rounded border border-slate-300"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Numerical Value</label>
                  <input
                    type="number"
                    step="any"
                    value={numericalValue}
                    onChange={(e) => setNumericalValue(e.target.value)}
                    placeholder="42"
                    className="w-full mt-1 p-2 rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Unit</label>
                  <input
                    type="text"
                    value={numericalUnit}
                    onChange={(e) => setNumericalUnit(e.target.value)}
                    placeholder="%"
                    className="w-full mt-1 p-2 rounded border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Source Evidence / Citation</label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. Q4 2025 Third-Party Security Benchmark Report"
                  className="w-full mt-1 p-2 rounded border border-slate-300"
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
                    <option value="performance">Performance Metric</option>
                    <option value="product">Product Specification</option>
                    <option value="financial">Financial / Pricing</option>
                    <option value="legal">Legal Certification</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Valid Until</label>
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
                  Save Fact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
