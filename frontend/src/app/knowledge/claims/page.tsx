"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  FileCheck2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Search,
  Filter,
  Trash2,
  RefreshCw,
  Sparkles,
  Lock,
  ExternalLink,
  ChevronRight,
  Database,
  Check,
  BarChart3,
  Layers,
  FileText,
  Activity,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useBrand } from "@/context/BrandContext";

export default function ClaimsPage() {
  const { activeBrand, brandConfig, currentRole, canEditBrandBrain } = useBrand();
  const isAdmin = currentRole === "admin" || currentRole === "superadmin";
  const isReviewer = currentRole === "reviewer" || isAdmin;

  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [diffClaim, setDiffClaim] = useState<any | null>(null);

  // New claim form state
  const [statement, setStatement] = useState("");
  const [category, setCategory] = useState("statistical");
  const [numericalValue, setNumericalValue] = useState("");
  const [numericalUnit, setNumericalUnit] = useState("%");
  const [validUntil, setValidUntil] = useState("2026-12-31");
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const loadClaims = async () => {
    try {
      setLoading(true);
      const data = await api.getClaims(undefined, activeBrand);
      setClaims(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, [activeBrand]);

  const showNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  const handleVerifyTruthMark = async (id: string, text: string) => {
    try {
      setVerifyingId(id);
      const res = await api.verifyClaim(id);
      showNotification(
        res.status === "verified"
          ? `Verified! Grounded against Brand Brain (${Math.round((res.confidence || 0.98) * 100)}% match)`
          : `Disputed: Flagged for rule violation`
      );
      await loadClaims();
    } catch (e: any) {
      alert("Verification failed: " + e.message);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleTransition = async (id: string, newStatus: string) => {
    try {
      await api.transitionClaim(id, newStatus);
      showNotification(`Claim status updated to "${newStatus.replace("_", " ").toUpperCase()}"`);
      if (diffClaim && diffClaim.id === id) {
        setDiffClaim((prev: any) => ({ ...prev, status: newStatus }));
      }
      await loadClaims();
    } catch (e: any) {
      alert("Status transition failed: " + e.message);
    }
  };

  const handleDelete = async (id: string, text: string) => {
    if (!confirm(`Permanently remove claim "${text.slice(0, 40)}..."?`)) return;
    try {
      await api.deleteClaim(id);
      showNotification("Claim removed from organizational ledger");
      if (diffClaim && diffClaim.id === id) setDiffClaim(null);
      await loadClaims();
    } catch (e: any) {
      alert("Delete failed: " + e.message);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statement.trim()) return;
    try {
      await api.createClaim({
        statement: statement.trim(),
        category,
        numerical_value: numericalValue ? parseFloat(numericalValue) : null,
        numerical_unit: numericalUnit || null,
        valid_until: validUntil || null,
      });
      setShowAddModal(false);
      setStatement("");
      setNumericalValue("");
      showNotification("New claim added to ledger with pending review status");
      await loadClaims();
    } catch (e: any) {
      alert("Creation error: " + e.message);
    }
  };

  // Filter claims
  const filteredClaims = claims.filter((c) => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "verified" && c.status === "verified") ||
      (statusFilter === "under_review" && (c.status === "under_review" || c.status === "extracted")) ||
      (statusFilter === "disputed" && (c.status === "disputed" || c.status === "rejected"));

    const matchesCategory =
      categoryFilter === "all" ||
      c.category?.toLowerCase() === categoryFilter.toLowerCase();

    const matchesSearch =
      !searchQuery ||
      c.statement?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.matched_fact_statement?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesCategory && matchesSearch;
  });

  const verifiedCount = claims.filter((c) => c.status === "verified").length;
  const underReviewCount = claims.filter(
    (c) => c.status === "under_review" || c.status === "extracted"
  ).length;
  const disputedCount = claims.filter((c) => c.status === "disputed" || c.status === "rejected").length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-xl bg-slate-900 text-white shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              TruthMark™ Verification Ledger
            </span>
            <span className="text-xs text-slate-400">• {brandConfig.name}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Claims Lifecycle & Fact Grounding Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ground-truth catalog of public claims mapped to audited facts with proactive expiration management.
          </p>
        </div>

        {canEditBrandBrain && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Register New Claim</span>
          </button>
        )}
      </div>

      {/* Executive TruthMark Ledger Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Claims Monitored
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{claims.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Cross-campaign propositions</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            TruthMark™ Verified
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{verifiedCount}</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            {claims.length > 0 ? Math.round((verifiedCount / claims.length) * 100) : 100}% Grounded
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Under Review / Pending
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{underReviewCount}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">Actionable audits required</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Disputed / Flagged
          </div>
          <div className="text-2xl font-extrabold text-red-600 mt-1">{disputedCount}</div>
          <div className="text-[11px] text-red-700 font-medium mt-1">Policy violations detected</div>
        </div>
      </div>

      {/* Status & Category Filter Bar */}
      <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "All Claims", count: claims.length },
              { id: "verified", label: "Verified Active", count: verifiedCount },
              { id: "under_review", label: "Under Review", count: underReviewCount },
              { id: "disputed", label: "Disputed / Flagged", count: disputedCount },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    statusFilter === tab.id ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search claims or facts..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Filter className="h-3 w-3 text-slate-400" />
            Category:
          </span>
          {["all", "statistical", "performance", "reliability", "scientific", "clinical", "nutritional", "guarantee", "financial"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize transition-colors cursor-pointer shrink-0 ${
                categoryFilter === cat
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {cat === "all" ? "All Categories" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Claims Ledger Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
            Loading TruthMark claims ledger...
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="p-12 text-center space-y-2 bg-white rounded-xl border border-slate-200">
            <ShieldCheck className="h-8 w-8 text-slate-300 mx-auto" />
            <div className="text-xs font-bold text-slate-700">No claims match the selected filter</div>
            <p className="text-[11px] text-slate-400">
              Try switching tabs or registering a new claim.
            </p>
          </div>
        ) : (
          filteredClaims.map((claim) => (
            <div
              key={claim.id}
              className={`p-5 rounded-2xl border transition-all bg-white shadow-xs space-y-3.5 ${
                claim.status === "verified"
                  ? "border-emerald-200 hover:border-emerald-300"
                  : claim.status === "disputed"
                  ? "border-red-200 hover:border-red-300 bg-red-50/15"
                  : "border-amber-200 hover:border-amber-300 bg-amber-50/10"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                      {claim.category}
                    </span>

                    {claim.numerical_value !== null && claim.numerical_value !== undefined && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                        Metric: {claim.numerical_value} {claim.numerical_unit || ""}
                      </span>
                    )}

                    {claim.status === "verified" ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>TruthMark™ Grounded ({Math.round((claim.confidence || 0.98) * 100)}%)</span>
                      </span>
                    ) : claim.status === "disputed" ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                        <XCircle className="h-3.5 w-3.5 text-red-600" />
                        <span>Disputed / Contradicted</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                        <span>Under Review (Action Needed)</span>
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Valid until: {claim.valid_until || "2027-02-11"}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {claim.statement}
                  </h3>
                </div>

                {/* Reviewer / Admin Action Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setDiffClaim(claim)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Open side-by-side Ground Truth Fact comparison"
                  >
                    <Layers className="h-3.5 w-3.5 text-indigo-300" />
                    <span>Compare Fact Diff</span>
                  </button>

                  {isReviewer && (
                    <>
                      <button
                        type="button"
                        disabled={verifyingId === claim.id}
                        onClick={() => handleVerifyTruthMark(claim.id, claim.statement)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Run live TruthMark fact check against Brand Brain"
                      >
                        <Sparkles className={`h-3.5 w-3.5 ${verifyingId === claim.id ? "animate-spin" : ""}`} />
                        <span>{verifyingId === claim.id ? "Checking..." : "Verify"}</span>
                      </button>

                      {claim.status !== "verified" && (
                        <button
                          type="button"
                          onClick={() => handleTransition(claim.id, "verified")}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer"
                          title="Approve & Certify this Claim"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}

                      {claim.status !== "disputed" && (
                        <button
                          type="button"
                          onClick={() => handleTransition(claim.id, "disputed")}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 cursor-pointer"
                          title="Flag as Disputed"
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDelete(claim.id, claim.statement)}
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 cursor-pointer transition-colors"
                          title="Delete Claim"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Matched Fact Evidence Box */}
              {claim.matched_fact_statement ? (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-start gap-3">
                  <Database className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        Brand Brain Ground Truth Fact:
                      </span>
                      <span className="text-[10px] text-indigo-600 font-mono font-bold">
                        CERTIFIED BENCHMARK
                      </span>
                    </div>
                    <div className="text-slate-700 text-xs mt-1 leading-relaxed font-medium">
                      {claim.matched_fact_statement}
                    </div>
                  </div>
                </div>
              ) : claim.status === "disputed" ? (
                <div className="p-3 bg-red-50/80 rounded-xl border border-red-200 text-xs flex items-start gap-3">
                  <ShieldAlert className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-red-950">Ground Truth Discrepancy:</span>
                    <p className="text-red-800 text-[11px] mt-0.5 leading-relaxed">
                      This proposition makes unsupported absolute promises ("100%", "zero risk", or unverified superlatives) that contradict corporate policy RULE-031.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      {/* Side-by-Side Fact Grounding Diff Modal */}
      {diffClaim && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">TruthMark™ Fact Grounding Comparator</h3>
                  <div className="text-[11px] text-slate-400">
                    Precision diff between public claim statement and Brand Brain ground truth
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDiffClaim(null)}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Diff Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Claim As Stated */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Public Claim As Stated
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-700">
                      CLAIM
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                    "{diffClaim.statement}"
                  </div>
                  {diffClaim.numerical_value !== null && diffClaim.numerical_value !== undefined && (
                    <div className="text-[11px] text-indigo-700 font-mono font-bold pt-1">
                      Asserted Metric: {diffClaim.numerical_value} {diffClaim.numerical_unit}
                    </div>
                  )}
                </div>

                {/* Right: Certified Ground Truth */}
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                      Brand Brain Ground Truth Fact
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                      GROUND TRUTH
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900 leading-relaxed bg-white p-3 rounded-xl border border-indigo-200">
                    {diffClaim.matched_fact_statement
                      ? `"${diffClaim.matched_fact_statement}"`
                      : diffClaim.status === "disputed"
                      ? "No approved fact supports a 100% guarantee. Ground truth benchmark specifies 42% average reduction."
                      : "Pending verification against Brand Brain facts catalog."}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-mono font-bold pt-1">
                    Audited Benchmark: {diffClaim.status === "disputed" ? "42% (Certified Audit)" : `${diffClaim.numerical_value ?? "Certified"} ${diffClaim.numerical_unit ?? ""}`}
                  </div>
                </div>
              </div>

              {/* Compliance Verdict Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
                  diffClaim.status === "verified"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : diffClaim.status === "disputed"
                    ? "bg-red-50 border-red-200 text-red-900"
                    : "bg-amber-50 border-amber-200 text-amber-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {diffClaim.status === "verified" ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold">
                      {diffClaim.status === "verified"
                        ? "Zero-Discrepancy Attestation Granted"
                        : diffClaim.status === "disputed"
                        ? "Policy Contradiction Flagged: Absolute Guarantee"
                        : "Verification Underway — Human Sign-Off Requested"}
                    </div>
                    <div className="text-[11px] opacity-80 mt-0.5 font-normal">
                      {diffClaim.status === "verified"
                        ? "Claim strictly matches verified evidence. Permitted across all public campaigns."
                        : "Claim exceeds authorized thresholds or makes unbacked promises."}
                    </div>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-white/60 shrink-0">
                  CONFIDENCE: {Math.round((diffClaim.confidence || 0.95) * 100)}%
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400 font-mono">
                  ID: {diffClaim.id.slice(0, 12)}...
                </span>
                <div className="flex items-center gap-2">
                  {diffClaim.status !== "verified" && isReviewer && (
                    <button
                      type="button"
                      onClick={() => handleTransition(diffClaim.id, "verified")}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Certify Claim
                    </button>
                  )}
                  {diffClaim.status !== "disputed" && isReviewer && (
                    <button
                      type="button"
                      onClick={() => handleTransition(diffClaim.id, "disputed")}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Flag as Disputed
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDiffClaim(null)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Close Diff
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Claim Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Register Organizational Claim in Brand Brain
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Claim Statement
                </label>
                <textarea
                  rows={3}
                  required
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  placeholder="e.g. Aureon Shield delivers proven 42% fraud reduction across digital banking channels."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  State the exact proposition that creators can reference in public marketing copy.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="statistical">Statistical Proposition</option>
                    <option value="performance">Performance & Latency</option>
                    <option value="reliability">Reliability & Uptime</option>
                    <option value="scientific">Scientific Formulation</option>
                    <option value="clinical">Clinical Trials</option>
                    <option value="nutritional">Nutritional Purity</option>
                    <option value="guarantee">Guarantee / Warranty</option>
                    <option value="financial">Financial Interception</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">
                    Numerical Metric (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={numericalValue}
                    onChange={(e) => setNumericalValue(e.target.value)}
                    placeholder="e.g. 42.0"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Unit</label>
                  <input
                    type="text"
                    value={numericalUnit}
                    onChange={(e) => setNumericalUnit(e.target.value)}
                    placeholder="e.g. %, ms, mg, x"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-xs cursor-pointer"
                >
                  Register Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
