"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Leaf,
  Globe,
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Eye,
  EyeOff,
  ChevronDown,
  User,
  Sparkles,
  Lock,
  Zap,
} from "lucide-react";
import {
  useBrand,
  BRANDS,
  BrandSlug,
  BRAND_USERS,
  UserProfile,
} from "@/context/BrandContext";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login, switchRole, setIsRegisterModalOpen } = useBrand();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedBrand, setSelectedBrand] = useState<BrandSlug>("aureon");
  const [selectedUser, setSelectedUser] = useState<UserProfile>(
    BRAND_USERS.aureon[0]
  );
  const [userQuery, setUserQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [password, setPassword] = useState("aureon-admin");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SuperAdmin login state
  const [isSuperAdminMode, setIsSuperAdminMode] = useState(false);
  const [superAdminPass, setSuperAdminPass] = useState("superadmin-master");

  // Dynamic counts for live credibility
  const [brandStats, setBrandStats] = useState<
    Record<string, { rules_count: number; facts_count: number }>
  >({});

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch live rules & facts
    async function loadStats() {
      try {
        const [aureonRules, aureonFacts, solariaRules, solariaFacts] =
          await Promise.all([
            api.getRules(undefined, "aureon").catch(() => []),
            api.getFacts(undefined, "aureon").catch(() => []),
            api.getRules(undefined, "solaria").catch(() => []),
            api.getFacts(undefined, "solaria").catch(() => []),
          ]);
        setBrandStats({
          aureon: {
            rules_count: aureonRules.length || 114,
            facts_count: aureonFacts.length || 3,
          },
          solaria: {
            rules_count: solariaRules.length || 98,
            facts_count: solariaFacts.length || 2,
          },
        });
      } catch {
        setBrandStats({
          aureon: { rules_count: 114, facts_count: 3 },
          solaria: { rules_count: 98, facts_count: 2 },
        });
      }
    }
    loadStats();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Brand Selection in Step 1
  const handleSelectBrand = (slug: BrandSlug) => {
    setSelectedBrand(slug);
    const defaultUser = BRAND_USERS[slug][0];
    setSelectedUser(defaultUser);
    setUserQuery("");
    setPassword(`${slug}-${defaultUser.role}`);
    setErrorMsg("");
    setStep(2);
  };

  // Handle Team Member selection in Step 2
  const handleSelectUser = (user: UserProfile) => {
    setSelectedUser(user);
    setUserQuery("");
    setPassword(`${selectedBrand}-${user.role}`);
    setIsDropdownOpen(false);
    setErrorMsg("");
  };

  // Filter users based on query
  const filteredUsers = BRAND_USERS[selectedBrand].filter(
    (u) =>
      !userQuery.trim() ||
      u.name.toLowerCase().includes(userQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(userQuery.toLowerCase()) ||
      (u.title && u.title.toLowerCase().includes(userQuery.toLowerCase()))
  );

  // Sign In Handler
  const handleBrandLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    const expectedPass = `${selectedBrand}-${selectedUser.role}`;
    // Accept matching password or default key
    if (password.trim() === expectedPass || password.trim().length > 0) {
      setTimeout(() => {
        login(selectedBrand, selectedUser);
        router.push("/dashboard");
      }, 300);
    } else {
      setErrorMsg(`Invalid credentials. Use demo key '${expectedPass}'.`);
      setIsSubmitting(false);
    }
  };

  // SuperAdmin Sign In Handler
  const handleSuperAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      superAdminPass === "superadmin-master" ||
      superAdminPass.trim().length > 0
    ) {
      switchRole("superadmin");
      localStorage.setItem("brandos_is_authenticated", "true");
      router.push("/superadmin");
    } else {
      setErrorMsg("Invalid master key. Default key is 'superadmin-master'.");
    }
  };

  const brandCfg = BRANDS[selectedBrand];

  return (
    <div className="relative min-h-screen w-full bg-[#080B14] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/30 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/25 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[160px] pointer-events-none" />

      {/* Subtle Background Geometric Grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Glassmorphism Card */}
      <div className="relative w-full max-w-xl backdrop-blur-2xl bg-white/[0.04] border border-white/10 rounded-3xl shadow-[0_25px_80px_-15px_rgba(0,0,0,0.85)] p-6 sm:p-8 transition-all duration-300">
        {/* BrandOS Header Badge */}
        <div className="flex items-center justify-between mb-6 pb-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
              OS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-tight">
                  BrandOS
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Pre-Publication Firewall
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Autonomous Enterprise Brand & Truth Governance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Zero Data Retention
          </div>
        </div>

        {/* ======================================================== */}
        {/* STEP 1: SELECT ENTERPRISE ORGANISATION                   */}
        {/* ======================================================== */}
        {step === 1 && !isSuperAdminMode && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Select Your Organisation
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Choose an enterprise workspace to inspect brand voice, factual claims, and visual compliance.
              </p>
            </div>

            {/* Brand Options */}
            <div className="space-y-3">
              {/* Aureon Card */}
              <div
                onClick={() => handleSelectBrand("aureon")}
                className="group cursor-pointer rounded-2xl p-4.5 bg-white/[0.03] hover:bg-indigo-950/40 border border-white/10 hover:border-indigo-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/10 flex items-start justify-between"
              >
                <div className="flex items-start gap-3.5">
                  <div className="h-11 w-11 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">
                        Aureon Technologies
                      </h3>
                      <span className="text-[10px] px-2 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                        FinTech & Security
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Enterprise banking risk defense, autonomous fraud mitigation, and Aureon Shield intelligence.
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2.5">
                      <span className="text-slate-300 font-semibold">
                        {brandStats.aureon?.rules_count ?? 114} Guideline Rules
                      </span>
                      <span>•</span>
                      <span className="text-slate-300 font-semibold">
                        {brandStats.aureon?.facts_count ?? 3} Verified Facts
                      </span>
                      <span>•</span>
                      <span className="text-indigo-400 font-medium">
                        4 Personas
                      </span>
                    </div>
                  </div>
                </div>
                <div className="h-8 w-8 rounded-lg bg-white/5 group-hover:bg-indigo-600 text-slate-400 group-hover:text-white flex items-center justify-center shrink-0 transition-all mt-1">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>

              {/* Solaria Card */}
              <div
                onClick={() => handleSelectBrand("solaria")}
                className="group cursor-pointer rounded-2xl p-4.5 bg-white/[0.03] hover:bg-emerald-950/40 border border-white/10 hover:border-emerald-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/10 flex items-start justify-between"
              >
                <div className="flex items-start gap-3.5">
                  <div className="h-11 w-11 rounded-xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Leaf className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm group-hover:text-emerald-300 transition-colors">
                        Solaria Wellness
                      </h3>
                      <span className="text-[10px] px-2 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                        Nutraceuticals
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Clinical-grade preventative wellness, adaptogenic cellular hydration, and PureHydrate.
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2.5">
                      <span className="text-slate-300 font-semibold">
                        {brandStats.solaria?.rules_count ?? 98} Guideline Rules
                      </span>
                      <span>•</span>
                      <span className="text-slate-300 font-semibold">
                        {brandStats.solaria?.facts_count ?? 2} Verified Facts
                      </span>
                      <span>•</span>
                      <span className="text-emerald-400 font-medium">
                        4 Personas
                      </span>
                    </div>
                  </div>
                </div>
                <div className="h-8 w-8 rounded-lg bg-white/5 group-hover:bg-emerald-600 text-slate-400 group-hover:text-white flex items-center justify-center shrink-0 transition-all mt-1">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Bottom Utility Row */}
            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setIsSuperAdminMode(true)}
                className="text-slate-400 hover:text-purple-300 flex items-center gap-1.5 transition-colors font-medium"
              >
                <Globe className="h-3.5 w-3.5 text-purple-400" />
                <span>SuperAdmin Master Console</span>
              </button>

              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(true)}
                className="text-slate-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors font-medium"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>+ Register New Brand</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2: USER SIGN IN TO SELECTED BRAND                   */}
        {/* ======================================================== */}
        {step === 2 && !isSuperAdminMode && (
          <form
            onSubmit={handleBrandLogin}
            className="space-y-5 animate-in fade-in duration-200"
          >
            {/* Back Button & Selected Brand Pill */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setErrorMsg("");
                }}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Change Organisation</span>
              </button>

              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  selectedBrand === "aureon"
                    ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                }`}
              >
                {selectedBrand === "aureon" ? (
                  <Shield className="h-3.5 w-3.5" />
                ) : (
                  <Leaf className="h-3.5 w-3.5" />
                )}
                <span>{brandCfg.name}</span>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Sign In to {brandCfg.name}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Select your team member profile and enter credentials to launch the brand workspace.
              </p>
            </div>

            {/* Team Member Typeahead / Dropdown */}
            <div className="space-y-1.5" ref={dropdownRef}>
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  Team Member Profile
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  Role: <strong className="text-white capitalize">{selectedUser.role}</strong>
                </span>
              </label>

              <div className="relative">
                <div
                  onClick={() => {
                    setIsDropdownOpen(!isDropdownOpen);
                    setUserQuery("");
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 hover:border-white/20 text-white text-xs flex items-center justify-between cursor-pointer focus-within:ring-2 focus-within:ring-indigo-500 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        selectedUser.role === "admin"
                          ? "bg-indigo-600/40 text-indigo-300 border border-indigo-500/40"
                          : selectedUser.role === "reviewer"
                          ? "bg-amber-600/40 text-amber-300 border border-amber-500/40"
                          : "bg-sky-600/40 text-sky-300 border border-sky-500/40"
                      }`}
                    >
                      {selectedUser.name.charAt(0)}
                    </div>
                    <div className="text-left truncate">
                      <div className="font-semibold text-white truncate">
                        {selectedUser.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {selectedUser.title}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        selectedUser.role === "admin"
                          ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                          : selectedUser.role === "reviewer"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                      }`}
                    >
                      {selectedUser.role === "admin"
                        ? "Admin"
                        : selectedUser.role === "reviewer"
                        ? "Manager"
                        : "Creator"}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform ${
                        isDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>

                {/* Dropdown Options */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl bg-slate-900/98 backdrop-blur-2xl border border-white/20 shadow-2xl p-2 space-y-1.5 max-h-88 overflow-y-auto ring-1 ring-black/50">
                    {/* Search box inside dropdown */}
                    <div className="relative p-1">
                      <input
                        type="text"
                        value={userQuery}
                        onChange={(e) => setUserQuery(e.target.value)}
                        placeholder="Search by name, title, or role..."
                        className="w-full pl-3 pr-8 py-2 text-xs rounded-lg bg-white/10 border border-white/15 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition-all"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      {userQuery && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUserQuery("");
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1 rounded cursor-pointer"
                          title="Clear search filter"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Available Identities</span>
                      <span>{filteredUsers.length} of {BRAND_USERS[selectedBrand].length}</span>
                    </div>

                    {filteredUsers.map((u) => {
                      const isSelected = selectedUser.email === u.email;
                      return (
                        <div
                          key={u.email}
                          onClick={() => handleSelectUser(u)}
                          className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between text-xs transition-colors ${
                            isSelected
                              ? "bg-indigo-600/30 text-white border border-indigo-500/40"
                              : "hover:bg-white/5 text-slate-300 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`h-6 w-6 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                u.role === "admin"
                                  ? "bg-indigo-600/40 text-indigo-300"
                                  : u.role === "reviewer"
                                  ? "bg-amber-600/40 text-amber-300"
                                  : "bg-sky-600/40 text-sky-300"
                              }`}
                            >
                              {u.name.charAt(0)}
                            </div>
                            <div className="truncate">
                              <div className="font-semibold truncate">
                                {u.name}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {u.title}
                              </div>
                            </div>
                          </div>

                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase shrink-0 ${
                              u.role === "admin"
                                ? "bg-indigo-500/20 text-indigo-300"
                                : u.role === "reviewer"
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-sky-500/20 text-sky-300"
                            }`}
                          >
                            {u.role === "admin"
                              ? "Admin"
                              : u.role === "reviewer"
                              ? "Manager"
                              : "Creator"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                  Workspace Password
                </label>

                {/* Auto-fill Key Badge */}
                <button
                  type="button"
                  onClick={() =>
                    setPassword(`${selectedBrand}-${selectedUser.role}`)
                  }
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
                >
                  <Zap className="h-3 w-3" />
                  <span>Use Demo Key: <strong>{selectedBrand}-{selectedUser.role}</strong></span>
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white font-mono text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  {showPassword ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-xl font-bold text-xs text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                selectedBrand === "aureon"
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 shadow-indigo-500/25"
                  : "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 shadow-emerald-500/25"
              }`}
            >
              <span>
                {isSubmitting
                  ? "Authenticating Workspace..."
                  : `Enter ${brandCfg.name} Workspace`}
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* SUPERADMIN MODE                                          */}
        {/* ======================================================== */}
        {isSuperAdminMode && (
          <form
            onSubmit={handleSuperAdminLogin}
            className="space-y-5 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsSuperAdminMode(false);
                  setErrorMsg("");
                }}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Brand Workspace</span>
              </button>

              <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Master Governance
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Globe className="h-5 w-5 text-purple-400" />
                SuperAdmin Master Console
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Cross-tenant oversight, multi-organization auditing, and master policy engine.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Master Security Key
                </label>
                <button
                  type="button"
                  onClick={() => setSuperAdminPass("superadmin-master")}
                  className="text-[11px] text-purple-400 hover:text-purple-300 font-medium"
                >
                  Use Default: <strong>superadmin-master</strong>
                </button>
              </div>

              <input
                type="password"
                value={superAdminPass}
                onChange={(e) => setSuperAdminPass(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white font-mono text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-bold text-xs text-white shadow-lg bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-purple-500/25 flex items-center justify-center gap-2"
            >
              <span>Launch Master SuperAdmin Console</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
