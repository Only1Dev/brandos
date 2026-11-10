"use client";

import { Shield, Users, Check, Lock, Database, Sliders, CheckCircle2, Server } from "lucide-react";
import { useBrand } from "@/context/BrandContext";

export default function SettingsPage() {
  const { activeBrand, brandConfig, currentRole } = useBrand();
  const isSuperAdmin = currentRole === "superadmin";

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
              <th className="py-2.5 px-3">Role</th>
              <th className="py-2.5 px-3">Submit Drafts</th>
              <th className="py-2.5 px-3">Audit Reports</th>
              <th className="py-2.5 px-3">Approve / Reject</th>
              <th className="py-2.5 px-3">Edit Brand Brain</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="py-2.5 px-3 font-bold text-slate-900">Content Creator</td>
              <td className="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
              <td className="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
              <td className="py-2.5 px-3 text-slate-300">✗ (Restricted)</td>
              <td className="py-2.5 px-3 text-slate-300">✗ (Restricted)</td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-bold text-slate-900">Brand Reviewer / Manager</td>
              <td className="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
              <td className="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
              <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ (Final Authority)</td>
              <td className="py-2.5 px-3 text-slate-300">✗ (Read-Only)</td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-bold text-slate-900">Brand Administrator</td>
              <td className="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
              <td className="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
              <td className="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
              <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ (Full Access)</td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-bold text-slate-900">Chief Governance Officer (SuperAdmin)</td>
              <td className="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
              <td className="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
              <td className="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
              <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ (Cross-Tenant)</td>
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
