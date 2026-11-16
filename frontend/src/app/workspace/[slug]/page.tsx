"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBrand, BRANDS, getBrandConfig, BrandSlug } from "@/context/BrandContext";
import { Shield, Sparkles, RotateCw, ArrowRight } from "lucide-react";

export default function WorkspaceRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const { setActiveBrand, brandConfig } = useBrand();
  const [mounted, setMounted] = useState(false);

  const rawSlug = (params?.slug as string) || "aureon";
  const slug = rawSlug.toLowerCase().trim();
  const brandInfo = getBrandConfig(slug);

  useEffect(() => {
    setMounted(true);
    // Smoothly alias workspace to brand and save preference
    try {
      localStorage.setItem("brandos_active_brand", slug);
      if (setActiveBrand) {
        setActiveBrand(slug as BrandSlug);
      }
    } catch (e) {
      console.warn("Workspace alias storage warning:", e);
    }

    // Gracefully redirect to dashboard with smooth handoff
    const timer = setTimeout(() => {
      router.replace("/dashboard");
    }, 450);

    return () => clearTimeout(timer);
  }, [slug, setActiveBrand, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-purple-600/20 rounded-full blur-[110px] pointer-events-none" />

      <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900/90 border border-indigo-500/30 shadow-2xl backdrop-blur-xl text-center space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-300">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-xl shadow-indigo-500/25 flex items-center justify-center">
          <div className="h-full w-full rounded-[14px] bg-slate-950 flex items-center justify-center">
            <Shield className="h-8 w-8 text-indigo-400 animate-pulse" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>WORKSPACE ROUTE DETECTED</span>
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">
            Switching to {brandInfo.name}
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Mounting active Brand Brain, approved facts, terminology rules, and zero-tolerance firewall parameters...
          </p>
        </div>

        {/* Animated Progress Track */}
        <div className="space-y-2">
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 h-1.5 rounded-full animate-[shimmer_1.5s_infinite] w-full" />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Alias: /workspace/{slug}</span>
            <span className="flex items-center gap-1 text-indigo-400">
              <RotateCw className="h-3 w-3 animate-spin" />
              <span>Redirecting...</span>
            </span>
          </div>
        </div>

        <button
          onClick={() => router.replace("/dashboard")}
          className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>Open Dashboard Now</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
