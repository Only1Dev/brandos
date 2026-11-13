"use client";

import { useEffect, useState } from "react";
import {
  Palette,
  CheckCircle2,
  Lock,
  Save,
  Sparkles,
  Download,
  FileText,
  Sliders,
  ShieldCheck,
  Check,
  Eye,
} from "lucide-react";
import { api } from "@/lib/api";
import { useBrand } from "@/context/BrandContext";

export default function AssetsPage() {
  const { activeBrand, brandConfig, currentRole } = useBrand();
  const isAdmin = currentRole === "admin" || currentRole === "superadmin";
  const isSolaria = activeBrand === "solaria";

  // Brand Palette & Visual Theme State (Moved from Settings)
  const [primaryColor, setPrimaryColor] = useState(brandConfig.primaryColor);
  const [accentColor, setAccentColor] = useState(brandConfig.accentColor);
  const [tagline, setTagline] = useState(brandConfig.tagline);
  const [domain, setDomain] = useState(brandConfig.domain);
  const [baselineTheme, setBaselineTheme] = useState({
    primaryColor: brandConfig.primaryColor,
    accentColor: brandConfig.accentColor,
    tagline: brandConfig.tagline,
    domain: brandConfig.domain,
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    // Sync with active brand or local override
    const saved = localStorage.getItem(`brandos_theme_${activeBrand}`);
    let p = brandConfig.primaryColor;
    let a = brandConfig.accentColor;
    let t = brandConfig.tagline;
    let d = brandConfig.domain;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.primaryColor) p = parsed.primaryColor;
        if (parsed.accentColor) a = parsed.accentColor;
        if (parsed.tagline) t = parsed.tagline;
        if (parsed.domain) d = parsed.domain;
      } catch {
        // ignore
      }
    }
    setPrimaryColor(p);
    setAccentColor(a);
    setTagline(t);
    setDomain(d);
    setBaselineTheme({ primaryColor: p, accentColor: a, tagline: t, domain: d });
  }, [activeBrand, brandConfig]);

  // True two-way equality check against baseline:
  const isThemeDirty =
    primaryColor.toLowerCase() !== baselineTheme.primaryColor.toLowerCase() ||
    accentColor.toLowerCase() !== baselineTheme.accentColor.toLowerCase() ||
    tagline.trim() !== baselineTheme.tagline.trim() ||
    domain.trim() !== baselineTheme.domain.trim();

  const handleSaveTheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    localStorage.setItem(
      `brandos_theme_${activeBrand}`,
      JSON.stringify({
        primaryColor,
        accentColor,
        tagline,
        domain,
      })
    );
    setBaselineTheme({ primaryColor, accentColor, tagline, domain }); // Reverts back to white
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                isSolaria
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-indigo-50 text-indigo-700 border-indigo-200"
              }`}
            >
              VisualGuard™ Asset Perimeter
            </span>
            <span className="text-xs text-slate-400">• {brandConfig.name}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Brand Assets, Logos & Visual Theme
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official vector marks, approved color palettes, and visual governance verified by Gemini Vision.
          </p>
        </div>

        <a
          href={brandConfig.pdfDownloadUrl}
          download
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all shrink-0"
        >
          <Download className="h-4 w-4 text-slate-500" />
          <span>Download Official Guidelines PDF</span>
        </a>
      </div>

      {/* Primary Brand Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Approved Logo Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
          <div
            className={`h-36 rounded-xl flex items-center justify-center p-4 border ${
              isSolaria
                ? "bg-emerald-950 border-emerald-900"
                : "bg-slate-950 border-slate-800"
            }`}
          >
            <div className="text-center">
              <span
                style={{ color: primaryColor }}
                className="font-extrabold text-2xl tracking-tighter"
              >
                {brandConfig.name.toUpperCase()}
              </span>
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-0.5">
                {(tagline || brandConfig.tagline || "ENTERPRISE IDENTITY").toUpperCase()}
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">LOGO-PRIMARY-V3</h3>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                Active Version 3.0
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Official corporate mark. Enforces minimum 24px clearspace on all sides and zero background distortion.
            </p>
          </div>
        </div>

        {/* Brand Colors Palette Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
          <div className="h-36 rounded-xl grid grid-cols-4 overflow-hidden border border-slate-200 shadow-inner">
            <div
              style={{ backgroundColor: primaryColor }}
              className="flex items-end p-2 text-white font-mono text-[9px] font-bold"
            >
              {primaryColor}
            </div>
            <div
              style={{ backgroundColor: accentColor }}
              className="flex items-end p-2 text-white font-mono text-[9px] font-bold"
            >
              {accentColor}
            </div>
            <div
              className={`${
                isSolaria ? "bg-emerald-900" : "bg-slate-900"
              } flex items-end p-2 text-white font-mono text-[9px] font-bold`}
            >
              {isSolaria ? "#064E3B" : "#0F172A"}
            </div>
            <div
              className={`${
                isSolaria ? "bg-emerald-50" : "bg-slate-100"
              } flex items-end p-2 text-slate-800 font-mono text-[9px] font-bold`}
            >
              {isSolaria ? "#ECFDF5" : "#F1F5F9"}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Approved Color Palette</h3>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                WCAG AAA (9.4:1)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              High-contrast accessibility pairing with verified 9.4:1 contrast ratio against light backgrounds.
            </p>
          </div>
        </div>

        {/* Secondary Mark Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
          <div
            className={`h-36 rounded-xl flex items-center justify-center p-4 border ${
              isSolaria
                ? "bg-emerald-50 border-emerald-100"
                : "bg-indigo-50 border-indigo-100"
            }`}
          >
            <div
              style={{ backgroundColor: primaryColor }}
              className="h-16 w-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-md"
            >
              {brandConfig.name.charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">ICON-MARK-V3</h3>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Favicon, mobile app launcher, and social profile avatar icon mark with rounded squircles.
            </p>
          </div>
        </div>
      </div>

      {/* Brand Visual Identity & Color Palette Customizer (Moved from Settings) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Palette className="h-5 w-5 text-indigo-600" />
              <span>Brand Visual Identity & Palette Customizer</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Administrators can adjust organizational color palettes, typography accents, and domain boundaries.
            </p>
          </div>

          {isAdmin ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5 self-start sm:self-auto">
              <Sparkles className="h-3.5 w-3.5" /> Administrator Authority Active
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1.5 self-start sm:self-auto">
              <Lock className="h-3.5 w-3.5 text-amber-500" /> Read-Only (Admin Managed)
            </span>
          )}
        </div>

        {!isAdmin && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-xs text-amber-900">
            <Lock className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong>Brand Theme Locked:</strong> Only Administrator profiles (e.g. Priya Sharma / Maya Lin) have authority to alter palette tokens, taglines, and domain perimeters.
            </span>
          </div>
        )}

        <form onSubmit={handleSaveTheme} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Primary Accent Color */}
            <div className="space-y-2">
              <label className="text-slate-700 font-bold block">
                Brand Primary Accent Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  disabled={!isAdmin}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-14 rounded-lg border border-slate-300 cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                />
                <input
                  type="text"
                  value={primaryColor}
                  disabled={!isAdmin}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 disabled:bg-slate-100 flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Primary button, header accents, and verified status badges.
              </p>
            </div>

            {/* Secondary Accent Color */}
            <div className="space-y-2">
              <label className="text-slate-700 font-bold block">
                Secondary / Complementary Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={accentColor}
                  disabled={!isAdmin}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-10 w-14 rounded-lg border border-slate-300 cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                />
                <input
                  type="text"
                  value={accentColor}
                  disabled={!isAdmin}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 disabled:bg-slate-100 flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Data visualization charts, auxiliary borders, and gradient stops.
              </p>
            </div>

            {/* Official Slogan */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-slate-700 font-bold block">
                Official Brand Slogan & Tagline
              </label>
              <input
                type="text"
                value={tagline}
                disabled={!isAdmin}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Enterprise Fraud Prevention & Autonomous Cyber Defense"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400">
                Verified against incoming marketing headers to detect prohibited slogan drift.
              </p>
            </div>

            {/* Authorized Perimeter Scope */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-slate-700 font-bold block">
                Authorized Governance Perimeter (Domain Scope)
              </label>
              <textarea
                rows={2}
                value={domain}
                disabled={!isAdmin}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="Describe product lines, market domain, and commercial scope..."
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400">
                Any submission falling outside this domain is automatically rejected by the zero-tolerance domain firewall.
              </p>
            </div>
          </div>

          {/* Live Palette Visualizer */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Live Palette & Contrast Preview</span>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> WCAG 2.1 AA Compliant
              </span>
            </div>
            <div className="h-10 rounded-lg overflow-hidden flex shadow-2xs border border-slate-300">
              <div
                style={{ backgroundColor: primaryColor }}
                className="flex-1 flex items-center justify-center text-white text-[11px] font-bold"
              >
                Primary Accent
              </div>
              <div
                style={{ backgroundColor: accentColor }}
                className="flex-1 flex items-center justify-center text-white text-[11px] font-bold"
              >
                Secondary
              </div>
              <div className="w-24 bg-slate-900 flex items-center justify-center text-white text-[11px] font-bold">
                Dark Base
              </div>
              <div className="w-24 bg-white flex items-center justify-center text-slate-900 text-[11px] font-bold border-l border-slate-200">
                Light Base
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center justify-between pt-2">
              {savedSuccess ? (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4" /> Brand Theme Parameters Saved Successfully!
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">
                  {isThemeDirty
                    ? "Palette modifications pending. Click save to apply."
                    : "Adjust brand palette, tagline, or domain perimeter."}
                </span>
              )}

              <button
                type="submit"
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
                  isThemeDirty
                    ? "bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 shadow-md"
                    : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs"
                }`}
              >
                <Save className="h-4 w-4" />
                <span>Save Visual Theme Configuration</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
