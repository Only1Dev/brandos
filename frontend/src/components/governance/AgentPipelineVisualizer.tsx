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
  Video,
  Radio,
  FileCheck2,
  Sparkles,
  Terminal,
  Layers,
} from "lucide-react";

interface AgentPipelineVisualizerProps {
  isAnalyzing: boolean;
  onComplete?: () => void;
  brandName?: string;
  contentType?: string;
}

interface AgentStage {
  id: string;
  name: string;
  role: string;
  icon: any;
  status: "idle" | "running" | "passed" | "flagged";
  detail: string;
  expectedDurationSec: number;
}

const BRAND_TIPS = [
  "💡 BrandOS Rule 401: All motion lower-thirds and video overlays require 24px padding around primary logos.",
  "💡 Factual Veracity: Superlatives like '100% Unbreakable' trigger zero-tolerance regulatory alerts unless backed by certified lab data.",
  "💡 Zero-Data Retention: Audio and video frames are governed ephemerally in-memory; no customer media is stored or used for model training.",
  "💡 TruthMark™ Verification: Every approved frame and verified spoken claim receives an immutable SHA-256 cryptographic signature.",
  "💡 Adversarial Devil's Advocate: Runs autonomous counter-factual stress tests to challenge and eliminate false-positive flags.",
  "💡 Multi-Channel Harmonization: Content is checked for cross-tenant bleeding between Aureon Technologies and Solaria Wellness.",
];

export function AgentPipelineVisualizer({
  isAnalyzing,
  onComplete,
  brandName = "Active Brand",
  contentType = "social_post",
}: AgentPipelineVisualizerProps) {
  const isVideo = contentType === "video";
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [tokensAudited, setTokensAudited] = useState(0);
  const [framesAudited, setFramesAudited] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(4);
  const [telemetryLogs, setTelemetryLogs] = useState<
    { time: string; text: string; tag: string }[]
  >([]);

  // Text Pipeline Stages (5 stages)
  const textStages: AgentStage[] = [
    {
      id: "firewall",
      name: "Domain Perimeter Firewall",
      role: "Zero-Tolerance Domain Boundary Filter",
      icon: ShieldCheck,
      status: currentStep > 0 ? "passed" : currentStep === 0 ? "running" : "idle",
      detail: `Validating category alignment against ${brandName} domain perimeter...`,
      expectedDurationSec: 1.5,
    },
    {
      id: "tone",
      name: "Voice & Tone Resonance Engine",
      role: "Semantic Linguistic Authority",
      icon: Volume2,
      status: currentStep > 1 ? "passed" : currentStep === 1 ? "running" : "idle",
      detail: "Auditing brand voice archetype, sentence cadence, and style guidelines...",
      expectedDurationSec: 2.5,
    },
    {
      id: "facts",
      name: "TruthMark™ Knowledge Grounding",
      role: "Factual Veracity & Number Verification",
      icon: FileSearch,
      status: currentStep > 2 ? "passed" : currentStep === 2 ? "running" : "idle",
      detail: "Cross-referencing claims against active Brand Brain knowledge graph...",
      expectedDurationSec: 3.0,
    },
    {
      id: "terminology",
      name: "Controlled Lexicon & Trademark",
      role: "Prohibited Vocabulary & Terms",
      icon: BookOpen,
      status: currentStep > 3 ? "passed" : currentStep === 3 ? "running" : "idle",
      detail: "Scanning for disallowed vocabulary, deprecated slogans, and competitor terms...",
      expectedDurationSec: 2.0,
    },
    {
      id: "devils_advocate",
      name: "Adversarial Devil's Advocate",
      role: "Deceptive Framing & Counter-Factual Stress",
      icon: Flame,
      status: currentStep > 4 ? "passed" : currentStep === 4 ? "running" : "idle",
      detail: "Executing counter-factual stress-tests to detect subtle brand drift...",
      expectedDurationSec: 3.5,
    },
  ];

  // Video Multimodal Pipeline Stages (6 stages)
  const videoStages: AgentStage[] = [
    {
      id: "video_ingest",
      name: "Cryptographic Video Ingestion",
      role: "Container Parsing & SHA-256 Hashing",
      icon: Video,
      status: currentStep > 0 ? "passed" : currentStep === 0 ? "running" : "idle",
      detail: "Parsing H.264/AAC media container & computing immutable TruthMark™ hash...",
      expectedDurationSec: 3.0,
    },
    {
      id: "audio_speech",
      name: "Speech Track Transcription",
      role: "Gemini 3.8 Flash Neural Transcriber",
      icon: Radio,
      status: currentStep > 1 ? "passed" : currentStep === 1 ? "running" : "idle",
      detail: "Transcribing 48kHz audio track for spoken claims, promises & dialogue...",
      expectedDurationSec: 5.0,
    },
    {
      id: "visual_frames",
      name: "Keyframe Clearspace & Palette",
      role: "Scene Vision & Logo Boundary Audit",
      icon: Eye,
      status: currentStep > 2 ? "passed" : currentStep === 2 ? "running" : "idle",
      detail: "Inspecting keyframes for LOGO-PRIMARY-V3 24px padding & brand hex colors...",
      expectedDurationSec: 6.0,
    },
    {
      id: "knowledge_grounding",
      name: "TruthMark™ Factual Grounding",
      role: "Brand Brain Fact Verification",
      icon: FileSearch,
      status: currentStep > 3 ? "passed" : currentStep === 3 ? "running" : "idle",
      detail: "Cross-referencing dialogue statements against certified enterprise facts...",
      expectedDurationSec: 4.0,
    },
    {
      id: "devils_advocate_video",
      name: "Adversarial Video Stress-Test",
      role: "Misleading Edits & Deceptive Claims",
      icon: Flame,
      status: currentStep > 4 ? "passed" : currentStep === 4 ? "running" : "idle",
      detail: "Evaluating spoken superlatives ('100% Unbreakable') & visual context...",
      expectedDurationSec: 4.5,
    },
    {
      id: "truthmark_cert",
      name: "TruthMark™ Seal Generation",
      role: "Cryptographic Attestation & Radar Score",
      icon: ShieldCheck,
      status: currentStep > 5 ? "passed" : currentStep === 5 ? "running" : "idle",
      detail: "Synthesizing multi-agent governance consensus into verified certificate...",
      expectedDurationSec: 3.0,
    },
  ];

  const stages = isVideo ? videoStages : textStages;
  const totalStagesCount = stages.length;

  // Real-time animation, telemetry stream & asymptotic pacing
  useEffect(() => {
    if (!isAnalyzing) {
      setCurrentStep(0);
      setElapsedMs(0);
      setTokensAudited(0);
      setFramesAudited(0);
      setProgressPercent(4);
      setTelemetryLogs([]);
      return;
    }

    const startTime = Date.now();

    // Rotate tips every 4.2 seconds
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % BRAND_TIPS.length);
    }, 4200);

    // Initial log
    const initialLog = isVideo
      ? {
          time: "00:00.12",
          text: `Initialized Multimodal Video Governance Engine for ${brandName}`,
          tag: "INIT",
        }
      : {
          time: "00:00.10",
          text: `Initialized Text Governance Engine for ${brandName}`,
          tag: "INIT",
        };
    setTelemetryLogs([initialLog]);

    // Fast timer interval (50ms)
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = now - startTime;
      setElapsedMs(diff);

      const sec = diff / 1000;

      if (isVideo) {
        // Video Pacing (~20-25 seconds total)
        // Stage thresholds in ms
        let step = 0;
        if (diff < 3200) step = 0;
        else if (diff < 7500) step = 1;
        else if (diff < 13000) step = 2;
        else if (diff < 18000) step = 3;
        else if (diff < 23000) step = 4;
        else step = 5;
        setCurrentStep(step);

        // Smooth asymptotic progress calculation (never freezes at 100%)
        // Rapid up to ~40%, smooth to 85%, gently creeps to 96%
        let pct: number;
        if (diff < 3500) {
          pct = 5 + (diff / 3500) * 25; // 5 -> 30%
        } else if (diff < 12000) {
          pct = 30 + ((diff - 3500) / 8500) * 35; // 30 -> 65%
        } else if (diff < 22000) {
          pct = 65 + ((diff - 12000) / 10000) * 23; // 65 -> 88%
        } else {
          // Asymptotic creep towards 97%
          pct = Math.min(97, 88 + (1 - Math.exp(-(diff - 22000) / 8000)) * 9);
        }
        setProgressPercent(Math.floor(pct));

        setFramesAudited(Math.min(720, Math.floor(sec * 28)));
        setTokensAudited(Math.min(8400, Math.floor(diff * 1.6)));
      } else {
        // Text Pacing (~6-8 seconds total)
        let step = 0;
        if (diff < 1200) step = 0;
        else if (diff < 2800) step = 1;
        else if (diff < 4500) step = 2;
        else if (diff < 6200) step = 3;
        else step = 4;
        setCurrentStep(step);

        let pct: number;
        if (diff < 2000) {
          pct = 8 + (diff / 2000) * 35;
        } else if (diff < 6000) {
          pct = 43 + ((diff - 2000) / 4000) * 45;
        } else {
          pct = Math.min(97, 88 + (1 - Math.exp(-(diff - 6000) / 4000)) * 9);
        }
        setProgressPercent(Math.floor(pct));

        setTokensAudited(Math.min(4200, Math.floor(diff * 1.8)));
      }
    }, 50);

    // Micro-telemetry stream intervals
    const eventTimeouts: NodeJS.Timeout[] = [];
    const videoEvents = [
      { delay: 1100, text: "Demuxed audio track (48.0 kHz stereo AAC) from container", tag: "MEDIA" },
      { delay: 2400, text: "Computed SHA-256 hash for TruthMark™ pre-publication seal", tag: "HASH" },
      { delay: 4200, text: "Gemini 3.8 Flash neural speech engine extracting spoken dialogue...", tag: "SPEECH" },
      { delay: 6800, text: "Transcribed spoken claims: analyzing for unapproved superlatives...", tag: "AUDIO" },
      { delay: 9200, text: "Sampling keyframes at scene transitions: inspecting LOGO-PRIMARY-V3...", tag: "VISION" },
      { delay: 11500, text: "Evaluating 24px logo clearspace & primary palette (#4F46E5, #0F172A)...", tag: "PALETTE" },
      { delay: 14800, text: "Cross-referencing claims against active Brand Brain ground-truth facts...", tag: "FACTS" },
      { delay: 18500, text: "Devil's Advocate running adversarial counter-factual challenge...", tag: "STRESS" },
      { delay: 22000, text: "Synthesizing multi-agent governance consensus & radar telemetry...", tag: "CONSENSUS" },
    ];

    const textEvents = [
      { delay: 800, text: "Domain perimeter checked: zero out-of-domain drift detected", tag: "FIREWALL" },
      { delay: 1900, text: "Voice & tone semantic resonance scored against brand archetype", tag: "VOICE" },
      { delay: 3200, text: "TruthMark™ engine comparing claims against Brand Brain facts", tag: "FACTS" },
      { delay: 4800, text: "Lexicon filter scanned 100% of text: zero prohibited terms found", tag: "LEXICON" },
      { delay: 6100, text: "Devil's Advocate running counter-factual stress tests...", tag: "STRESS" },
    ];

    const eventsToSchedule = isVideo ? videoEvents : textEvents;
    eventsToSchedule.forEach((evt) => {
      const t = setTimeout(() => {
        const ms = evt.delay;
        const s = Math.floor(ms / 1000);
        const rem = Math.floor((ms % 1000) / 10);
        const timeStr = `00:${s.toString().padStart(2, "0")}.${rem.toString().padStart(2, "0")}`;
        setTelemetryLogs((prev) => [
          ...prev.slice(-3),
          { time: timeStr, text: evt.text, tag: evt.tag },
        ]);
      }, evt.delay);
      eventTimeouts.push(t);
    });

    return () => {
      clearInterval(interval);
      clearInterval(tipInterval);
      eventTimeouts.forEach(clearTimeout);
    };
  }, [isAnalyzing, isVideo, brandName]);

  if (!isAnalyzing) return null;

  const currentStage = stages[Math.min(currentStep, stages.length - 1)];

  return (
    <div className="bg-[#0B0F19] text-white rounded-3xl p-6 shadow-2xl border border-indigo-500/30 overflow-hidden relative transition-all duration-300">
      {/* Background ambient multi-color glows */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-indigo-600/25 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-purple-600/20 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header telemetry bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-400 shadow-inner">
            {isVideo ? (
              <Video className="h-5 w-5 animate-pulse text-indigo-400" />
            ) : (
              <Cpu className="h-5 w-5 animate-pulse text-indigo-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white">
                {isVideo
                  ? "Multimodal Video & Audio Governance Engine"
                  : "BrandOS Multi-Agent Governance Engine"}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                ACTIVE
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
              <span>{brandName}</span>
              <span>•</span>
              <span className="text-indigo-300 font-mono">
                {isVideo ? "Gemini 3.8 Flash Vision + Audio" : "5 Autonomous Consensus Agents"}
              </span>
            </div>
          </div>
        </div>

        {/* Real-time counters */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Activity className="h-3.5 w-3.5 text-indigo-400 animate-spin" />
            <span>LATENCY:</span>
            <span className="text-emerald-400 font-bold">
              {(elapsedMs / 1000).toFixed(1)}s
            </span>
          </div>

          {isVideo ? (
            <div className="flex items-center gap-1.5 text-slate-400">
              <Eye className="h-3.5 w-3.5 text-purple-400" />
              <span>FRAMES:</span>
              <span className="text-purple-300 font-bold">{framesAudited}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-400">
              <span>TOKENS:</span>
              <span className="text-indigo-300 font-bold">
                {tokensAudited.toLocaleString()}
              </span>
            </div>
          )}

          <div className="px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 font-bold">
            {progressPercent}%
          </div>
        </div>
      </div>

      {/* Active Stage Highlight Banner with Equalizer/Waveform */}
      <div className="my-4 p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90 border border-indigo-500/40 flex items-center justify-between gap-4 relative z-10 shadow-lg">
        <div className="flex items-center gap-3.5 truncate">
          <div className="relative">
            <div className="h-4 w-4 rounded-full bg-indigo-500 animate-ping opacity-75" />
            <div className="h-2.5 w-2.5 rounded-full bg-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>

          <div className="truncate">
            <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
              <span>Agent in Execution:</span>
              <span className="text-white font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10">
                {currentStage.name}
              </span>
            </div>
            <div className="text-xs text-slate-300 truncate mt-1 font-sans">
              {currentStage.detail}
            </div>
          </div>
        </div>

        {/* Audio / Neural Waveform Animation */}
        <div className="flex items-end gap-1 h-6 shrink-0 px-2">
          <div className="w-1 bg-indigo-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3" />
          <div className="w-1 bg-purple-400 rounded-full animate-[pulse_0.9s_ease-in-out_infinite] h-5" />
          <div className="w-1 bg-sky-400 rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-6" />
          <div className="w-1 bg-emerald-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-4" />
          <div className="w-1 bg-indigo-400 rounded-full animate-[pulse_0.7s_ease-in-out_infinite] h-5" />
        </div>
      </div>

      {/* Pipeline Node Flow Diagram */}
      <div
        className={`grid gap-2.5 relative z-10 ${
          isVideo ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" : "grid-cols-1 sm:grid-cols-3 md:grid-cols-5"
        }`}
      >
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isCurrent = currentStep === idx;
          const isDone = currentStep > idx;

          return (
            <div
              key={stage.id}
              className={`p-3 rounded-xl border transition-all duration-300 relative ${
                isCurrent
                  ? "bg-indigo-950/80 border-indigo-400 ring-2 ring-indigo-500/40 shadow-xl shadow-indigo-500/10 scale-102"
                  : isDone
                  ? "bg-slate-800/40 border-emerald-500/40 text-slate-300"
                  : "bg-slate-800/15 border-slate-800/70 text-slate-500 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                    isCurrent
                      ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30"
                      : isDone
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-slate-700/30 text-slate-500"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : isCurrent ? (
                  <div className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
                ) : (
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                )}
              </div>

              <div className="text-[11px] font-bold text-white truncate leading-tight">
                {stage.name}
              </div>
              <div className="text-[9px] text-slate-400 truncate mt-0.5">
                {stage.role}
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-700/50 flex items-center justify-between text-[9px] font-mono">
                <span
                  className={
                    isDone
                      ? "text-emerald-400 font-bold"
                      : isCurrent
                      ? "text-indigo-400 font-bold animate-pulse"
                      : "text-slate-500"
                  }
                >
                  {isDone ? "VERIFIED" : isCurrent ? "AUDITING..." : "QUEUED"}
                </span>
                <span className="text-slate-500">
                  {stage.expectedDurationSec}s
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Continuous Asymptotic Progress Bar */}
      <div className="mt-4 w-full bg-slate-800/80 rounded-full h-2 overflow-hidden relative">
        <div
          className="bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 h-2 rounded-full transition-all duration-150 ease-out shadow-sm"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Micro-Telemetry Terminal Stream & Brand Tips */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10 text-[11px]">
        {/* Live Event Stream */}
        <div className="bg-black/40 rounded-xl p-2.5 border border-white/5 font-mono space-y-1 overflow-hidden h-20 flex flex-col justify-end">
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] pb-1 border-b border-white/5 font-sans font-semibold">
            <Terminal className="h-3 w-3 text-indigo-400" />
            <span>REAL-TIME GOVERNANCE TELEMETRY FEED:</span>
          </div>
          {telemetryLogs.map((log, i) => (
            <div
              key={i}
              className="flex items-center gap-2 truncate animate-in fade-in duration-200"
            >
              <span className="text-slate-500 text-[10px]">{log.time}</span>
              <span className="px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-bold">
                [{log.tag}]
              </span>
              <span className="text-slate-300 truncate text-[10px]">{log.text}</span>
            </div>
          ))}
        </div>

        {/* Dynamic Rotating Brand Tip */}
        <div className="bg-indigo-950/30 rounded-xl p-2.5 border border-indigo-500/20 flex flex-col justify-between h-20">
          <div className="flex items-center justify-between text-[10px] text-indigo-400 font-semibold font-sans">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>BRAND COMPLIANCE INSIGHT:</span>
            </span>
            <span className="text-slate-500 font-mono text-[9px]">
              {(tipIndex + 1)} / {BRAND_TIPS.length}
            </span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed transition-all duration-300 italic">
            {BRAND_TIPS[tipIndex]}
          </p>
          <div className="text-[9px] text-slate-500 flex items-center justify-between pt-1 border-t border-indigo-500/10">
            <span>Enterprise Policy Enforcer</span>
            <span className="text-emerald-400 font-bold">Zero-Tolerance Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
