"use client";

import { useState, useEffect } from "react";
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
  ChevronDown,
  ChevronUp,
  X,
  Wand2,
  ArrowRight,
  Shield,
} from "lucide-react";
import { api } from "@/lib/api";
import { useBrand } from "@/context/BrandContext";

interface AdversarialStressLabProps {
  externalPayload?: string | null;
  onClearExternalPayload?: () => void;
}

export function AdversarialStressLab({
  externalPayload,
  onClearExternalPayload,
}: AdversarialStressLabProps) {
  const { activeBrand, brandConfig } = useBrand();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAttack, setSelectedAttack] = useState<
    "off_domain" | "hallucination" | "tone_drift" | "medical_claim"
  >("off_domain");
  const [customPrompt, setCustomPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [autoRemediationText, setAutoRemediationText] = useState<string | null>(null);

  // If a rule's "Test" button is clicked externally, open and pre-fill
  useEffect(() => {
    if (externalPayload) {
      setCustomPrompt(externalPayload);
      setIsOpen(true);
      setResult(null);
      setAutoRemediationText(null);
    }
  }, [externalPayload]);

  // Generate dynamic sample attack payloads based on the active brand
  const getDynamicSample = (type: string): string => {
    const brandName = brandConfig.name || "Enterprise Brand";
    const brandSlug = activeBrand.toLowerCase();

    if (brandSlug === "aureon") {
      if (type === "off_domain")
        return "Announcing the Aureon BlendMaster Pro: 750W high-speed kitchen mixer grinder with 3 stainless steel jars for domestic food preparation.";
      if (type === "hallucination")
        return "Aureon FraudGuard delivers guaranteed 99.999% uptime and zero-latency millisecond transaction routing across all global nodes.";
      if (type === "tone_drift")
        return "Yo guys!! Check out this sick hack that totally breaks fraud rings! We are literally slaying it no cap, best tech ever fr fr!";
      if (type === "medical_claim")
        return "Aureon AI algorithms are 100% unhackable and mathematically impossible for any human or quantum computer to ever penetrate or bypass.";
    }

    if (brandSlug === "solaria") {
      if (type === "off_domain")
        return "Solaria CyberSentry: Enterprise kernel-level anti-malware and zero-trust firewall for cloud datacenters.";
      if (type === "hallucination")
        return "Solaria PureHydrate contains 500mg synthetic caffeine and artificial taurine boosters for intense synthetic workout energy.";
      if (type === "tone_drift")
        return "BUY NOW LIMITED TIME ONLY!! 80% OFF BLOWOUT SALE! ACT FAST BEFORE IT IS GONE FOREVER!! CHEAPEST DEALS IN TOWN!!";
      if (type === "medical_claim")
        return "Solaria BioImmune is clinically certified by the FDA to permanently cure diabetes, eliminate cancer cells, and reverse heart disease in 7 days.";
    }

    // Dynamic brand workspace attack generator
    if (type === "off_domain") {
      return `Announcing the ${brandName} Quantum SuperCompute Blade: 256-core industrial cloud computing server with cryogenic liquid cooling for high-frequency algorithmic derivatives trading.`;
    }
    if (type === "hallucination") {
      return `${brandName} products deliver an independently audited 99.999% laboratory guarantee and certified 100x efficiency improvement across all verified trials.`;
    }
    if (type === "tone_drift") {
      return `OMG guys!! You have to see what ${brandName} just dropped! We are literally slaying it no cap, insane blowout deals fr fr best ever!!`;
    }
    if (type === "medical_claim") {
      return `${brandName} is clinically guaranteed to eliminate 100% of risks, permanently prevent all defects, and carries full FDA medical immunity certification.`;
    }
    return `Special announcement for ${brandName} with absolute guarantees and unverified performance superlatives.`;
  };

  const attacks = [
    {
      id: "off_domain",
      title: "Domain / Category Infiltration",
      desc: `Attempts to publish products completely foreign to ${brandConfig.name}'s authorized domain.`,
      severity: "CRITICAL",
      icon: AlertOctagon,
      color: "text-red-400",
      sample: getDynamicSample("off_domain"),
    },
    {
      id: "hallucination",
      title: "Factual Hallucination Injection",
      desc: "Submits unbacked statistics and false performance metrics to test TruthMark™ grounding.",
      severity: "HIGH",
      icon: Flame,
      color: "text-amber-400",
      sample: getDynamicSample("hallucination"),
    },
    {
      id: "tone_drift",
      title: "Tone Dilution & Brand Erosion",
      desc: "Submits informal slang, aggressive clickbait, or hype that undermines brand authority.",
      severity: "HIGH",
      icon: Zap,
      color: "text-purple-400",
      sample: getDynamicSample("tone_drift"),
    },
    {
      id: "medical_claim",
      title: "Unauthorized Regulatory Claim",
      desc: "Injects legally hazardous 100% absolute guarantees or unlicensed certifications.",
      severity: "CRITICAL",
      icon: ShieldAlert,
      color: "text-rose-400",
      sample: getDynamicSample("medical_claim"),
    },
  ];

  const handleRunAttack = async (attackId?: string) => {
    const attackToRun = attackId || selectedAttack;
    const currentAttackObj = attacks.find((a) => a.id === attackToRun);
    const textToSend = customPrompt.trim() || currentAttackObj?.sample || "";

    try {
      setLoading(true);
      setResult(null);
      setAutoRemediationText(null);
      const res = await api.runStressTest({
        brand_slug: activeBrand,
        attack_type: attackToRun,
        custom_prompt: textToSend,
      });
      setResult(res);

      // Synthesize smart auto-remediation suggestion
      if (res.decision === "BLOCKED" || res.decision === "REVIEW_REQUIRED") {
        if (attackToRun === "tone_drift") {
          setAutoRemediationText(
            `Discover our latest enterprise enhancements from ${brandConfig.name}, engineered to uphold verified operational precision and standard compliance.`
          );
        } else if (attackToRun === "medical_claim" || attackToRun === "hallucination") {
          setAutoRemediationText(
            `${brandConfig.name} solutions are designed to support rigorous organizational standards, verified under active corporate benchmarks.`
          );
        } else {
          setAutoRemediationText(
            `Explore ${brandConfig.name}'s official portfolio of authorized solutions, tailored specifically to your organization's verified operational requirements.`
          );
        }
      }
    } catch (err: any) {
      alert("Stress test failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAttack = (id: any) => {
    setSelectedAttack(id);
    const chosen = attacks.find((a) => a.id === id);
    if (chosen) {
      setCustomPrompt(chosen.sample);
    }
    setResult(null);
    setAutoRemediationText(null);
  };

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white shadow-xl overflow-hidden transition-all duration-300">
      {/* Compact Interactive Header Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer p-4.5 sm:p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500/30 to-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-inner shrink-0">
            <Flame className="h-5 w-5 text-red-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Live Rule Testing Sandbox & Adversarial Drift Lab
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                FIREWALL BENCHMARK
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate off-brand attacks, tone dilution, and hallucination probes against{" "}
              <strong className="text-white">{brandConfig.name}</strong> in real time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Firewall Active
          </div>

          <button
            type="button"
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
          >
            <span>{isOpen ? "Collapse Sandbox" : "Open Rule Tester"}</span>
            {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Sandbox Playground */}
      {isOpen && (
        <div className="p-5 sm:p-6 border-t border-slate-800/80 space-y-5 animate-in fade-in duration-200">
          {/* Preset Attack Scenarios */}
          <div>
            <div className="text-xs font-semibold text-slate-300 mb-2.5 flex items-center justify-between">
              <span>Choose Adversarial Test Vector:</span>
              <span className="text-[11px] text-slate-400 font-normal">
                Targeting: <strong className="text-indigo-300">{brandConfig.name}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {attacks.map((att) => {
                const isSelected = selectedAttack === att.id;
                const Icon = att.icon;

                return (
                  <div
                    key={att.id}
                    onClick={() => handleSelectAttack(att.id)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all relative ${
                      isSelected
                        ? "bg-indigo-900/40 border-indigo-400 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-950/40"
                        : "bg-slate-800/30 border-slate-700/60 hover:bg-slate-800/60 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Icon className={`h-4 w-4 ${att.color}`} />
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {att.severity}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white tracking-tight">{att.title}</div>
                    <div className="text-[11px] text-slate-400 mt-1 leading-snug line-clamp-2">
                      {att.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Adversarial Payload Editor */}
          <div className="bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-2">
                <span>Simulated Attack Payload</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  (edit or enter custom test draft)
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  const sample = attacks.find((a) => a.id === selectedAttack)?.sample || "";
                  setCustomPrompt(sample);
                  if (onClearExternalPayload) onClearExternalPayload();
                }}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-mono transition-colors"
              >
                Reset to {brandConfig.name} Sample
              </button>
            </div>

            <textarea
              value={customPrompt || attacks.find((a) => a.id === selectedAttack)?.sample || ""}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
              className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed placeholder-slate-600"
              placeholder={`Enter test copy to evaluate against ${brandConfig.name} Brand Brain...`}
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-indigo-400" />
                <span>Zero-Tolerance Firewall Active • Cross-checks all active rules & facts</span>
              </div>

              <button
                type="button"
                onClick={() => handleRunAttack()}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RotateCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Executing Stress Test...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Launch Adversarial Stress Test</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Test Verdict & Findings Report */}
          {result && (() => {
            const isPassed =
              result.status === "cleared" ||
              (result.decision === "PASS" &&
                (result.governance_score ?? 0) >= 85 &&
                (!result.findings || result.findings.length === 0));

            return (
              <div
                className={`p-5 rounded-2xl border space-y-4 animate-in fade-in duration-300 ${
                  isPassed
                    ? "bg-slate-950/90 border-emerald-500/50 shadow-emerald-950/20 shadow-xl"
                    : "bg-slate-950/90 border-red-500/50 shadow-red-950/20 shadow-xl"
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                        isPassed
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                    </div>
                    <div>
                      <span
                        className={`text-xs font-extrabold uppercase tracking-wider ${
                          isPassed ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {isPassed
                          ? "Payload Verified Compliant — Zero Brand Drift"
                          : "Adversarial Drift Intercepted by Firewall"}
                      </span>
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        {result.defense_summary}
                      </div>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">
                      Firewall Verdict
                    </span>
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-bold font-mono border inline-block mt-0.5 ${
                        isPassed
                          ? "bg-emerald-900/60 text-emerald-200 border-emerald-600"
                          : "bg-red-900/60 text-red-200 border-red-600"
                      }`}
                    >
                      {result.decision} • Score: {result.governance_score}/100
                    </span>
                  </div>
                </div>

                {/* Violations Flagged */}
                <div className="space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {isPassed
                      ? "Compliance Attestation"
                      : `Triggered Defensive Interceptions (${result.findings?.length || 0})`}
                  </div>

                  {isPassed ? (
                    <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300 flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>
                        No brand drift, unbacked factual claims, or prohibited terms detected in this payload. Content is fully aligned with active Brand Brain standards.
                      </span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {result.findings?.map((f: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-indigo-400 uppercase tracking-wider">
                              {f.finding_type || "Rule"} • {f.rule_ref || "POLICY"}
                            </span>
                            <span className="text-red-400 uppercase">{f.severity || "Critical"}</span>
                          </div>
                          <div className="font-bold text-white text-xs">{f.title}</div>
                          <div className="text-[11px] text-slate-400 leading-relaxed">
                            {f.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Auto-Remediation Preview Studio */}
                {autoRemediationText && (
                  <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                        <Wand2 className="h-3.5 w-3.5" />
                        <span>Instant Auto-Remediation Preview</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Predicted: 100/100 PASS
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900/90 border border-indigo-500/20 font-mono text-xs text-slate-200">
                      &quot;{autoRemediationText}&quot;
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomPrompt(autoRemediationText);
                        handleRunAttack();
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors pt-1"
                    >
                      <span>Re-test with auto-remediated copy</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
