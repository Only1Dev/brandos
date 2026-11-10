"use client";

import { useState } from "react";
import { Shield, Users, Check, Lock, Database, Sliders, CheckCircle2, Server, Palette, Save, Sparkles } from "lucide-react";
import { useBrand } from "@/context/BrandContext";

export default function SettingsPage() {
  const { activeBrand, brandConfig, currentRole } = useBrand();
  const isSuperAdmin = currentRole === "superadmin";
  const isAdmin = currentRole === "admin" || isSuperAdmin;

  // Theme settings state
  const [primaryColor, setPrimaryColor] = useState(brandConfig.primaryColor);
  const [accentColor, setAccentColor] = useState(brandConfig.accentColor);
  const [tagline, setTagline] = useState(brandConfig.tagline);
  const [domain, setDomain] = useState(brandConfig.domain);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveTheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    localStorage.setItem(`brandos_theme_${activeBrand}`, JSON.stringify({
      primaryColor,
      accentColor,
      tagline,
      domain,
    }));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Platform Governance & Security Configuration
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Enterprise tenant parameters, automated firewall constraints, and role-based access governance.
        </p>
      </div>

      {/* Organization Workspace Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Shield className="h-4 w-4 text-indigo-600" />
          <span>Active Workspace Parameters</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-500 font-medium">Workspace Entity</label>
            <div className="font-bold text-slate-900 mt-1">
              {isSuperAdmin ? "Global Multi-Tenant Directory" : brandConfig.name}
            </div>
          </div>
          <div>
            <label className="text-slate-500 font-medium">Tenant Slug Identifier</label>
            <div className="font-mono text-slate-700 mt-1">
              {isSuperAdmin ? "system-superadmin" : brandConfig.slug}
            </div>
          </div>
          <div>
            <label className="text-slate-500 font-medium">Tenant Isolation Architecture</label>
            <div className="text-emerald-700 font-semibold mt-1 flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> PostgreSQL Row-Level Security (RLS) Active
            </div>
          </div>
          <div>
            <label className="text-slate-500 font-medium">Governance Engine Release</label>
            <div className="font-mono text-slate-700 mt-1">BrandOS Core Engine v2.4 (Enterprise)</div>
          </div>
        </div>
      </div>

      {/* Company Brand Theme & Visual Identity Card (Admin Only) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Palette className="h-4 w-4 text-indigo-600" />
            <span>Company Brand Theme & Visual Governance</span>
          </h2>
          {isAdmin ? (
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Administrator Authority Active
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
              <Lock className="h-3 w-3 text-amber-500" /> Administrator Only (Read-Only)
            </span>
          )}
        </div>

        {!isAdmin && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-900">
            <Lock className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong>Company Theme Restricted:</strong> Only Administrator profiles (e.g. Priya Sharma / Maya Lin) have permission to alter workspace colors, domains, and core brand theme assets. Managers and Creators have view-only access.
            </span>
          </div>
        )}

        <form onSubmit={handleSaveTheme} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-600 font-semibold block mb-1">Brand Primary Accent Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  disabled={!isAdmin}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-8 w-12 rounded border border-slate-300 cursor-pointer disabled:cursor-not-allowed"
                />
                <input
                  type="text"
                  value={primaryColor}
                  disabled={!isAdmin}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 disabled:bg-slate-100 flex-1"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-600 font-semibold block mb-1">Secondary / Complementary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  disabled={!isAdmin}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-8 w-12 rounded border border-slate-300 cursor-pointer disabled:cursor-not-allowed"
                />
                <input
                  type="text"
                  value={accentColor}
                  disabled={!isAdmin}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 disabled:bg-slate-100 flex-1"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-slate-600 font-semibold block mb-1">Official Brand Slogan & Tagline</label>
              <input
                type="text"
                value={tagline}
                disabled={!isAdmin}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 disabled:bg-slate-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-slate-600 font-semibold block mb-1">Authorized Governance Perimeter (Domain Scope)</label>
              <textarea
                rows={2}
                value={domain}
                disabled={!isAdmin}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 disabled:bg-slate-100"
              />
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center justify-between pt-2">
              {savedSuccess ? (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4" /> Company Theme Parameters Saved Successfully
                </span>
              ) : <div />}

              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Theme Configuration</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Automated Governance Policies */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Sliders className="h-4 w-4 text-indigo-600" />
          <span>Automated Pre-Publication Firewall Policies</span>
        </h2>
        <p className="text-xs text-slate-500">
          Enforced across all incoming text, visual creatives, and marketing campaigns prior to distribution.
        </p>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800">Domain Alignment Firewall</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Zero-tolerance evaluation against brand identity. Out-of-domain submissions are automatically disqualified.
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 rounded-lg text-[11px]">
              Enforced (Score 0/100 Block)
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800">TruthMark™ Fact Verification Engine</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Ground-truth comparison against verified organizational specifications, metrics, and pricing.
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 rounded-lg text-[11px]">
              Active (RAG Grounded)
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800">VisualGuard™ Asset Compliance</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Multi-point inspection of official logos, primary color palettes, typography, and contrast standards.
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 rounded-lg text-[11px]">
              Active (Computer Vision)
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800">Devil&apos;s Advocate Adversarial Engine</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Secondary adversarial validation pass to prevent false positives and audit borderline claims.
              </div>
            </div>
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 rounded-lg text-[11px]">
              Calibrated
            </span>
          </div>
        </div>
      </div>

      {/* Role-Based Access Control Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Users className="h-4 w-4 text-indigo-600" />
          <span>Role-Based Access Governance Matrix</span>
        </h2>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3">Role & Profile Scope</th>
              <th className="py-2.5 px-3">Submit Drafts</th>
              <th className="py-2.5 px-3">Audit Scope</th>
              <th className="py-2.5 px-3">Approve / Directives</th>
              <th className="py-2.5 px-3">Set Theme & Brand Brain</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="py-2.5 px-3 font-bold text-slate-900">
                <div>Content Creators (Creator 1 &amp; Creator 2)</div>
                <div className="text-[10px] text-slate-400 font-normal">Aarav Patel, Riya Sen / Marcus Brody, Sophia Lin</div>
              </td>
              <td className="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
              <td className="py-2.5 px-3 text-indigo-700 font-bold">Own Submissions Only</td>
              <td className="py-2.5 px-3 text-slate-400">✗ (Restricted)</td>
              <td className="py-2.5 px-3 text-slate-400">✗ (Restricted)</td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-bold text-slate-900">
                <div>Brand Reviewer &amp; Content Manager</div>
                <div className="text-[10px] text-slate-400 font-normal">David Chen / Marcus Vance</div>
              </td>
              <td className="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
              <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ All Workspace Reviews</td>
              <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ Approve, Reject &amp; Directives</td>
              <td className="py-2.5 px-3 text-slate-400 font-medium">✗ (Read-Only)</td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-bold text-slate-900">
                <div>Brand Administrator</div>
                <div className="text-[10px] text-slate-400 font-normal">Priya Sharma / Maya Lin</div>
              </td>
              <td className="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
              <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ All Workspace Reviews</td>
              <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ Full Authority</td>
              <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ Full Control (Theme, Rules, Facts)</td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-bold text-slate-900">
                <div>Chief Governance Officer (SuperAdmin)</div>
                <div className="text-[10px] text-slate-400 font-normal">Global Master Console</div>
              </td>
              <td className="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
              <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ Cross-Tenant Directory</td>
              <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ Global Override</td>
              <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ Global Configuration</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Enterprise Security SLA Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Server className="h-4 w-4 text-indigo-600" />
          <span>Enterprise Security & Data Isolation Guarantees</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="font-bold text-slate-800 mb-1">Zero Data Retention Policy</div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Inference pipelines process content ephemerally. Customer copy, design files, and proprietary guidelines are never stored externally or used for model training.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="font-bold text-slate-800 mb-1">Immutable Audit Trail Logging</div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Every compliance finding, human approval, suggestion acceptance, and override justification is logged into a tamper-evident audit ledger with 365-day retention.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
