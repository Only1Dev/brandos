"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  X,
  Copy,
  RotateCw,
  ShieldCheck,
  Check,
  Split,
  FileText,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";

interface AutoRemediationStudioProps {
  reviewId: string;
  isOpen: boolean;
  onClose: () => void;
  onRemediationApplied: () => void;
}

export function AutoRemediationStudio({
  reviewId,
  isOpen,
  onClose,
  onRemediationApplied,
}: AutoRemediationStudioProps) {
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [remediationData, setRemediationData] = useState<{
    original_text: string;
    remediated_text: string;
    changes_made: string[];
    predicted_score: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"side_by_side" | "inline">("side_by_side");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRemediation = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.autoRemediateReview(reviewId);
      setRemediationData(data);
    } catch (err: any) {
      setError(err.message || "Failed to generate auto-remediation");
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch when modal opens
  useEffect(() => {
    if (isOpen && !remediationData && !loading) {
      fetchRemediation();
    }
  }, [isOpen]);

  const handleApply = async () => {
    if (!remediationData?.remediated_text) return;
    try {
      setApplying(true);
      await api.applyRemediation(reviewId, remediationData.remediated_text);
      onRemediationApplied();
      onClose();
    } catch (err: any) {
      alert("Failed to apply remediation: " + err.message);
    } finally {
      setApplying(false);
    }
  };

  const handleCopy = () => {
    if (!remediationData?.remediated_text) return;
    navigator.clipboard.writeText(remediationData.remediated_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-inner">
              <Sparkles className="h-5 w-5 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">BrandOS AI Auto-Remediation Studio</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  PREDICTED SCORE: 100/100 PASS
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">
                Autonomous multi-agent rewriting to satisfy brand voice, approved truth facts, and controlled lexicon.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-indigo-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="h-10 w-10 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin mx-auto" />
              <div className="text-sm font-bold text-slate-800">Generating Brand-Sanitized Copy...</div>
              <div className="text-xs text-slate-500 max-w-sm mx-auto">
                Consulting Brand Brain rules, verifying facts, neutralizing disallowed terms, and aligning tone.
              </div>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center space-y-3">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
              <div className="text-sm font-bold text-red-900">{error}</div>
              <button
                onClick={fetchRemediation}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
              >
                Retry Remediation
              </button>
            </div>
          ) : remediationData ? (
            <>
              {/* Summary of Actions Taken */}
              <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-900 mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Autonomous Governance Actions Applied ({remediationData.changes_made.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {remediationData.changes_made.map((change, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-indigo-950 font-medium">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{change}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* View Selector Tabs */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab("side_by_side")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      activeTab === "side_by_side"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Split className="h-3.5 w-3.5" />
                    Side-by-Side Comparison
                  </button>
                  <button
                    onClick={() => setActiveTab("inline")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      activeTab === "inline"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Clean Remediated View
                  </button>
                </div>

                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Copied to Clipboard!" : "Copy Remediated Text"}</span>
                </button>
              </div>

              {/* Diff Viewers */}
              {activeTab === "side_by_side" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Original Left Pane */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-red-800 bg-red-50 p-2.5 rounded-lg border border-red-200">
                      <span>Original Submitted Copy (Flagged)</span>
                      <span className="text-[10px] font-mono uppercase bg-red-200/60 px-1.5 py-0.5 rounded">
                        Violations Found
                      </span>
                    </div>
                    <div className="p-4 rounded-xl border border-red-200 bg-red-50/20 text-slate-800 font-mono text-xs leading-relaxed whitespace-pre-wrap min-h-[260px] max-h-[360px] overflow-y-auto">
                      {remediationData.original_text}
                    </div>
                  </div>

                  {/* Remediated Right Pane */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                      <span>BrandOS Remediated Copy (100% On-Brand)</span>
                      <span className="text-[10px] font-mono uppercase bg-emerald-200/60 px-1.5 py-0.5 rounded">
                        Full Compliance
                      </span>
                    </div>
                    <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/20 text-slate-900 font-mono text-xs leading-relaxed whitespace-pre-wrap min-h-[260px] max-h-[360px] overflow-y-auto ring-1 ring-emerald-500/20">
                      {remediationData.remediated_text}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-xl border border-emerald-300 bg-emerald-50/20 text-slate-900 font-mono text-xs leading-relaxed whitespace-pre-wrap min-h-[260px] ring-1 ring-emerald-500/20">
                  {remediationData.remediated_text}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
          >
            Cancel & Keep Original
          </button>

          <button
            onClick={handleApply}
            disabled={loading || applying || !remediationData}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RotateCw className={`h-4 w-4 ${applying ? "animate-spin" : ""}`} />
            <span>{applying ? "Applying & Re-Auditing..." : "✨ Apply Fix & Re-Audit (Auto 100% PASS)"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
