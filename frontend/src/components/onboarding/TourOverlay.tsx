"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShieldAlert,
  Database,
  BarChart3,
  Sliders,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  ExternalLink,
  Sparkles,
  Compass,
} from "lucide-react";
import { useBrand } from "@/context/BrandContext";

interface TourStep {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  route: string;
  highlights: string[];
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "dashboard",
    badge: "Command Center",
    title: "Executive Governance Dashboard",
    subtitle: "Real-time compliance radar & organizational brand health",
    description:
      "BrandOS continuously governs collateral across marketing channels. Monitor 5-axis compliance vectors, firewall quarantine rates, and interactive KPI cards with root-cause diagnostics.",
    icon: LayoutDashboard,
    route: "/dashboard",
    highlights: [
      "5-Axis Governance Compliance Vector (Voice, Facts, Visual, Accessibility, Security)",
      "Interactive KPI cards with 7-day trend sparklines & contributing factor popups",
      "Real-time firewall quarantine activity feed with one-click audit drilldowns",
    ],
  },
  {
    id: "firewall",
    badge: "Pre-Publication Firewall",
    title: "Multimodal Pre-Publication Firewall",
    subtitle: "Deterministic & multimodal inspection before public release",
    description:
      "Audits video, audio, text copy, and visual creative assets in seconds. Specialized AI agents run concurrently to detect tone drift, ungrounded claims, and visual brand violations.",
    icon: ShieldAlert,
    route: "/reviews",
    highlights: [
      "Multimodal video inspection analyzing frame-by-frame visual integrity & spoken dialogue",
      "Zero-tolerance DLP protection for confidential product codenames and API keys",
      "Instant AI Auto-Remediation Studio guaranteeing 100/100 compliance in 1 click",
    ],
  },
  {
    id: "claims",
    badge: "TruthMark™ Ledger",
    title: "TruthMark™ Ground Truth & Claims Ledger",
    subtitle: "Topic-isolated factual benchmarking with zero hallucinations",
    description:
      "Public marketing claims are matched exclusively against topic-isolated Brand Brain facts. Eliminates false-positive contradictions between unrelated statistics and SLA benchmarks.",
    icon: Database,
    route: "/knowledge/claims",
    highlights: [
      "Interactive Fact Diff modal comparing public copy directly to certified ground truth",
      "Lifecycle state tracking: Extracted → Under Review → Certified Verified or Disputed",
      "30-day Claim Expiration Watchdog to prevent stale or legally risky metrics in market",
    ],
  },
  {
    id: "analytics",
    badge: "Predictive Intelligence",
    title: "BrandPulse™ Governance Analytics",
    subtitle: "Proactive telemetry & guideline drift detection",
    description:
      "Transforms pre-publication audit streams into executive intelligence. Identify which guidelines are violated most frequently, dispatch automated guidance to creators, and track compliance trends.",
    icon: BarChart3,
    route: "/analytics",
    highlights: [
      "4-Pillar Root Cause Diagnostics (TruthMark, VisualGuard, Voice, WCAG AA Accessibility)",
      "Automated Guidance Refresher dispatch targeting recurring creator violations",
      "Quarterly compliance trends and firewall quarantine efficiency metrics",
    ],
  },
  {
    id: "settings",
    badge: "Enterprise Controls",
    title: "Role-Based Access & Publishing Workflows",
    subtitle: "Zero-trust publishing boundaries and auto-approval thresholds",
    description:
      "Tailor organizational permissions across Creators, Reviewers, and Brand Administrators. Configure auto-approval score thresholds and dual-reviewer sign-off workflows.",
    icon: Sliders,
    route: "/settings",
    highlights: [
      "Granular permission matrix (submit drafts, auto-remediate, publish, edit Brand Brain)",
      "Configurable auto-approval thresholds (e.g. score ≥ 85) and dual sign-off rules",
      "Active team member directory with multi-role assignment and org controls",
    ],
  },
];

export function TourOverlay() {
  const router = useRouter();
  const { activeBrand, brandConfig } = useBrand();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Check localStorage on mount or listen for manual open event
  useEffect(() => {
    const hasSeenTour = localStorage.getItem("brandos_tour_completed");
    if (!hasSeenTour) {
      // Auto-open after a short delay so user sees dashboard first
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for global custom event to re-open tour anytime
  useEffect(() => {
    const handleOpenTour = () => {
      setCurrentStep(0);
      setIsOpen(true);
    };
    window.addEventListener("brandos:open-tour", handleOpenTour);
    return () => window.removeEventListener("brandos:open-tour", handleOpenTour);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDismiss();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handleBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStep]);

  const handleDismiss = () => {
    localStorage.setItem("brandos_tour_completed", "true");
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleDismiss();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleJumpToPage = (route: string) => {
    handleDismiss();
    router.push(route);
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;
  const isLast = currentStep === TOUR_STEPS.length - 1;
  const isSolaria = activeBrand === "solaria";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 transition-all">
        {/* Top Glow Accent Bar */}
        <div
          className={`h-2 w-full ${
            isSolaria
              ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600"
              : "bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-700"
          }`}
        />

        {/* Modal Header */}
        <div className="p-6 sm:p-8 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                  isSolaria
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-indigo-50 text-indigo-800 border-indigo-200"
                }`}
              >
                {step.badge}
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                Step {currentStep + 1} of {TOUR_STEPS.length}
              </span>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Skip onboarding tour (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Hero Title & Subtitle */}
          <div className="flex items-start gap-4 mt-4">
            <div
              className={`p-3.5 rounded-2xl shrink-0 ${
                isSolaria
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-indigo-100 text-indigo-700"
              }`}
            >
              <StepIcon className="h-7 w-7" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-snug">
                {step.title}
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                {step.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Main Body */}
        <div className="px-6 sm:px-8 py-2 space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {step.description}
          </p>

          {/* Highlights Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Core Capabilities in BrandOS:
            </div>
            <div className="space-y-2">
              {step.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                  <CheckCircle2
                    className={`h-4 w-4 shrink-0 mt-0.5 ${
                      isSolaria ? "text-emerald-600" : "text-indigo-600"
                    }`}
                  />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer & Navigation */}
        <div className="p-6 sm:p-8 pt-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Step Dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentStep === idx
                    ? isSolaria
                      ? "w-8 bg-emerald-600"
                      : "w-8 bg-indigo-600"
                    : "w-2 bg-slate-300 hover:bg-slate-400"
                }`}
                title={`Go to step ${idx + 1}: ${s.title}`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleJumpToPage(step.route)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Explore Section</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>

            {currentStep > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                isSolaria
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
              }`}
            >
              <span>{isLast ? "Get Started" : "Next Feature"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
