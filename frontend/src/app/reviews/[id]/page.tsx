"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  Sparkles,
  Check,
  X,
  Shield,
  FileCheck,
  Eye,
  MessageSquare,
  Lock,
  Award,
  Clock,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDate, getSeverityBadge, getStatusBadge } from "@/lib/utils";
import { useBrand } from "@/context/BrandContext";
import { AgentPipelineVisualizer } from "@/components/governance/AgentPipelineVisualizer";
import { AutoRemediationStudio } from "@/components/governance/AutoRemediationStudio";
import { GovernanceRadarChart } from "@/components/governance/GovernanceRadarChart";
import { GovernanceCertificateModal } from "@/components/governance/GovernanceCertificateModal";

export default function ReviewDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { canApproveReviews, currentRole } = useBrand();

  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Reject / Revision Request dialog state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Override dialog state
  const [overrideFindingId, setOverrideFindingId] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState("");

  // Auto-Remediation & Certificate modals
  const [showRemediationStudio, setShowRemediationStudio] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // Reviewer Directives & Feedback Note state
  const [reviewerNote, setReviewerNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  const loadReview = async () => {
    try {
      setLoading(true);
      const data = await api.getReviewDetails(id);
      setReview(data);
      if (data?.reviewer_comment) {
        setReviewerNote(data.reviewer_comment);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReviewerNote = async () => {
    if (!reviewerNote.trim()) return;
    try {
      setSavingNote(true);
      await api.saveReviewerNote(id, reviewerNote.trim());
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2500);
      await loadReview();
    } catch (e: any) {
      alert("Failed to save directive: " + e.message);
    } finally {
      setSavingNote(false);
    }
  };

  useEffect(() => {
    loadReview();
  }, [id]);

  const handleRunAnalysis = async () => {
    try {
      setAnalyzing(true);
      await api.analyzeReview(id);
      await loadReview();
    } catch (e: any) {
      alert("Analysis error: " + e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAcceptSuggestion = async (findingId: string) => {
    try {
      setActionLoading(true);
      const res = await api.acceptSuggestion(findingId);
      if (res?.new_text && review?.content) {
        setReview((prev: any) => ({
          ...prev,
          content: {
            ...prev.content,
            raw_text: res.new_text,
            version_number: res.version_number || (prev.content.version_number || 1) + 1,
          },
        }));
      }
      await loadReview();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOverride = async () => {
    if (!overrideFindingId || !overrideReason) return;
    try {
      setActionLoading(true);
      await api.overrideFinding(overrideFindingId, overrideReason);
      setOverrideFindingId(null);
      setOverrideReason("");
      await loadReview();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await api.approveReview(id);
      await loadReview();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) return;
    try {
      setActionLoading(true);
      await api.rejectReview(id, rejectReason);
      setShowRejectModal(false);
      setRejectReason("");
      await loadReview();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="h-8 w-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto mb-3" />
        <div className="text-xs text-slate-500 font-medium">Loading Governance Review...</div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="py-24 text-center">
        <div className="text-base font-bold text-slate-800">Review not found</div>
        <Link href="/reviews" className="text-xs text-indigo-600 font-semibold mt-2 inline-block">
          Return to reviews
        </Link>
      </div>
    );
  }

  const { content, findings } = review;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/reviews"
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{content?.title || "Review"}</h1>
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${getStatusBadge(review.decision || review.status)}`}>
                {review.decision || review.status}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
              <span>Channel: <strong className="text-slate-700 capitalize">{content?.channel}</strong></span>
              <span>•</span>
              <span>Version: <strong className="text-slate-700">v{content?.version_number}</strong></span>
              <span>•</span>
              <span>Submitted: {formatDate(review.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {findings.length > 0 && (
            <button
              onClick={() => setShowRemediationStudio(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-800 text-white text-xs font-bold shadow-sm transition-all"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>✨ Auto-Remediate</span>
            </button>
          )}

          <button
            onClick={() => setShowCertificateModal(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-xs transition-colors ${
              review.status === "approved"
                ? "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                : review.decision === "BLOCKED" || (review.governance_score ?? 0) < 70
                ? "bg-red-50 border-red-300 text-red-800 hover:bg-red-100"
                : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {review.status === "approved" ? (
              <>
                <Award className="h-3.5 w-3.5 text-emerald-600" />
                <span className="font-bold">Official Certificate (Cleared)</span>
              </>
            ) : review.decision === "BLOCKED" || (review.governance_score ?? 0) < 70 ? (
              <>
                <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
                <span>Enforcement Notice</span>
              </>
            ) : (
              <>
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                <span>Certificate (Pending Sign-Off)</span>
              </>
            )}
          </button>

          {review.status === "pending" || review.status === "analyzing" ? (
            <button
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            >
              <RotateCw className={`h-3.5 w-3.5 ${analyzing ? "animate-spin" : ""}`} />
              <span>{analyzing ? "Analyzing Governance..." : "Run Analysis"}</span>
            </button>
          ) : review.status === "approved" ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Publication Approved</span>
            </div>
          ) : review.status === "rejected" ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 border border-red-300 text-red-800 text-xs font-bold">
              <XCircle className="h-4 w-4 text-red-600" />
              <span>Revision Requested</span>
            </div>
          ) : review.decision === "BLOCKED" || review.governance_score === 0 ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold transition-colors"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Request Revision</span>
              </button>
              <div
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-100 border border-red-300 text-red-800 text-xs font-bold cursor-not-allowed"
                title="Firewall Active: Blocked content cannot be approved for publication. Remediate all critical findings to unlock clearance."
              >
                <Lock className="h-3.5 w-3.5 text-red-600" />
                <span>Approval Blocked by Firewall</span>
              </div>
            </div>
          ) : !canApproveReviews ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 text-xs font-semibold" title="Reviewer or Administrator role required to approve publication">
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              <span>Approval Restricted ({currentRole})</span>
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold transition-colors"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Request Revision</span>
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Approve for Publication</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Live Multi-Agent Execution Visualizer */}
      {analyzing && (
        <AgentPipelineVisualizer
          isAnalyzing={analyzing}
          brandName={content?.title || "Active Brand"}
        />
      )}

      {/* Zero-Tolerance Firewall Active Banner */}
      {(review.decision === "BLOCKED" || review.governance_score === 0) && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-red-50 via-rose-50 to-red-50 border-2 border-red-300 flex items-start gap-3 shadow-xs">
          <div className="h-9 w-9 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-extrabold text-red-950 flex items-center gap-2">
              <span>Zero-Tolerance Firewall Active — Content Publication Blocked</span>
              <span className="text-[10px] bg-red-200 text-red-900 px-2 py-0.5 rounded font-mono font-bold">
                SCORE {review.governance_score ?? 0}/100
              </span>
            </div>
            <div className="text-xs text-red-800 font-medium leading-relaxed">
              {(review.radar_scores?.domain === 0 || findings.some((f: any) => f.title?.toLowerCase().includes("cross-tenant") || f.title?.toLowerCase().includes("domain misalignment") || f.title?.toLowerCase().includes("out-of-domain") || f.title?.toLowerCase().includes("missing brand identity")))
                ? "This content violates active brand boundaries (Cross-Tenant Misalignment / Identity Perimeter Violation). Publication is strictly prohibited until all critical findings are remediated."
                : "This content violates active brand policies (unverified claims, prohibited guarantees, or guideline rule violations). Publication is strictly prohibited until all critical findings are remediated."}
            </div>
          </div>
        </div>
      )}

      {/* Publication Clearance Banner (FR-09 & BrandFlow) */}
      {review.status === "approved" && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <span>BrandOS Publication Clearance Granted</span>
                <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded font-mono font-bold">
                  PASS-CERT-{review.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-emerald-700 mt-0.5">
                Verified against active Brand Brain guidelines, approved facts, and visual identity constraints. Authorised for public distribution.
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-emerald-800">Clearance Status: Active</div>
            <div className="text-[11px] text-emerald-600 font-mono">Channel: {content?.channel || "All Channels"}</div>
          </div>
        </div>
      )}

      {/* Revision Requested Notice */}
      {review.status === "rejected" && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 shadow-xs">
          <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-sm font-bold text-red-950">Revision Required Before Publication</div>
            <div className="text-xs text-red-800 font-medium leading-relaxed">
              <strong>Reviewer Notes:</strong> {review.reviewer_comment || "Content requires corrections to satisfy brand compliance standards."}
            </div>
          </div>
        </div>
      )}

      {/* Reviewer Actionable Directive Notice (for Creators) */}
      {!canApproveReviews && review.reviewer_comment && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-3 shadow-xs">
          <MessageSquare className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-sm font-bold text-amber-950 flex items-center gap-2">
              <span>Reviewer Directive for Creator</span>
              <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-mono font-bold">
                ACTION REQUIRED
              </span>
            </div>
            <div className="text-xs text-amber-900 font-medium leading-relaxed">
              {review.reviewer_comment}
            </div>
          </div>
        </div>
      )}

      {/* Reviewer Actionable Directive Editor (for Reviewers/Admins) */}
      {canApproveReviews && (
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <MessageSquare className="h-4 w-4 text-indigo-600" />
              <span>Reviewer Guidance & Directives for Creator</span>
            </div>
            {noteSaved && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 animate-in fade-in">
                <Check className="h-3.5 w-3.5" /> Saved & Dispatched to Creator
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <textarea
              rows={2}
              value={reviewerNote}
              onChange={(e) => setReviewerNote(e.target.value)}
              placeholder="Add specific instructions for the creator (e.g. 'Please adjust claim in paragraph 2 to cite verified 42% reduction and remove unsupported superlatives.')"
              className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
            />
            <button
              onClick={handleSaveReviewerNote}
              disabled={savingNote || !reviewerNote.trim()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50 self-end shrink-0"
            >
              {savingNote ? "Saving..." : "Save Directive"}
            </button>
          </div>
        </div>
      )}

      {/* Main Review Split Layout (PRD Section 49) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANE: Content Display (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Submitted Content</span>
              <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {content?.content_type}
              </span>
            </div>

            {/* Visual Creative / Image Preview */}
            {content?.file_url && (content.content_type === "image" || content.file_url.match(/\.(png|jpe?g|webp|gif)$/i)) && (
              <div className="mb-4 rounded-lg overflow-hidden border border-slate-200 bg-slate-900/5 flex items-center justify-center p-2">
                <img
                  src={`http://localhost:8000${content.file_url}`}
                  alt={content.title || "Uploaded creative"}
                  className="max-h-72 w-auto rounded object-contain shadow-sm"
                />
              </div>
            )}

            {/* Document Download Link */}
            {content?.file_url && (content.file_url.endsWith(".pdf") || content.file_url.endsWith(".docx") || content.file_url.endsWith(".doc")) && (
              <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="font-bold text-indigo-900">Attached Document:</span>
                  <span className="font-mono text-indigo-700 truncate max-w-[180px]">{content.file_url.split("/").pop()}</span>
                </div>
                <a
                  href={`http://localhost:8000${content.file_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-white border border-indigo-300 rounded font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors shadow-xs"
                >
                  View File
                </a>
              </div>
            )}

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80 font-mono text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
              {content?.raw_text || "No text copy extracted."}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Word Count: {content?.raw_text ? content.raw_text.split(/\s+/).length : 0} words</span>
              <span>Content Version: v{content?.version_number}</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Governance Result & Findings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Summary Score Bar */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Governance Firewall Result</span>
                <div className="text-2xl font-extrabold text-slate-900 mt-1 flex items-center gap-3">
                  <span>Score: {review.governance_score !== null ? `${review.governance_score}/100` : "Pending"}</span>
                </div>
              </div>

              {/* Severity Counts Badge Group */}
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 font-bold text-xs flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-600"></span>
                  <span>{review.error_count} High/Critical</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 font-bold text-xs flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                  <span>{review.warning_count} Medium</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  <span>{findings.length === 0 ? "Clean" : "Info"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5-Axis Governance Compliance Vector (Radar Chart) */}
          <GovernanceRadarChart
            scores={review.radar_scores}
            overallScore={review.governance_score}
            decision={review.decision || review.status}
          />

          {/* Auto-Remediation Callout Banner */}
          {findings.length > 0 && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold flex items-center gap-2">
                    <span>Instant AI Auto-Remediation Studio</span>
                    <span className="text-[10px] font-mono bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                      PREDICTED: 100/100 PASS
                    </span>
                  </div>
                  <div className="text-xs text-indigo-200 mt-0.5">
                    Automatically rewrite this copy to fix all {findings.length} findings and re-audit in one click.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowRemediationStudio(true)}
                className="px-4 py-2 rounded-lg bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs shadow-sm transition-all shrink-0 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                <span>Launch Auto-Remediation</span>
              </button>
            </div>
          )}

          {/* Finding Cards List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Detected Governance Findings ({findings.length})
              </h2>
            </div>

            {findings.length === 0 ? (
              <div className="p-8 bg-white rounded-xl border border-slate-200 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                <div className="font-bold text-sm text-slate-900">All Governance Checks Passed</div>
                <p className="text-xs text-slate-500 mt-1">
                  Content satisfies brand tone, approved facts, asset usage, and terminology guidelines.
                </p>
              </div>
            ) : (
              findings.map((f: any) => {
                const badge = getSeverityBadge(f.severity);
                const isOverridden = f.status === "overridden";
                const isAccepted = f.status === "accepted";

                return (
                  <div
                    key={f.id}
                    className={`bg-white rounded-xl border shadow-sm p-6 space-y-4 transition-all ${
                      isAccepted
                        ? "border-emerald-300 bg-emerald-50/20"
                        : isOverridden
                        ? "border-slate-300 bg-slate-50/50 opacity-80"
                        : f.severity === "error"
                        ? "border-red-200"
                        : "border-amber-200"
                    }`}
                  >
                    {/* Header: Title + Severity */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${badge.bg}`}>
                            {f.severity}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {f.agent === "fact"
                              ? "TruthMark™ Verification"
                              : f.agent === "visual"
                              ? "VisualGuard™ Identity Auditor"
                              : f.agent === "accessibility"
                              ? "VisualGuard™ Accessibility"
                              : f.agent === "terminology"
                              ? "Controlled Vocabulary"
                              : "BrandOS Core™ Policy"}
                          </span>
                          {(f.title?.toLowerCase().includes("unsupported") || f.description?.toLowerCase().includes("unsupported")) && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded">
                              Unverified Claim (No Evidence)
                            </span>
                          )}
                          {isAccepted && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                              ✓ Suggestion Applied
                            </span>
                          )}
                          {isOverridden && (
                            <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-1.5 py-0.2 rounded">
                              Overridden by Human
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">{f.title}</h3>
                      </div>
                    </div>

                    {/* Detected Text Quote */}
                    {f.detected_text && (
                      <div className="p-2.5 rounded bg-red-50/60 border border-red-200 text-xs font-mono text-red-900 font-semibold">
                        &ldquo;{f.detected_text}&rdquo;
                      </div>
                    )}

                    {/* Explanation */}
                    <div className="text-xs text-slate-600 leading-relaxed">
                      <strong className="text-slate-800">Why it matters: </strong>
                      {f.description}
                    </div>

                    {/* Audit Evidence Trace (PRD FR-18) */}
                    {f.evidences && f.evidences.length > 0 && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-xs">
                        <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                          <FileCheck className="h-3.5 w-3.5 text-indigo-600" />
                          <span>Audit Evidence Trace</span>
                        </div>
                        {f.evidences.map((ev: any) => (
                          <div key={ev.id} className="text-slate-600 pl-5 text-[11px]">
                            <strong className="text-slate-900">{ev.source_ref || "Approved Knowledge"}:</strong> {ev.explanation}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Suggestion Card (PRD FR-19) */}
                    {f.suggestions && f.suggestions.length > 0 && !isOverridden && (
                      <div className="p-3.5 rounded-lg bg-indigo-50/60 border border-indigo-200 space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-indigo-900">
                          <span className="flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                            Approved Suggestion (Preserving Creator Intent):
                          </span>
                        </div>

                        {f.suggestions.map((s: any) => (
                          <div key={s.id} className="space-y-2">
                            <div className="text-xs font-mono p-2 bg-white rounded border border-indigo-200 text-indigo-950 font-medium">
                              &ldquo;{s.replacement_text}&rdquo;
                            </div>
                            <div className="text-[11px] text-slate-600 italic">
                              Reasoning: {s.suggestion_text}
                            </div>
                            {!isAccepted && (
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  onClick={() => handleAcceptSuggestion(f.id)}
                                  disabled={actionLoading}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
                                >
                                  <Check className="h-3 w-3" />
                                  <span>Accept Suggestion</span>
                                </button>
                                {canApproveReviews && (
                                  <button
                                    onClick={() => setOverrideFindingId(f.id)}
                                    className="inline-flex items-center gap-1 px-3 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors"
                                  >
                                    <span>Override Finding...</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Overridden note if present */}
                    {isOverridden && f.override_reason && (
                      <div className="text-xs p-2 bg-slate-100 rounded text-slate-700 font-medium">
                        <strong>Override Justification: </strong> {f.override_reason}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Human Override Dialog (PRD FR-20) */}
      {overrideFindingId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Authorized Human Override</h3>
            <p className="text-xs text-slate-500">
              Overriding a governance finding requires an audit reason. This decision will be logged permanently in the compliance audit trail.
            </p>
            <textarea
              rows={4}
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. Legal exception approved for campaign by regional director on 2026-11-06..."
              className="w-full p-3 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setOverrideFindingId(null)}
                className="px-3 py-1.5 rounded text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleOverride}
                disabled={!overrideReason.trim() || actionLoading}
                className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-50"
              >
                Confirm Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Revision Modal (BrandFlow Reviewer Workflow) */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              <h3 className="text-base font-bold text-slate-900">Request Content Revision</h3>
            </div>
            <p className="text-xs text-slate-500">
              Provide feedback or specific modification instructions to the creator. The review status will change to &ldquo;Revision Required&rdquo;.
            </p>
            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Please replace unverified superlative claim '#1 platform' and adjust contrast ratio on button overlay..."
              className="w-full p-3 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-1.5 rounded text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={!rejectReason.trim() || actionLoading}
                className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50"
              >
                Submit Revision Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Remediation Studio Modal */}
      <AutoRemediationStudio
        reviewId={id}
        isOpen={showRemediationStudio}
        onClose={() => setShowRemediationStudio(false)}
        onRemediationApplied={loadReview}
      />

      {/* Chief Brand Officer Governance Clearance Certificate */}
      <GovernanceCertificateModal
        isOpen={showCertificateModal}
        onClose={() => setShowCertificateModal(false)}
        review={review}
        brandName={content?.title || "Active Brand"}
      />
    </div>
  );
}
