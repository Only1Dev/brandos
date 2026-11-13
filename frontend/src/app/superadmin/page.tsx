"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBrand, BrandSlug } from "@/context/BrandContext";
import { api } from "@/lib/api";
import {
  Globe,
  Shield,
  Leaf,
  FileText,
  Database,
  ArrowRight,
  Download,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Users,
  KeyRound,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

interface OrgStats {
  guidelines_count: number;
  rules_count: number;
  facts_count: number;
  terms_count: number;
  assets_count: number;
  reviews_count: number;
  avg_score: number;
  blocked_count: number;
  pass_count: number;
}

interface SuperAdminOrg {
  id: string;
  name: string;
  slug: BrandSlug;
  description: string;
  primary_color: string;
  pdf_file: string;
  stats: OrgStats;
}

interface SuperAdminData {
  organizations: SuperAdminOrg[];
  global_summary: {
    total_brands: number;
    total_reviews: number;
    total_governance_rules: number;
    total_verified_facts: number;
    platform_status: string;
  };
}

export default function SuperAdminPage() {
  const router = useRouter();
  const { switchBrand, setIsRegisterModalOpen, setIsBrandModalOpen } = useBrand();
  const [data, setData] = useState<SuperAdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  // Unstop-style confirmation modal state (type "CONFIRM" to proceed)
  const [deleteModalOrg, setDeleteModalOrg] = useState<{ slug: string; name: string } | null>(null);
  const [confirmInput, setConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const json = await api.getSuperAdminOverview();
      setData(json);
    } catch (e: any) {
      console.error(e);
      setMessage("Error loading overview: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleLaunchWorkspace = (slug: BrandSlug) => {
    switchBrand(slug, "admin");
    router.push("/dashboard");
  };

  const handleReingest = async (slug: BrandSlug) => {
    try {
      setIngesting(slug);
      await api.loadDemoGuidelinePdf(slug);
      setMessage(`Successfully re-ingested ${slug} guidelines into Brand Brain!`);
      await fetchOverview();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIngesting(null);
    }
  };

  const openDeleteModal = (slug: string, name: string) => {
    setDeleteModalOrg({ slug, name });
    setConfirmInput("");
    setDeleteError("");
  };

  const closeDeleteModal = () => {
    setDeleteModalOrg(null);
    setConfirmInput("");
    setDeleteError("");
    setIsDeleting(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalOrg) return;
    if (confirmInput.trim().toUpperCase() !== "CONFIRM") {
      setDeleteError("Please type 'CONFIRM' to authorize deletion.");
      return;
    }
    try {
      setIsDeleting(true);
      setDeleteError("");
      await api.deleteOrganization(deleteModalOrg.slug);
      setMessage(`Brand workspace "${deleteModalOrg.name}" (${deleteModalOrg.slug}) has been permanently deleted.`);
      closeDeleteModal();
      await fetchOverview();
    } catch (e: any) {
      setDeleteError("Error deleting brand: " + (e.message || "Failed"));
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="h-8 w-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin mx-auto mb-3" />
        <div className="text-xs text-slate-500 font-medium">Loading Master SuperAdmin Console...</div>
      </div>
    );
  }

  const { organizations = [], global_summary } = data || {
    organizations: [],
    global_summary: {
      total_brands: 2,
      total_reviews: 8,
      total_governance_rules: 20,
      total_verified_facts: 3,
      platform_status: "Operational",
    },
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-2xl p-6 text-white border border-purple-900/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-8 w-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold">
              <Globe className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-bold tracking-tight">Master Admin Portal — Multi-Brand Governance</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-200 border border-purple-500/30 uppercase tracking-wider">
              Cross-Tenant SuperAdmin
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            Centralized intelligence console for Chief Brand Officers and Enterprise Administrators.
            Compare real-time compliance metrics, Brand Brain rule coverage, and firewall enforcement across all brands.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBrandModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors flex items-center gap-2 border border-white/20"
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Switch Brand Workspace</span>
          </button>
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-colors flex items-center gap-2"
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>+ Onboard New Brand</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage("")} className="text-slate-400 hover:text-slate-600 text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Global Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Tenant Brands</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{global_summary.total_brands} Brands</div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Aureon Technologies & Solaria Wellness
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Governance Rules</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{global_summary.total_governance_rules} Rules</div>
          <div className="text-[10px] text-indigo-600 font-medium mt-1">
            Enforced across tone, visual, claims & terms
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Verified Truth Facts</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{global_summary.total_verified_facts} Verified</div>
          <div className="text-[10px] text-slate-500 mt-1">Grounding knowledge in Brand Brain</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Firewall Status</div>
          <div className="text-sm font-bold text-emerald-600 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            <span>Zero-Tolerance Active</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Off-brand content directly 0/100</div>
        </div>
      </div>

      {/* Side-by-Side Brand Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Brand Workspaces & Compliance Posture</h2>
          <span className="text-xs text-slate-500">Click any brand to switch workspace</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {organizations.map((org) => {
            const isSolaria = org.slug === "solaria";
            const pdfUrl = isSolaria
              ? "/Solaria_Wellness_Official_Brand_Guidelines_2026.pdf"
              : "/Aureon_Official_Brand_Guidelines_2026.pdf";

            return (
              <div
                key={org.id}
                className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Brand Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-12 w-12 rounded-xl text-white flex items-center justify-center shadow-md ${
                          isSolaria ? "bg-emerald-600 shadow-emerald-500/20" : "bg-indigo-600 shadow-indigo-500/20"
                        }`}
                      >
                        {isSolaria ? <Leaf className="h-6 w-6" /> : <Shield className="h-6 w-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900">{org.name}</h3>
                          <span
                            className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase"
                            style={{
                              backgroundColor: `${org.primary_color}18`,
                              color: org.primary_color,
                            }}
                          >
                            slug: {org.slug}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{org.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Brand Brain Metric Grid */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 my-4 text-center">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase">Rules</div>
                      <div className="text-base font-bold text-slate-800">{org.stats.rules_count}</div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase">Facts</div>
                      <div className="text-base font-bold text-slate-800">{org.stats.facts_count}</div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase">Disallowed Terms</div>
                      <div className="text-base font-bold text-slate-800">{org.stats.terms_count}</div>
                    </div>
                  </div>

                  {/* Audit Statistics */}
                  <div className="space-y-2 mb-6">
                    <div className="text-xs font-semibold text-slate-700">Governance Firewall Performance:</div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="border border-slate-200 rounded-lg p-2">
                        <div className="text-slate-500 text-[10px]">Audits Conducted</div>
                        <div className="font-bold text-slate-800 text-sm mt-0.5">{org.stats.reviews_count}</div>
                      </div>
                      <div className="border border-slate-200 rounded-lg p-2">
                        <div className="text-slate-500 text-[10px]">Avg Compliance Score</div>
                        <div className="font-bold text-slate-800 text-sm mt-0.5">{org.stats.avg_score}%</div>
                      </div>
                      <div className="border border-rose-200 bg-rose-50/50 rounded-lg p-2">
                        <div className="text-rose-600 text-[10px] font-semibold">Blocked / Failed</div>
                        <div className="font-bold text-rose-700 text-sm mt-0.5">{org.stats.blocked_count}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLaunchWorkspace(org.slug)}
                      className={`flex-1 py-2 px-3 rounded-lg text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 ${
                        isSolaria ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700"
                      }`}
                    >
                      <span>Enter {org.name.split(" ")[0]} Workspace</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>

                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1"
                      title="Download Official Guidelines PDF"
                    >
                      <Download className="h-3.5 w-3.5 text-slate-500" />
                      <span>PDF</span>
                    </a>

                    <button
                      onClick={() => handleReingest(org.slug)}
                      disabled={ingesting === org.slug}
                      className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                      title="Re-ingest Brand Guidelines PDF into vector DB"
                    >
                      <RotateCw className={`h-3.5 w-3.5 ${ingesting === org.slug ? "animate-spin" : ""}`} />
                      <span>Sync</span>
                    </button>

                    {!["aureon", "solaria"].includes(org.slug) && (
                      <button
                        onClick={() => openDeleteModal(org.slug, org.name)}
                        className="px-3 py-2 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Delete this brand workspace"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enterprise Role Access Directory */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">Enterprise Role Governance & Credential Directory</h3>
          <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-semibold">
            RBAC Enforced
          </span>
        </div>
        <p className="text-xs text-slate-600">
          BrandOS strictly isolates permissions based on organizational roles across both tenant brands.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-900 mb-1 flex items-center justify-between">
              <span>Administrator</span>
              <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">FULL ACCESS</span>
            </div>
            <div className="text-slate-500 text-[11px] mb-2">Can configure Brand Brain, edit rules, facts, terminology & logos.</div>
            <div className="font-mono text-[11px] bg-slate-50 p-2 rounded border border-slate-100 text-slate-700">
              Access Keys: <span className="font-semibold text-indigo-700">aureon-admin</span> | <span className="font-semibold text-emerald-700">solaria-admin</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-900 mb-1 flex items-center justify-between">
              <span>Brand Reviewer / Mgr</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">APPROVALS</span>
            </div>
            <div className="text-slate-500 text-[11px] mb-2">Can review, approve, reject & override audits. Cannot modify rules.</div>
            <div className="font-mono text-[11px] bg-slate-50 p-2 rounded border border-slate-100 text-slate-700">
              Access Keys: <span className="font-semibold text-indigo-700">aureon-reviewer</span> | <span className="font-semibold text-emerald-700">solaria-reviewer</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-900 mb-1 flex items-center justify-between">
              <span>Content Creator</span>
              <span className="px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 text-[10px] font-bold">SUBMIT ONLY</span>
            </div>
            <div className="text-slate-500 text-[11px] mb-2">Can submit copy and view reports. Cannot approve or edit brand brain.</div>
            <div className="font-mono text-[11px] bg-slate-50 p-2 rounded border border-slate-100 text-slate-700">
              Access Keys: <span className="font-semibold text-indigo-700">aureon-creator</span> | <span className="font-semibold text-emerald-700">solaria-creator</span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* UNSTOP-STYLE CONFIRMATION MODAL: TYPE "CONFIRM" TO PROCEED */}
      {/* ======================================================== */}
      {deleteModalOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-[#0f172a] border border-rose-500/40 p-6 shadow-2xl shadow-rose-950/50 space-y-5 text-white">
            {/* Close button */}
            <button
              onClick={closeDeleteModal}
              disabled={isDeleting}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="flex items-start gap-3.5 pr-6">
              <div className="h-10 w-10 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Delete Brand Workspace?
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  This action is <strong className="text-rose-400 font-semibold">permanent and irreversible</strong>. All Brand Brain rules, verified facts, claims, and audit logs for <span className="text-white font-semibold">{deleteModalOrg.name}</span> (<code className="text-rose-300 font-mono text-[11px]">{deleteModalOrg.slug}</code>) will be purged.
                </p>
              </div>
            </div>

            {/* Warning Safeguard Box */}
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/20 text-xs text-rose-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-rose-200">
                <Shield className="h-3.5 w-3.5 text-rose-400" />
                <span>Zero-Tolerance Deletion Safeguard</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                To prevent accidental deletion of enterprise brand identity, type <strong className="text-white font-mono bg-white/10 px-1 py-0.5 rounded uppercase">CONFIRM</strong> in the box below to authorize.
              </p>
            </div>

            {/* Verification Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Verification Phrase:</span>
                <span className="text-[11px] font-mono text-slate-400">
                  Type: <strong className="text-rose-400 font-bold">CONFIRM</strong>
                </span>
              </label>

              <input
                type="text"
                autoFocus
                value={confirmInput}
                onChange={(e) => {
                  setConfirmInput(e.target.value);
                  if (deleteError) setDeleteError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && confirmInput.trim().toUpperCase() === "CONFIRM" && !isDeleting) {
                    handleConfirmDelete();
                  }
                }}
                placeholder="Type CONFIRM to confirm..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white font-mono text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all uppercase"
              />
            </div>

            {deleteError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                {deleteError}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 border border-white/10 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={confirmInput.trim().toUpperCase() !== "CONFIRM" || isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-rose-600/30 transition-all flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <RotateCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting Workspace...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Workspace</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
