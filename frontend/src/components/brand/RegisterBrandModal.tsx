"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useBrand, BrandSlug } from "@/context/BrandContext";
import { api } from "@/lib/api";
import {
  Building2,
  X,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  Palette,
} from "lucide-react";

export function RegisterBrandModal() {
  const router = useRouter();
  const { isRegisterModalOpen, setIsRegisterModalOpen, switchBrand } = useBrand();

  const [brandName, setBrandName] = useState("");
  const [slug, setSlug] = useState("");
  const [domain, setDomain] = useState("");
  const [tagline, setTagline] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#6366F1");
  const [adminEmail, setAdminEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [createdOrg, setCreatedOrg] = useState<{
    id: string;
    name: string;
    slug: string;
    description?: string;
  } | null>(null);

  if (!isRegisterModalOpen) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBrandName(val);
    const generated = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setSlug(generated);
    if (!adminEmail || adminEmail.includes("@")) {
      setAdminEmail(`admin@${generated || "brand"}.internal`);
    }
  };

  const handleReset = () => {
    setBrandName("");
    setSlug("");
    setDomain("");
    setTagline("");
    setPrimaryColor("#6366F1");
    setAdminEmail("");
    setErrorMsg("");
    setCreatedOrg(null);
    setIsRegisterModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!brandName.trim()) {
      setErrorMsg("Please provide an enterprise brand name.");
      return;
    }

    if (!domain.trim()) {
      setErrorMsg("Please describe the brand's authorized domain & core business identity.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.createOrganization({
        name: brandName.trim(),
        slug: slug.trim() || undefined,
        domain: domain.trim(),
        description: domain.trim(),
        primary_color: primaryColor,
      });

      // Persist theme to localStorage for live multi-tenant styling
      if (res?.slug) {
        localStorage.setItem(
          `brandos_theme_${res.slug}`,
          JSON.stringify({
            name: brandName.trim(),
            primaryColor,
            accentColor: "#38BDF8",
            tagline: tagline.trim() || "Enterprise Autonomous Governance",
            domain: domain.trim(),
          })
        );
        try {
          const raw = localStorage.getItem("brandos_custom_registered_orgs");
          const orgList = raw ? JSON.parse(raw) : [];
          if (!orgList.some((o: any) => o.slug === res.slug)) {
            orgList.push({
              id: res.id,
              name: brandName.trim(),
              slug: res.slug,
              description: domain.trim(),
              created_at: new Date().toISOString(),
            });
            localStorage.setItem("brandos_custom_registered_orgs", JSON.stringify(orgList));
          }
        } catch {}
      }

      setCreatedOrg(res);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to register brand organization");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLaunchNewWorkspace = () => {
    if (!createdOrg?.slug) return;
    const newSlug = createdOrg.slug as BrandSlug;
    handleReset();
    switchBrand(newSlug, "admin");
    router.push("/dashboard");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-7 text-white flex items-start justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                  Onboard New Enterprise Brand
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                  Multi-Tenant Studio
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-md">
                Configure tenant boundaries, brand colors, and seed automated Brand Brain guidelines in seconds.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-xl hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {createdOrg ? (
            /* Success State */
            <div className="py-6 text-center space-y-4 animate-in fade-in">
              <div className="h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {createdOrg.name} Successfully Activated!
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                  Tenant workspace <strong>{createdOrg.slug}</strong> is provisioned with active Brand Brain guidelines, domain perimeter enforcement, and default admin credentials.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-left max-w-md mx-auto space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Workspace Slug:</span>
                  <strong className="text-slate-900">{createdOrg.slug}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Admin Identity:</span>
                  <strong className="text-slate-900">admin@{createdOrg.slug}.internal</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Governance Status:</span>
                  <span className="text-emerald-700 font-bold">Firewall Active (3 Rules Seeded)</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Return to Console
                </button>
                <button
                  type="button"
                  onClick={handleLaunchNewWorkspace}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Enter {createdOrg.name} Workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Active Registration Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Brand Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={handleNameChange}
                    placeholder="e.g. Acme Robotics Inc."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Workspace Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ""))}
                    placeholder="acme-robotics"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Brand Domain &amp; Authorized Business Perimeter <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g. Autonomous industrial warehouse logistics, automated guided vehicles (AGVs), and smart factory fulfillment robotics."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  The Zero-Tolerance Pre-Publication Firewall cross-references this domain to block off-brand submissions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Primary Brand Color Hex
                  </label>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-9 w-12 rounded-lg border border-slate-300 cursor-pointer shadow-2xs"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Administrator Email
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@brand.internal"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>3 Default Brand Brain Rules Seeded Automatically</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <RotateCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Provisioning Tenant...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 text-indigo-200" />
                        <span>Activate Brand Workspace</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
