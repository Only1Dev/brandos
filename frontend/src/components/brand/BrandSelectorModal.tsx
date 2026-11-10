"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBrand, BRANDS, BrandSlug, UserRole, BRAND_USERS, UserProfile } from "@/context/BrandContext";
import { api } from "@/lib/api";
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
    switchUser,
    isBrandModalOpen,
    setIsBrandModalOpen,
    setIsRegisterModalOpen,
  } = useBrand();

  // Mode: "brand" (Tenant Workspace) | "superadmin" (Global Master Admin)
  const [gatewayMode, setGatewayMode] = useState<"brand" | "superadmin">("brand");

  // Brand mode state
  const [selectedBrand, setSelectedBrand] = useState<BrandSlug>(activeBrand);
  const [selectedUser, setSelectedUser] = useState<UserProfile>(BRAND_USERS[activeBrand][0]);
  const [brandPassword, setBrandPassword] = useState(`${activeBrand}-${BRAND_USERS[activeBrand][0].role}`);

  // SuperAdmin mode state
  const [superAdminPassword, setSuperAdminPassword] = useState("superadmin-master");
  const [errorMsg, setErrorMsg] = useState("");

  // Live dynamic stats for brands (auto-updates rules and facts counts from Brand Brain)
  const [brandStats, setBrandStats] = useState<Record<string, { rules_count: number; facts_count: number }>>({});

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await api.getSuperAdminOverview();
        if (res?.organizations) {
          const statsMap: Record<string, { rules_count: number; facts_count: number }> = {};
          for (const org of res.organizations) {
            statsMap[org.slug] = {
              rules_count: org.stats?.rules_count ?? 0,
              facts_count: org.stats?.facts_count ?? 0,
            };
          }
          setBrandStats(statsMap);
          return;
        }
      } catch (e) {
        // Direct query fallback
        try {
          const [aureonRules, aureonFacts, solariaRules, solariaFacts] = await Promise.all([
            api.getRules(undefined, "aureon"),
            api.getFacts(undefined, "aureon"),
            api.getRules(undefined, "solaria"),
            api.getFacts(undefined, "solaria"),
          ]);
          setBrandStats({
            aureon: { rules_count: aureonRules.length, facts_count: aureonFacts.length },
            solaria: { rules_count: solariaRules.length, facts_count: solariaFacts.length },
          });
        } catch (err) {
          console.error("Error loading live brand stats:", err);
        }
      }
    };

    fetchCounts();
  }, [isBrandModalOpen]);

  if (!isBrandModalOpen) return null;

  const handleBrandSelect = (slug: BrandSlug) => {
    setSelectedBrand(slug);
    setErrorMsg("");
    const defaultUser = BRAND_USERS[slug][0];
    setSelectedUser(defaultUser);
    setBrandPassword(`${slug}-${defaultUser.role}`);
  };

  const handleUserProfileSelect = (user: UserProfile) => {
    setSelectedUser(user);
    setErrorMsg("");
    setBrandPassword(`${selectedBrand}-${user.role}`);
  };

  const handleBrandLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("brandos_has_chosen_brand", "true");
    switchBrand(selectedBrand, selectedUser.role);
    switchUser(selectedUser);
    setIsBrandModalOpen(false);
    router.push("/dashboard");
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
                    <span className="font-semibold text-slate-500">
                      {brandStats["aureon"]?.rules_count !== undefined ? `${brandStats["aureon"].rules_count} Rules` : "Rules syncing..."} • {brandStats["aureon"]?.facts_count !== undefined ? `${brandStats["aureon"].facts_count} Verified Fact${brandStats["aureon"].facts_count === 1 ? "" : "s"}` : "Facts syncing..."}
                    </span>
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
                    <span className="font-semibold text-slate-500">
                      {brandStats["solaria"]?.rules_count !== undefined ? `${brandStats["solaria"].rules_count} Rules` : "Rules syncing..."} • {brandStats["solaria"]?.facts_count !== undefined ? `${brandStats["solaria"].facts_count} Verified Fact${brandStats["solaria"].facts_count === 1 ? "" : "s"}` : "Facts syncing..."}
                    </span>
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

              {/* Profile Selection & Login Form */}
              <form onSubmit={handleBrandLoginSubmit} className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-indigo-600" />
                    Select Active Profile in {selectedBrand === "aureon" ? "Aureon" : "Solaria"} (4 Profiles Available):
                  </div>
                  <div className="text-[11px] text-slate-500">Enterprise Role-Based Access Enforced</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {BRAND_USERS[selectedBrand].map((u) => {
                    const isSelected = selectedUser.email === u.email;
                    return (
                      <button
                        key={u.email}
                        type="button"
                        onClick={() => handleUserProfileSelect(u)}
                        className={`px-3 py-2.5 rounded-lg text-left transition-all border ${
                          isSelected
                            ? "bg-white border-indigo-600 shadow-sm ring-1 ring-indigo-600/30 text-indigo-900"
                            : "bg-white/60 border-slate-200 text-slate-700 hover:bg-white"
                        }`}
                      >
                        <div className="text-xs font-bold flex items-center justify-between">
                          <span className="truncate pr-1">{u.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            u.role === "admin"
                              ? "bg-indigo-100 text-indigo-800"
                              : u.role === "reviewer"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-sky-100 text-sky-800"
                          }`}>
                            {u.role === "admin" ? "Admin" : u.role === "reviewer" ? "Manager" : "Creator"}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 truncate">{u.title}</div>
                      </button>
                    );
                  })}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5 text-slate-500" />
                      Workspace Access Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setBrandPassword(`${selectedBrand}-${selectedUser.role}`)}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <Zap className="h-3 w-3" />
                      Auto-Fill Default Key ({selectedBrand}-${selectedUser.role})
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={brandPassword}
                      onChange={(e) => setBrandPassword(e.target.value)}
                      placeholder={`Enter password (${selectedBrand}-${selectedUser.role})`}
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
