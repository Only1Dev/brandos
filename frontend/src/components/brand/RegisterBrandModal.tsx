"use client";

import React, { useState } from "react";
import { useBrand } from "@/context/BrandContext";
import { Building2, X, Sparkles, UploadCloud, CheckCircle2, ShieldAlert, ArrowRight, Lock } from "lucide-react";

export function RegisterBrandModal() {
  const { isRegisterModalOpen, setIsRegisterModalOpen } = useBrand();
  const [submitted, setSubmitted] = useState(false);

  if (!isRegisterModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Register New Brand Identity</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Future Scope • v2.0 Preview
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Multi-tenant Brand Brain synthesis engine. Instant onboarding from raw PDF guidelines.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsRegisterModalOpen(false);
              setSubmitted(false);
            }}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {submitted ? (
            <div className="py-8 text-center space-y-3">
              <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Enterprise Onboarding Requested</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                In BrandOS v2.0 Enterprise, our automated ingestion pipeline parses your raw brand guidelines PDF,
                synthesizes semantic embeddings into the Brand Brain, generates rule definitions, and configures role-based access in under 60 seconds.
              </p>
              <div className="pt-4">
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setIsRegisterModalOpen(false);
                  }}
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                >
                  Return to Active Workspaces
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-900 flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Multi-Tenant Directory Notice:</span> BrandOS is pre-configured with two operational enterprise workspaces:{' '}
                  <strong>Aureon Technologies</strong> (Cybersecurity/FinTech) and <strong>Solaria Wellness</strong> (Nutraceuticals/Clinical Hydration).
                  You can switch between them instantly in the Brand Selector.
                </div>
              </div>

              {/* Mock Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Name</label>
                    <input
                      type="text"
                      disabled
                      placeholder="e.g. Acme Robotics Inc."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Workspace Slug</label>
                    <input
                      type="text"
                      disabled
                      placeholder="acme-robotics"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Brand Domain & Core Business Identity
                  </label>
                  <input
                    type="text"
                    disabled
                    placeholder="e.g. Autonomous industrial warehouse logistics, automated guided vehicles (AGVs)"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Used by the Zero-Tolerance Governance Firewall to immediately disqualify off-brand submissions.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Brand Hex</label>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-indigo-600 border border-slate-200 shrink-0" />
                      <input
                        type="text"
                        disabled
                        value="#4F46E5"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Account</label>
                    <input
                      type="email"
                      disabled
                      placeholder="brand-officer@acme.com"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Brand Guidelines PDF (Upload for Auto-Ingestion)
                  </label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center bg-slate-50/50">
                    <UploadCloud className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <div className="text-xs font-medium text-slate-600">
                      Upload your Brand Guidelines PDF (Up to 100MB)
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Our multi-agent pipeline extracts typography, approved facts, disallowed terminology, and visual rules.
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                  Self-service tenant onboarding is coming in Enterprise v2.0
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsRegisterModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => setSubmitted(true)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    Request Early Access
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
