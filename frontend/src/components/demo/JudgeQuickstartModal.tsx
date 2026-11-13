"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  X,
  Play,
  Shield,
  ShieldAlert,
  Database,
  Lock,
  ArrowRight,
  ExternalLink,
  Users,
  CheckCircle2,
  FileText,
  Video,
  Layers,
  Flame,
  Globe,
  Award,
  ChevronRight,
  Zap,
} from "lucide-react";
import { useBrand, BRAND_USERS, BrandSlug, UserProfile } from "@/context/BrandContext";

export function JudgeQuickstartModal() {
  const router = useRouter();
  const {
    activeBrand,
    brandConfig,
    currentRole,
    currentUser,
    switchBrand,
    switchUser,
    isJudgeModalOpen,
    setIsJudgeModalOpen,
  } = useBrand();

  const [activeTab, setActiveTab] = useState<"scenarios" | "personas" | "proofpoints">("scenarios");

  if (!isJudgeModalOpen) return null;

  const isSolaria = activeBrand === "solaria";

  const handleLaunchScenario = (route: string, targetBrand?: BrandSlug, targetUser?: UserProfile) => {
    if (targetBrand && targetBrand !== activeBrand) {
      switchBrand(targetBrand);
    }
    if (targetUser) {
      switchUser(targetUser);
    }
    setIsJudgeModalOpen(false);
    router.push(route);
  };

  const handleSwitchPersona = (user: UserProfile, brand: BrandSlug) => {
    if (brand !== activeBrand) {
      switchBrand(brand);
    }
    switchUser(user);
    setIsJudgeModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-900 animate-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-7 text-white flex items-start justify-between border-b border-indigo-900/50 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-500 p-0.5 shadow-lg shadow-amber-500/20 shrink-0">
              <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight">
                  Judge &amp; Evaluator Quickstart Hub
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  Top-50 Live Evaluation
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                One-click test fixtures, zero-friction persona switching, and verified proof-points for hackathon evaluation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block px-2 py-1 rounded bg-slate-800 text-[11px] font-mono text-slate-400 border border-slate-700">
              Shortcut: <strong>J</strong>
            </span>
            <button
              type="button"
              onClick={() => setIsJudgeModalOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Judge Hub (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="px-6 sm:px-8 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 shrink-0 overflow-x-auto">
          {[
            { id: "scenarios", label: "🚀 1-Click Test Scenarios" },
            { id: "personas", label: "👥 RBAC Persona Switcher" },
            { id: "proofpoints", label: "📋 Architecture & Proof Points" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: 1-CLICK TEST SCENARIOS */}
          {activeTab === "scenarios" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Live Evaluation Test Scenarios
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click any test card to load the fixture into the Pre-Publication Firewall in seconds.
                  </p>
                </div>
                <span className="text-xs text-indigo-600 font-bold hidden sm:inline">
                  5 Scenarios Available
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Scenario 1: Video & Audio Audit */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between space-y-3 group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                        <Video className="h-3 w-3" />
                        Multimodal Video &amp; Voice
                      </span>
                      <span className="text-[11px] font-bold text-indigo-600 group-hover:underline">
                        Test Video ↗
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Video Commercial &amp; Spoken Dialogue Audit
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Evaluates video keyframe visual clearspace, approved color palettes, and speech audio dialogue for ungrounded claims.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLaunchScenario("/reviews/new?fixture=video", "aureon")}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    <span>Run Video Script Scenario</span>
                  </button>
                </div>

                {/* Scenario 2: Zero-Tolerance DLP */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all flex flex-col justify-between space-y-3 group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Data Loss Prevention (DLP)
                      </span>
                      <span className="text-[11px] font-bold text-purple-600 group-hover:underline">
                        Test DLP ↗
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Confidential Leakage &amp; Secret Key Defense
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Submits an internal memo with NDA markers, private staging URLs, and exposed API keys (`sk_live_...`). Firewall triggers immediate critical block.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLaunchScenario("/reviews/new?fixture=dlp", "aureon")}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Lock className="h-3 w-3" />
                    <span>Run DLP Confidential Breach Test</span>
                  </button>
                </div>

                {/* Scenario 3: Fact Grounding & Discrepancy */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between space-y-3 group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        TruthMark™ Fact Grounding
                      </span>
                      <span className="text-[11px] font-bold text-amber-600 group-hover:underline">
                        Test Grounding ↗
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Numerical Discrepancy &amp; Superlatives
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Asserts "73% fraud reduction", "100% unbreakable guarantee", and "#1 in market". Cross-referenced against Brand Brain 42% benchmark.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLaunchScenario("/reviews/new?fixture=discrepancy", "aureon")}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Database className="h-3 w-3" />
                    <span>Run Fact Discrepancy Test</span>
                  </button>
                </div>

                {/* Scenario 4: Cross-Tenant Multi-Brand Isolation */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-rose-400 hover:shadow-md transition-all flex flex-col justify-between space-y-3 group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                        <Flame className="h-3 w-3" />
                        Cross-Tenant Isolation
                      </span>
                      <span className="text-[11px] font-bold text-rose-600 group-hover:underline">
                        Test Isolation ↗
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Multi-Tenant Domain Perimeter Bleeding
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Submits Solaria Wellness hydration copy to Aureon Cyber Defense. Firewall flags critical Domain Misalignment and rejects with score 0/100.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLaunchScenario("/reviews/new?fixture=crossbrand", "aureon")}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Flame className="h-3 w-3" />
                    <span>Run Cross-Brand Misalignment Test</span>
                  </button>
                </div>

                {/* Scenario 5: High-Score Approved Pass */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between space-y-3 group md:col-span-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Certified Clearance
                        </span>
                        <span className="text-xs text-slate-400 font-semibold">• 100/100 Benchmark Pass</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Compliant Brand Copy &amp; Ground-Truth Verification
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Submits copy perfectly grounded in Brand Brain facts (audited 42% reduction, sub-12ms decision response). Passes all 5 compliance axes.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleLaunchScenario("/reviews/new?fixture=compliant", activeBrand)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Run Compliant 100/100 Test</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RBAC PERSONA SWITCHER */}
          {activeTab === "personas" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Role-Based Access Control (RBAC) Switcher
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click any persona to instantly assume their permissions and test organizational boundaries.
                  </p>
                </div>
                <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  Active: {currentUser.name} ({currentRole.toUpperCase()})
                </span>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Aureon Technologies (Cybersecurity &amp; FinTech)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {BRAND_USERS.aureon.map((u) => {
                    const isCurrent = activeBrand === "aureon" && currentUser.email === u.email;
                    return (
                      <div
                        key={u.email}
                        onClick={() => handleSwitchPersona(u, "aureon")}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                          isCurrent
                            ? "bg-indigo-50/80 border-indigo-400 shadow-xs ring-2 ring-indigo-500/20"
                            : "bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                u.role === "admin"
                                  ? "bg-indigo-100 text-indigo-800"
                                  : u.role === "reviewer"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-sky-100 text-sky-800"
                              }`}
                            >
                              {u.role}
                            </span>
                            {isCurrent && (
                              <span className="h-2 w-2 rounded-full bg-emerald-500" title="Active user" />
                            )}
                          </div>
                          <div className="font-bold text-xs text-slate-900 mt-2">{u.name}</div>
                          <div className="text-[11px] text-slate-500 leading-snug mt-0.5">{u.title}</div>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-100 truncate">
                          {u.email}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Solaria Wellness (Nutraceuticals &amp; Cellular Hydration)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {BRAND_USERS.solaria.map((u) => {
                    const isCurrent = activeBrand === "solaria" && currentUser.email === u.email;
                    return (
                      <div
                        key={u.email}
                        onClick={() => handleSwitchPersona(u, "solaria")}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                          isCurrent
                            ? "bg-emerald-50/80 border-emerald-400 shadow-xs ring-2 ring-emerald-500/20"
                            : "bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50/50"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                u.role === "admin"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : u.role === "reviewer"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-sky-100 text-sky-800"
                              }`}
                            >
                              {u.role}
                            </span>
                            {isCurrent && (
                              <span className="h-2 w-2 rounded-full bg-emerald-500" title="Active user" />
                            )}
                          </div>
                          <div className="font-bold text-xs text-slate-900 mt-2">{u.name}</div>
                          <div className="text-[11px] text-slate-500 leading-snug mt-0.5">{u.title}</div>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-100 truncate">
                          {u.email}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleLaunchScenario("/superadmin")}
                  className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex items-center justify-between hover:from-purple-800 hover:to-indigo-800 transition-colors shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-purple-300" />
                    <div className="text-left">
                      <div className="text-xs font-bold">Launch Superadmin Master Console</div>
                      <div className="text-[11px] text-purple-200">
                        Cross-tenant global overview, guideline re-ingestion, and tenant statistics
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-purple-300" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PROOF POINTS & ARCHITECTURE */}
          {activeTab === "proofpoints" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Enterprise Proof-Points &amp; Judging Criteria Matrix
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    How BrandOS addresses each core dimension of enterprise brand governance.
                  </p>
                </div>
                <span className="text-xs font-bold text-indigo-600">Zero Hallucinations</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span>Deterministic + Multimodal Vision SLA</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Combines deterministic regex/DLP pattern rules (0.1s latency) with specialized Groq LLM and Google Gemini Vision/Video models. Inspects full video keyframes and audio speech in ~15-20s.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Database className="h-4 w-4 text-indigo-600" />
                    <span>Topic-Isolated TruthMark™ Ledger</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Prevents false-positive contradictions between unrelated statistics. Claims are cross-referenced exclusively against facts sharing verified entity/topic keywords.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span>Instant AI Auto-Remediation Studio</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Does not just flag errors — automatically generates a mathematically remediated version with side-by-side diff that passes all policies with a predicted 100/100 score.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Shield className="h-4 w-4 text-emerald-600" />
                    <span>Enterprise RBAC &amp; Immutable Audit Trail</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Strict role separation (Admin vs. Reviewer vs. Creator). Every approval, override, and directive is permanently logged with actor credentials in the tamper-proof ledger.
                  </p>
                </div>
              </div>

              {/* PDF Download Section */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  <div>
                    <div className="text-xs font-bold text-indigo-950">
                      Official Brand Guidelines Reference PDFs
                    </div>
                    <div className="text-[11px] text-indigo-800">
                      View the source ground truth documents ingested into the Brand Brain.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="/Aureon_Official_Brand_Guidelines_2026.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    Aureon PDF ↗
                  </a>
                  <a
                    href="/Solaria_Wellness_Official_Brand_Guidelines_2026.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    Solaria PDF ↗
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>BrandOS Production Firewall: <strong>Active &amp; Connected</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsJudgeModalOpen(false);
                window.dispatchEvent(new CustomEvent("brandos:open-tour"));
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition-colors cursor-pointer"
            >
              Start 5-Step Tour
            </button>
            <button
              type="button"
              onClick={() => setIsJudgeModalOpen(false)}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer"
            >
              Close Hub
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
