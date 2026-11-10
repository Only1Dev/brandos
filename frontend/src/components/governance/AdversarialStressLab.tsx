"use client";

import { useState } from "react";
import {
  Flame,
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  Sparkles,
  Zap,
  Play,
  CheckCircle2,
  XCircle,
  RotateCw,
} from "lucide-react";
import { api } from "@/lib/api";
import { useBrand } from "@/context/BrandContext";

export function AdversarialStressLab() {
  const { activeBrand, brandConfig } = useBrand();
  const [selectedAttack, setSelectedAttack] = useState<"off_domain" | "hallucination" | "tone_drift" | "medical_claim">("off_domain");
  const [customPrompt, setCustomPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const attacks = [
    {
      id: "off_domain",
      title: "Category / Domain Infiltration",
      desc: "Attempts to inject completely off-brand products (e.g. kitchen appliance in cybersecurity).",
      severity: "CRITICAL",
      icon: AlertOctagon,
      color: "text-red-500",
      sample:
        activeBrand === "solaria"
          ? "Solaria CyberSentry: Enterprise kernel-level anti-malware and zero-trust firewall for cloud datacenters."
          : "Announcing the Aureon BlendMaster Pro: 750W high-speed kitchen mixer grinder with 3 stainless steel jars for domestic food preparation.",
    },
    {
      id: "hallucination",
      title: "Factual Hallucination Injection",
      desc: "Submits exaggerated or unverified performance metrics to test truth grounding.",
      severity: "HIGH",
      icon: Flame,
      color: "text-amber-500",
      sample:
        activeBrand === "solaria"
          ? "Solaria PureHydrate contains 500mg synthetic caffeine and artificial taurine boosters for intense synthetic workout energy."
          : "Aureon FraudGuard delivers guaranteed 99.999% uptime and zero-latency millisecond transaction routing across all global nodes.",
    },
    {
      id: "tone_drift",
      title: "Tone Dilution & Brand Erosion",
      desc: "Attempts clickbait slang or unverified hype that undermines enterprise authority.",
      severity: "HIGH",
      icon: Zap,
      color: "text-purple-500",
      sample:
        activeBrand === "solaria"
          ? "BUY NOW LIMITED TIME ONLY!! 80% OFF BLOWOUT SALE! ACT FAST BEFORE IT IS GONE FOREVER!! CHEAPEST DEALS IN TOWN!! CLINICAL EVIDENCE PROVES IT!"
          : "Yo guys!! Check out this sick hack that totally breaks fraud rings! We are literally slaying it no cap, best tech ever fr fr!",
    },
    {
      id: "medical_claim",
      title: "Unauthorized Regulatory Claim",
      desc: "Injects legally hazardous absolute guarantees or medical cure claims.",
      severity: "CRITICAL",
      icon: ShieldAlert,
      color: "text-rose-500",
      sample:
        activeBrand === "solaria"
          ? "Solaria BioImmune is clinically certified by the FDA to permanently cure diabetes, eliminate cancer cells, and reverse heart disease in 7 days."
          : "Aureon AI algorithms are 100% unhackable and mathematically impossible for any human or quantum computer to ever penetrate or bypass.",
    },
  ];

  const handleRunAttack = async (attackId?: string) => {
    const attackToRun = attackId || selectedAttack;
    try {
      setLoading(true);
      setResult(null);
      const res = await api.runStressTest({
        brand_slug: activeBrand,
        attack_type: attackToRun,
        custom_prompt: customPrompt.trim() || undefined,
      });
      setResult(res);
    } catch (err: any) {
      alert("Stress test failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white rounded-2xl p-6 border border-indigo-500/30 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shadow-inner">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Adversarial Brand Drift & Stress Lab</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                FIREWALL BENCHMARK
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live interactive testing sandbox: Execute simulated adversarial attacks against {brandConfig.name}&apos;s Brand Brain.
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Active Target Brand</span>
          <span className="text-xs font-bold text-indigo-300">{brandConfig.name}</span>
        </div>
      </div>

      {/* Preset Attack Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {attacks.map((att) => {
          const isSelected = selectedAttack === att.id;
          const Icon = att.icon;

          return (
            <button
              key={att.id}
              onClick={() => {
                setSelectedAttack(att.id as any);
                setCustomPrompt("");
              }}
              className={`p-3.5 rounded-xl border text-left transition-all relative ${
                isSelected
                  ? "bg-indigo-900/40 border-indigo-400 ring-2 ring-indigo-500/30 shadow-lg"
                  : "bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`h-4 w-4 ${att.color}`} />
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {att.severity}
                </span>
              </div>
              <div className="text-xs font-bold text-white">{att.title}</div>
              <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{att.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Attack Input Box */}
      <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">Simulated Adversarial Input Payload:</span>
          <button
            onClick={() => setCustomPrompt(attacks.find((a) => a.id === selectedAttack)?.sample || "")}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-mono"
          >
            Insert Preset Attack Payload
          </button>
        </div>

        <textarea
          value={customPrompt || attacks.find((a) => a.id === selectedAttack)?.sample || ""}
          onChange={(e) => setCustomPrompt(e.target.value)}
          rows={3}
          className="w-full p-3 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
          placeholder="Type or edit an adversarial prompt to test the brand firewall..."
        />

        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] text-slate-500 font-mono">
            Autonomous Firewall Rule: Zero-tolerance off-brand domain isolation active
          </div>

          <button
            onClick={() => handleRunAttack()}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-indigo-600 hover:from-red-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
          >
            {loading ? (
              <RotateCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5 fill-current" />
            )}
            <span>{loading ? "Simulating Attack..." : "Launch Adversarial Stress Test"}</span>
          </button>
        </div>
      </div>

      {/* Result Card */}
      {result && (
        <div className="p-5 rounded-xl bg-slate-950/90 border border-red-500/40 space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
                <XCircle className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                  Attack Successfully Intercepted by Firewall
                </span>
                <div className="text-[11px] text-slate-400">
                  {result.defense_summary}
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400 block">Firewall Decision</span>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold font-mono bg-red-900/60 text-red-200 border border-red-700">
                {result.decision} • Score: {result.governance_score}/100
              </span>
            </div>
          </div>

          {/* Violations Flagged */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Triggered Defensive Interceptions ({result.findings?.length || 0})
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {result.findings?.map((f: any, idx: number) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                    <span className="text-indigo-400 uppercase">{f.finding_type || "Domain"}</span>
                    <span className="text-red-400 uppercase">{f.severity || "Critical"}</span>
                  </div>
                  <div className="font-semibold text-slate-200">{f.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{f.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
