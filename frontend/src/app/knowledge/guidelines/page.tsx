"use client";

import { useEffect, useState } from "react";
import { Plus, BookOpen, Upload, Shield, Check, FileText, Sparkles, Brain, ArrowDownToLine, CheckCircle2, Lock, Trash2, Zap } from "lucide-react";
import { api } from "@/lib/api";
import { useBrand } from "@/context/BrandContext";
import { AdversarialStressLab } from "@/components/governance/AdversarialStressLab";

export default function GuidelinesPage() {
  const { canEditBrandBrain, currentRole, brandConfig } = useBrand();
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [sandboxPayload, setSandboxPayload] = useState<string | null>(null);

  // Ingestion State
  const [ingesting, setIngesting] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState<string | null>(null);

  // New rule form
  const [name, setName] = useState("");
  const [category, setCategory] = useState("tone");
  const [ruleStatement, setRuleStatement] = useState("");
  const [severity, setSeverity] = useState("warning");
  const [positiveExample, setPositiveExample] = useState("");
  const [negativeExample, setNegativeExample] = useState("");

  const loadRules = async () => {
    try {
      setLoading(true);
      const data = await api.getRules(undefined, brandConfig.slug);
      setRules(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, [brandConfig.slug]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name.replace(/\.[^/.]+$/, ""));

      try {
        setIngesting(true);
        setIngestSuccess(null);
        const res = await api.uploadGuideline(formData);
        setIngestSuccess(`Successfully ingested "${file.name}" into Brand Brain (${res.rules_extracted} governance rules extracted).`);
        await loadRules();
      } catch (err: any) {
        alert("Upload error: " + err.message);
      } finally {
        setIngesting(false);
      }
    }
  };

  const handleLoadDemoPdf = async () => {
    try {
      setIngesting(true);
      setIngestSuccess(null);
      const res = await api.loadDemoGuidelinePdf(brandConfig.slug);
      setIngestSuccess(
        `AI Brand Brain Ingestion Complete: Processed "${res.filename}" (${res.rules_extracted} new governance rules structured into BrandOS Core).`
      );
      await loadRules();
    } catch (err: any) {
      alert("Demo ingestion error: " + err.message);
    } finally {
      setIngesting(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createRule({
        name,
        category,
        rule_statement: ruleStatement,
        severity,
        priority: 1.0,
        examples_positive: positiveExample,
        examples_negative: negativeExample,
      }, brandConfig.slug);
      setShowAddModal(false);
      setName("");
      setRuleStatement("");
      setPositiveExample("");
      setNegativeExample("");
      await loadRules();
    } catch (e: any) {
      alert("Error creating rule: " + e.message);
    }
  };

  const handleDeleteRule = async (id: string, code: string) => {
    if (!confirm(`Deactivate rule "${code}" from active Brand Brain enforcement?`)) return;
    try {
      setDeletingRuleId(id);
      await api.deleteRule(id);
      await loadRules();
    } catch (e: any) {
      alert("Error deleting rule: " + e.message);
    } finally {
      setDeletingRuleId(null);
    }
  };

  const filteredRules = selectedCategory === "all"
    ? rules
    : rules.filter((r) => r.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <Brain className="h-3 w-3" />
              BrandOS Core • AI Brand Brain
            </span>
            <span className="text-xs text-slate-400">• Enterprise Knowledge Engine</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Brand Guidelines & Governance Rules</h1>
          <p className="text-xs text-slate-500 mt-1">
            Centralized knowledge repository grounding TruthMark™ and VisualGuard™ in verifiable brand policies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canEditBrandBrain && (
            <button
              onClick={handleLoadDemoPdf}
              disabled={ingesting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>{ingesting ? "Ingesting PDF..." : `Sync ${brandConfig.name.split(" ")[0]} PDF`}</span>
            </button>
          )}
          {canEditBrandBrain ? (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add Rule</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
              <Lock className="h-3.5 w-3.5 text-amber-600" />
              <span>Read-Only Mode ({currentRole})</span>
            </div>
          )}
        </div>
      </div>

      {!canEditBrandBrain && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-xs text-amber-900">
          <Lock className="h-4 w-4 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">Role Limit ({currentRole.toUpperCase()}):</span> Only Administrators can register new brand guidelines or modify governance rules. Reviewers and creators have read-only access to Brand Brain policies.
          </div>
        </div>
      )}

      {/* Brand Brain PDF Ingestion Dropzone Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-6 text-white shadow-md border border-indigo-900/50">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Upload className="h-4 w-4" />
              <span>Automated Document Extraction & Semantic Knowledge Synthesis</span>
            </div>
            <h2 className="text-lg font-bold text-white">Ingest Full Brand Manual into the AI Brand Brain</h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              Upload any brand guideline PDF, tone document, or design manual. BrandOS Core chunks the text, extracts enforceable voice and visual standards, and registers them into the active governance knowledge graph.
            </p>
            {ingestSuccess && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-lg flex items-center gap-2 text-xs text-emerald-300 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{ingestSuccess}</span>
              </div>
            )}
          </div>
          <div className={`lg:col-span-4 flex flex-col items-center justify-center p-4 rounded-xl border border-dashed transition-all text-center relative ${
            canEditBrandBrain
              ? "border-indigo-500/40 bg-indigo-900/20 hover:bg-indigo-900/30 cursor-pointer"
              : "border-slate-700 bg-slate-900/40 cursor-not-allowed opacity-60"
          }`}>
            {canEditBrandBrain && (
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
                disabled={ingesting}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            )}
            <ArrowDownToLine className="h-7 w-7 text-indigo-400 mb-2" />
            <div className="text-xs font-bold text-white">
              {!canEditBrandBrain
                ? "Upload Restricted (Admin Only)"
                : ingesting
                ? "Analyzing & Chunking Document..."
                : "Click or Drop Brand Guidelines PDF"}
            </div>
            <div className="text-[11px] text-indigo-300 mt-0.5">
              {!canEditBrandBrain ? "Switch to Admin role to ingest guidelines" : "Supports PDF, DOCX, TXT manuals"}
            </div>
          </div>
        </div>
      </div>

      {/* Live Adversarial Brand Drift & Stress Lab (Judge Playground) */}
      <AdversarialStressLab
        externalPayload={sandboxPayload}
        onClearExternalPayload={() => setSandboxPayload(null)}
      />

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {["all", "tone", "terminology", "visual", "factual", "accessibility", "legal"].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              selectedCategory === cat
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {cat === "all" ? `All Rules (${rules.length})` : cat}
          </button>
        ))}
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Rule Code</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Governance Directive</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Engine Assigned</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRules.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{r.name}</td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded font-semibold text-[11px] bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                    {r.category}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-800 font-medium max-w-lg leading-relaxed">
                  {r.rule_statement}
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      r.severity === "error"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {r.severity}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {r.category === "visual" || r.category === "accessibility"
                      ? "VisualGuard™"
                      : r.category === "factual"
                      ? "TruthMark™"
                      : "BrandOS Core™"}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                    <Check className="h-3 w-3 text-emerald-600" />
                    Enforcing
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const testPrompt =
                          r.examples_negative ||
                          `Test draft evaluating ${r.name}: ${r.rule_statement}`;
                        setSandboxPayload(testPrompt);
                        window.scrollTo({ top: 120, behavior: "smooth" });
                      }}
                      className="px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-semibold flex items-center gap-1 transition-all"
                      title={`Test rule ${r.name} in Sandbox`}
                    >
                      <Zap className="h-3 w-3 text-indigo-600" />
                      <span>Test</span>
                    </button>

                    {canEditBrandBrain && (
                      <button
                        onClick={() => handleDeleteRule(r.id, r.name)}
                        disabled={deletingRuleId === r.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Deactivate and delete rule"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Add Governance Rule */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Define Brand Governance Rule</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateRule} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Rule Code</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. RULE-099"
                    className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="tone">Brand Tone & Voice</option>
                    <option value="terminology">Controlled Terminology</option>
                    <option value="visual">Visual & Logo Identity</option>
                    <option value="accessibility">Accessibility & Contrast</option>
                    <option value="factual">Factual Claim Policy</option>
                    <option value="legal">Legal & Compliance</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Rule Directive Statement</label>
                <textarea
                  rows={3}
                  value={ruleStatement}
                  onChange={(e) => setRuleStatement(e.target.value)}
                  placeholder="e.g. Never claim 100% protection or bulletproof security; security is probabilistic."
                  className="w-full p-2.5 text-xs rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="error">Error / Critical Violation</option>
                    <option value="warning">Warning / Advisory</option>
                    <option value="info">Info / Recommendation</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Approved Positive Phrasing</label>
                  <input
                    type="text"
                    value={positiveExample}
                    onChange={(e) => setPositiveExample(e.target.value)}
                    placeholder="e.g. Multi-layered defense"
                    className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-xs"
                >
                  Save to Brand Brain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
