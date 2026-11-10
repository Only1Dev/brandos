"use client";

import { useEffect, useState } from "react";
import { Plus, Palette, Image as ImageIcon, CheckCircle2, Shield } from "lucide-react";
import { api } from "@/lib/api";

export default function AssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getAssets();
        setAssets(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Brand Assets & Logos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Official logos, approved color palettes, and visual imagery verified by the Visual Agent.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Approved Logo Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="h-32 bg-slate-950 rounded-lg flex items-center justify-center p-4 border border-slate-800">
            <div className="text-center">
              <span className="text-indigo-400 font-extrabold text-2xl tracking-tighter">AUREON</span>
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-0.5">SHIELD INTELLIGENCE</span>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">LOGO-PRIMARY-V3</h3>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                Active Version 3.0
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Official primary corporate logo. Requires minimum 24px clearspace on all sides.
            </p>
          </div>
        </div>

        {/* Brand Colors Palette Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="h-32 rounded-lg grid grid-cols-4 overflow-hidden border border-slate-200">
            <div className="bg-indigo-600 flex items-end p-2 text-white font-mono text-[10px] font-bold">#4F46E5</div>
            <div className="bg-slate-900 flex items-end p-2 text-white font-mono text-[10px] font-bold">#0F172A</div>
            <div className="bg-emerald-500 flex items-end p-2 text-white font-mono text-[10px] font-bold">#10B981</div>
            <div className="bg-slate-100 flex items-end p-2 text-slate-900 font-mono text-[10px] font-bold">#F1F5F9</div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Approved Brand Colors</h3>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                WCAG Compliant
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Primary Indigo (#4F46E5) paired with Slate-900 provides 9.4:1 contrast ratio (AAA rated).
            </p>
          </div>
        </div>

        {/* Secondary Mark Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="h-32 bg-indigo-50 rounded-lg flex items-center justify-center p-4 border border-indigo-100">
            <div className="h-16 w-16 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg">
              A
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">ICON-MARK-V3</h3>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Favicon and social profile avatar icon mark.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
