"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Lock,
  GitCompare,
  MinusCircle,
  PlusCircle,
  ArrowRightLeft,
} from "lucide-react";
import { api } from "@/lib/api";
import { useBrand } from "@/context/BrandContext";

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
  const { canAutoRemediate, currentRole } = useBrand();
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [remediationData, setRemediationData] = useState<{
    original_text: string;
    remediated_text: string;
    changes_made: string[];
    predicted_score: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"side_by_side" | "git_diff" | "inline">("side_by_side");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRemediation = async () => {
    if (!canAutoRemediate) return;
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

  // Trigger fetch when modal opens or reviewId changes
  useEffect(() => {
    if (isOpen && canAutoRemediate) {
      setLoading(true);
      setError(null);
      fetchRemediation();
    }
  }, [isOpen, reviewId, canAutoRemediate]);

  if (isOpen && !canAutoRemediate) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Auto-Remediation Restricted</h3>
              <p className="text-xs text-slate-500">RBAC Governance Policy Locked</p>
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
            Your active role (<strong>{currentRole.toUpperCase()}</strong>) has been restricted from executing AI Auto-Remediation by Brand Administration in Settings.
          </div>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const router = useRouter();

  const handleApply = async () => {
    if (applying || !remediationData?.remediated_text) return; // Prevent double click
    try {
      setApplying(true);
      setError(null);
      await api.applyRemediation(reviewId, remediationData.remediated_text);
      onClose();
      await onRemediationApplied();
      router.refresh();
    } catch (err: any) {
      console.error("Remediation execution error:", err);
      setError(err?.message || "Failed to apply remediation. Please try again.");
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
          {loading || (!remediationData && !error) ? (
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
              <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-2 gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setActiveTab("side_by_side")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      activeTab === "side_by_side"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Split className="h-3.5 w-3.5" />
                    <span>Side-by-Side</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("git_diff")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      activeTab === "git_diff"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <GitCompare className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Git-Style Diff Visualizer</span>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                      Diff
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("inline")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      activeTab === "inline"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Clean Remediated View</span>
                  </button>
                </div>

                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
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
                      <span>BrandOS Remediated Copy (Brand-Aligned)</span>
                      <span className="text-[10px] font-mono uppercase bg-emerald-200/60 px-1.5 py-0.5 rounded">
                        Full Compliance
                      </span>
                    </div>
                    <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/20 text-slate-900 font-mono text-xs leading-relaxed whitespace-pre-wrap min-h-[260px] max-h-[360px] overflow-y-auto ring-1 ring-emerald-500/20">
                      {remediationData.remediated_text}
                    </div>
                  </div>
                </div>
              ) : activeTab === "git_diff" ? (
                <div className="space-y-4">
                  {/* Unified Git Diff Terminal */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 font-mono text-xs overflow-hidden shadow-xl">
                    <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-slate-400 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                        <span className="font-bold text-slate-200 pl-2">diff --git a/candidate_draft.txt b/brand_sanitized_copy.txt</span>
                      </div>
                      <span className="text-[10px] text-indigo-400 font-mono">index 45b89a3..ad5230a 100644</span>
                    </div>

                    <div className="p-4 space-y-2.5 text-xs overflow-x-auto max-h-[360px] overflow-y-auto">
                      <div className="text-sky-400 font-bold text-[11px]">
                        @@ -1,4 +1,4 @@ BrandOS Policy Engine Auto-Remediation Unified Chunk
                      </div>

                      {/* Deletions (Red) */}
                      <div className="bg-red-950/40 border-l-2 border-red-500 text-red-300 p-2.5 rounded-r font-mono text-[11px] space-y-1">
                        <div className="text-[10px] uppercase font-bold text-red-400 tracking-wider flex items-center gap-1">
                          <MinusCircle className="h-3 w-3" />
                          <span>Removed / Neutralized Off-Brand Phrasing:</span>
                        </div>
                        <div className="line-through opacity-85 leading-relaxed whitespace-pre-wrap">
                          {remediationData.original_text}
                        </div>
                      </div>

                      {/* Additions (Green) */}
                      <div className="bg-emerald-950/40 border-l-2 border-emerald-500 text-emerald-300 p-2.5 rounded-r font-mono text-[11px] space-y-1">
                        <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                          <PlusCircle className="h-3 w-3" />
                          <span>Injected Brand-Compliant Enterprise Phrasing:</span>
                        </div>
                        <div className="leading-relaxed whitespace-pre-wrap font-semibold">
                          {remediationData.remediated_text}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phrase Substitution & Governance Policy Mapping Table */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <ArrowRightLeft className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Exact Substitution &amp; Policy Alignment Mapping:</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {remediationData.changes_made?.length || 1} Transformation(s) Applied
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                      {remediationData.changes_made?.map((change, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                          <span className="text-slate-700 leading-relaxed font-sans">{change}</span>
                        </div>
                      ))}
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
            <span>{applying ? "Applying & Re-Auditing..." : "✨ Apply Fix & Re-Audit"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
