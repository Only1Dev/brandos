"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Volume2,
  FileSearch,
  BookOpen,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Cpu,
  Activity,
} from "lucide-react";

interface AgentPipelineVisualizerProps {
  isAnalyzing: boolean;
  onComplete?: () => void;
  brandName?: string;
}

interface AgentStage {
  id: string;
  name: string;
  role: string;
  icon: any;
  durationMs: number;
  status: "idle" | "running" | "passed" | "flagged";
  detail: string;
}

export function AgentPipelineVisualizer({
  isAnalyzing,
  onComplete,
  brandName = "Active Brand",
}: AgentPipelineVisualizerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [tokensAudited, setTokensAudited] = useState(0);

  const stages: AgentStage[] = [
    {
      id: "firewall",
      name: "Domain Perimeter Firewall",
      role: "Zero-Tolerance Domain Boundary Filter",
      icon: ShieldCheck,
      durationMs: 400,
      status: currentStep > 0 ? "passed" : currentStep === 0 ? "running" : "idle",
      detail: `Validating category alignment against ${brandName} domain perimeter...`,
    },
    {
      id: "tone",
      name: "Voice & Tone Resonance Engine",
      role: "Semantic Linguistic Authority",
      icon: Volume2,
      durationMs: 700,
      status: currentStep > 1 ? "passed" : currentStep === 1 ? "running" : "idle",
      detail: "Auditing brand voice archetype, sentence cadence, and style guidelines...",
    },
    {
      id: "facts",
      name: "TruthMark™ Knowledge Grounding",
      role: "Factual Veracity & Number Verification",
      icon: FileSearch,
      durationMs: 650,
      status: currentStep > 2 ? "passed" : currentStep === 2 ? "running" : "idle",
      detail: "Cross-referencing claims against active Brand Brain knowledge graph...",
    },
    {
      id: "terminology",
      name: "Controlled Lexicon & Trademark",
      role: "Prohibited Vocabulary & Terms",
      icon: BookOpen,
      durationMs: 500,
      status: currentStep > 3 ? "passed" : currentStep === 3 ? "running" : "idle",
      detail: "Scanning for disallowed vocabulary, deprecated slogans, and competitor terms...",
    },
    {
      id: "devils_advocate",
      name: "Adversarial Devil's Advocate",
      role: "Deceptive Framing & Counter-Factual Stress",
      icon: Flame,
      durationMs: 800,
      status: currentStep > 4 ? "passed" : currentStep === 4 ? "running" : "idle",
      detail: "Executing counter-factual stress-tests to detect subtle brand drift...",
    },
  ];

  useEffect(() => {
    if (!isAnalyzing) {
      setCurrentStep(0);
      setElapsedMs(0);
      setTokensAudited(0);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = now - startTime;
      setElapsedMs(diff);
      setTokensAudited(Math.min(4800, Math.floor(diff * 1.8)));

      if (diff < 500) setCurrentStep(0);
      else if (diff < 1200) setCurrentStep(1);
      else if (diff < 1900) setCurrentStep(2);
      else if (diff < 2500) setCurrentStep(3);
      else if (diff < 3200) setCurrentStep(4);
      else setCurrentStep(5);
    }, 40);

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  if (!isAnalyzing) return null;

  const currentStage = stages[Math.min(currentStep, stages.length - 1)];

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-2xl border border-indigo-500/30 overflow-hidden relative">
      {/* Background ambient glow */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header telemetry bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400 shadow-inner">
            <Cpu className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white">BrandOS Multi-Agent Governance Engine</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                ACTIVE
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Distributed consensus evaluation running across 5 autonomous agents
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Activity className="h-3.5 w-3.5 text-indigo-400 animate-spin" />
            <span>LATENCY:</span>
            <span className="text-emerald-400 font-bold">{elapsedMs}ms</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>TOKENS AUDITED:</span>
            <span className="text-indigo-300 font-bold">{tokensAudited.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Active Stage Highlight Banner */}
      <div className="my-5 p-3.5 rounded-xl bg-slate-800/80 border border-indigo-500/40 flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3 truncate">
          <div className="h-3 w-3 rounded-full bg-indigo-400 animate-ping shrink-0" />
          <div className="truncate">
            <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
              <span>Agent in Execution:</span>
              <span className="text-white font-mono">{currentStage.name}</span>
            </div>
            <div className="text-xs text-slate-300 truncate mt-0.5 font-sans">
              {currentStage.detail}
            </div>
          </div>
        </div>
        <span className="text-xs font-mono text-indigo-400 font-bold shrink-0">
          Step {Math.min(currentStep + 1, 5)} / 5
        </span>
      </div>

      {/* Pipeline Node Flow Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative z-10">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isCurrent = currentStep === idx;
          const isDone = currentStep > idx;

          return (
            <div
              key={stage.id}
              className={`p-3.5 rounded-xl border transition-all duration-300 relative ${
                isCurrent
                  ? "bg-indigo-950/70 border-indigo-400 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/10 scale-102"
                  : isDone
                  ? "bg-slate-800/50 border-emerald-500/40 text-slate-300"
                  : "bg-slate-800/20 border-slate-800 text-slate-500 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                    isCurrent
                      ? "bg-indigo-500 text-white animate-pulse"
                      : isDone
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-slate-700/40 text-slate-500"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : isCurrent ? (
                  <div className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-slate-700" />
                )}
              </div>

              <div className="text-[12px] font-bold text-white truncate">{stage.name}</div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">{stage.role}</div>

              <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[10px] font-mono">
                <span className={isDone ? "text-emerald-400 font-bold" : isCurrent ? "text-indigo-400 font-bold" : "text-slate-500"}>
                  {isDone ? "COMPLETED" : isCurrent ? "AUDITING..." : "QUEUED"}
                </span>
                <span className="text-slate-500">{stage.durationMs}ms</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="mt-5 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, ((currentStep + 1) / 5) * 100)}%` }}
        />
      </div>
    </div>
  );
}
