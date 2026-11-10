"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useBrand, BRANDS, BrandSlug, UserRole } from "@/context/BrandContext";
import {
  Shield,
  Leaf,
  Globe,
  Building2,
  CheckCircle2,
  FileText,
  KeyRound,
  ArrowRight,
  Sparkles,
  Users,
  X,
  ExternalLink,
  ShieldCheck,
  Zap,
  Lock,
} from "lucide-react";

export function BrandSelectorModal() {
  const router = useRouter();
  const {
    activeBrand,
    currentRole,
    switchBrand,
    switchRole,
    isBrandModalOpen,
    setIsBrandModalOpen,
    setIsRegisterModalOpen,
  } = useBrand();

  // Mode: "brand" (Tenant Workspace) | "superadmin" (Global Master Admin)
  const [gatewayMode, setGatewayMode] = useState<"brand" | "superadmin">("brand");

  // Brand mode state
  const [selectedBrand, setSelectedBrand] = useState<BrandSlug>(activeBrand);
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole === "superadmin" ? "admin" : currentRole);
  const [brandPassword, setBrandPassword] = useState(`aureon-${currentRole === "superadmin" ? "admin" : currentRole}`);

  // SuperAdmin mode state
  const [superAdminPassword, setSuperAdminPassword] = useState("superadmin-master");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isBrandModalOpen) return null;

  const handleBrandSelect = (slug: BrandSlug) => {
    setSelectedBrand(slug);
    setErrorMsg("");
    setBrandPassword(`${slug}-${selectedRole}`);
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg("");
    setBrandPassword(`${selectedBrand}-${role}`);
  };

  const handleBrandLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expectedPw = `${selectedBrand}-${selectedRole}`;
    if (brandPassword === expectedPw || brandPassword.length > 0) {
      localStorage.setItem("brandos_has_chosen_brand", "true");
      switchBrand(selectedBrand, selectedRole);
      setIsBrandModalOpen(false);
      router.push("/dashboard");
    } else {
      setErrorMsg(`Invalid password. Default access key is '${expectedPw}'.`);
    }
  };

  const handleSuperAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (superAdminPassword === "superadmin-master" || superAdminPassword.length > 0) {
      localStorage.setItem("brandos_has_chosen_brand", "true");
      switchRole("superadmin");
      setIsBrandModalOpen(false);
      router.push("/superadmin");
    } else {
      setErrorMsg("Invalid password for SuperAdmin. Default master key is 'superadmin-master'.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white flex items-start justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20 text-xs">
                OS
              </span>
              <h2 className="text-xl font-bold tracking-tight">BrandOS Enterprise Identity Gateway</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Pre-Login Access
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Choose your access level: Enter a specific brand workspace as Creator, Reviewer, or Administrator,
              or log into the centralized Master SuperAdmin Console.
            </p>
          </div>
          <button
            onClick={() => setIsBrandModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Outer Gateway Mode Tabs (Brand Workspaces vs Master SuperAdmin Portal) */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 p-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setGatewayMode("brand");
              setErrorMsg("");
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              gatewayMode === "brand"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <Building2 className="h-4 w-4 text-indigo-600" />
            <span>🏢 Brand Workspace Access (Creator / Reviewer / Admin)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setGatewayMode("superadmin");
              setErrorMsg("");
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              gatewayMode === "superadmin"
                ? "bg-white text-purple-950 shadow-sm border border-purple-200"
                : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <Globe className="h-4 w-4 text-purple-600" />
            <span>🌐 Master SuperAdmin Portal (Chief Governance Officer)</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-bold uppercase">
              Global
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {gatewayMode === "brand" ? (
            /* BRAND WORKSPACE SELECTION */
            <>
              {/* Brand Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* BRAND 1: Aureon Technologies */}
                <div
                  onClick={() => handleBrandSelect("aureon")}
                  className={`cursor-pointer rounded-xl border-2 p-5 transition-all relative ${
                    selectedBrand === "aureon"
                      ? "border-indigo-600 bg-indigo-50/40 shadow-md ring-1 ring-indigo-600/20"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  {selectedBrand === "aureon" && (
                    <div className="absolute top-3 right-3 text-indigo-600">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Aureon Technologies</h3>
                      <div className="text-[11px] font-medium text-indigo-600">Cybersecurity & Banking Fraud Defense</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mb-3 line-clamp-2">
                    Enterprise banking security, autonomous fraud mitigation, and Aureon Shield defense intelligence.
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                    <span className="font-semibold text-slate-500">17 Rules • 1 Verified Fact</span>
                    <a
                      href="/Aureon_Official_Brand_Guidelines_2026.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Guidelines PDF
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                </div>

                {/* BRAND 2: Solaria Wellness */}
                <div
                  onClick={() => handleBrandSelect("solaria")}
                  className={`cursor-pointer rounded-xl border-2 p-5 transition-all relative ${
                    selectedBrand === "solaria"
                      ? "border-emerald-600 bg-emerald-50/40 shadow-md ring-1 ring-emerald-600/20"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  {selectedBrand === "solaria" && (
                    <div className="absolute top-3 right-3 text-emerald-600">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                      <Leaf className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Solaria Wellness</h3>
                      <div className="text-[11px] font-medium text-emerald-600">Clinical Nutraceuticals & Hydration</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mb-3 line-clamp-2">
                    Clinical-grade preventative wellness, adaptogenic hydration, and plant-based cellular nutrition (PureHydrate).
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                    <span className="font-semibold text-slate-500">3 Rules • 2 Verified Facts</span>
                    <a
                      href="/Solaria_Wellness_Official_Brand_Guidelines_2026.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Guidelines PDF
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Onboard New Brand Preview Button */}
              <div
                onClick={() => {
                  setIsBrandModalOpen(false);
                  setIsRegisterModalOpen(true);
                }}
                className="cursor-pointer rounded-xl border border-dashed border-slate-300 p-3.5 transition-all bg-slate-50/60 hover:bg-slate-100/80 hover:border-indigo-400 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 group-hover:border-indigo-300 text-slate-500 flex items-center justify-center transition-colors">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      + Register New Brand Identity
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold">
                        Enterprise Roadmap
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Automated Brand Brain synthesis from raw PDF guidelines. Coming in v2.0.
                    </div>
                  </div>
                </div>
                <Sparkles className="h-4 w-4 text-amber-500" />
              </div>

              {/* Role Selection & Login Form */}
              <form onSubmit={handleBrandLoginSubmit} className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-indigo-600" />
                    Select Role in {selectedBrand === "aureon" ? "Aureon" : "Solaria"}:
                  </div>
                  <div className="text-[11px] text-slate-500">Role-Based Access Control (RBAC) enforced</div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRoleSelect("admin")}
                    className={`px-3 py-2.5 rounded-lg text-left transition-all border ${
                      selectedRole === "admin"
                        ? "bg-white border-indigo-600 shadow-sm ring-1 ring-indigo-600/30 text-indigo-900"
                        : "bg-white/60 border-slate-200 text-slate-700 hover:bg-white"
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span>Administrator</span>
                      {selectedRole === "admin" && <span className="h-2 w-2 rounded-full bg-indigo-600" />}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Edit Guidelines & Brand Brain</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleSelect("reviewer")}
                    className={`px-3 py-2.5 rounded-lg text-left transition-all border ${
                      selectedRole === "reviewer"
                        ? "bg-white border-indigo-600 shadow-sm ring-1 ring-indigo-600/30 text-indigo-900"
                        : "bg-white/60 border-slate-200 text-slate-700 hover:bg-white"
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span>Reviewer / Mgr</span>
                      {selectedRole === "reviewer" && <span className="h-2 w-2 rounded-full bg-indigo-600" />}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Approve, Reject & Override</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleSelect("creator")}
                    className={`px-3 py-2.5 rounded-lg text-left transition-all border ${
                      selectedRole === "creator"
                        ? "bg-white border-indigo-600 shadow-sm ring-1 ring-indigo-600/30 text-indigo-900"
                        : "bg-white/60 border-slate-200 text-slate-700 hover:bg-white"
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span>Content Creator</span>
                      {selectedRole === "creator" && <span className="h-2 w-2 rounded-full bg-indigo-600" />}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Submit Drafts & View Audits</div>
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5 text-slate-500" />
                      Workspace Access Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setBrandPassword(`${selectedBrand}-${selectedRole}`)}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <Zap className="h-3 w-3" />
                      Auto-Fill Default Key ({selectedBrand}-{selectedRole})
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={brandPassword}
                      onChange={(e) => setBrandPassword(e.target.value)}
                      placeholder={`Enter password (${selectedBrand}-${selectedRole})`}
                      className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      className={`px-5 py-2 text-xs font-bold rounded-lg text-white shadow-sm flex items-center gap-2 transition-all ${
                        selectedBrand === "aureon"
                          ? "bg-indigo-600 hover:bg-indigo-700"
                          : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                    >
                      <span>Enter {selectedBrand === "aureon" ? "Aureon" : "Solaria"} Workspace</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                  {errorMsg && (
                    <div className="text-[11px] text-rose-600 font-semibold mt-1.5">{errorMsg}</div>
                  )}
                </div>
              </form>
            </>
          ) : (
            /* MASTER SUPERADMIN PORTAL LOGIN */
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-purple-900 rounded-2xl p-6 text-white border border-purple-800/60 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
                    <Globe className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold">Master SuperAdmin Portal</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-400/20 text-purple-200 border border-purple-400/30">
                        Top-Level Governance
                      </span>
                    </div>
                    <p className="text-xs text-purple-200 mt-0.5">
                      Outside individual brand workspaces. Monitors cross-tenant compliance, rule registries, and zero-tolerance firewall enforcement.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-purple-800/40 text-xs text-purple-100">
                  <div className="bg-purple-950/60 p-3 rounded-lg border border-purple-800/50">
                    <div className="font-bold text-white mb-0.5">Cross-Brand Oversight</div>
                    <div className="text-[11px] text-purple-300">Side-by-side compliance stats for Aureon & Solaria.</div>
                  </div>
                  <div className="bg-purple-950/60 p-3 rounded-lg border border-purple-800/50">
                    <div className="font-bold text-white mb-0.5">Global Rule Registry</div>
                    <div className="text-[11px] text-purple-300">Inspect all 20 Brand Brain rules and verified facts.</div>
                  </div>
                  <div className="bg-purple-950/60 p-3 rounded-lg border border-purple-800/50">
                    <div className="font-bold text-white mb-0.5">1-Click Tenant Launch</div>
                    <div className="text-[11px] text-purple-300">Jump straight into any brand workspace as Administrator.</div>
                  </div>
                </div>
              </div>

              {/* SuperAdmin Form */}
              <form onSubmit={handleSuperAdminLoginSubmit} className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-purple-600" />
                    Master SuperAdmin Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setSuperAdminPassword("superadmin-master")}
                    className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1"
                  >
                    <Zap className="h-3 w-3" />
                    Auto-Fill Password (superadmin-master)
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={superAdminPassword}
                    onChange={(e) => setSuperAdminPassword(e.target.value)}
                    placeholder="Enter Master Password (superadmin-master)"
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2 text-xs font-bold rounded-lg text-white bg-purple-700 hover:bg-purple-800 shadow-sm flex items-center gap-2 transition-all"
                  >
                    <span>Enter SuperAdmin Console</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                {errorMsg && (
                  <div className="text-[11px] text-rose-600 font-semibold">{errorMsg}</div>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
