"use client";

import { useMemo } from "react";
import { ShieldCheck, Target, Zap } from "lucide-react";

interface RadarScores {
  domain: number;
  tone: number;
  facts: number;
  terminology: number;
  resilience: number;
}

interface GovernanceRadarChartProps {
  scores?: RadarScores;
  overallScore?: number | null;
  decision?: string;
}

export function GovernanceRadarChart({
  scores = { domain: 100, tone: 90, facts: 85, terminology: 95, resilience: 90 },
  overallScore = 88,
  decision = "PASS",
}: GovernanceRadarChartProps) {
  const axes = [
    { key: "domain", label: "Domain Alignment", score: scores.domain ?? 100 },
    { key: "tone", label: "Voice & Tone", score: scores.tone ?? 90 },
    { key: "facts", label: "Factual Truth", score: scores.facts ?? 85 },
    { key: "terminology", label: "Lexicon Control", score: scores.terminology ?? 95 },
    { key: "resilience", label: "Adversarial Resilience", score: scores.resilience ?? 90 },
  ];

  const size = 260;
  const center = size / 2;
  const maxRadius = 85;

  // Compute pentagon points for an arbitrary radius
  const getPolygonPoints = (radiusFn: (i: number) => number) => {
    return axes
      .map((_, i) => {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const r = radiusFn(i);
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  };

  const dataPoints = useMemo(() => {
    return getPolygonPoints((i) => {
      const val = Math.max(10, Math.min(100, axes[i].score));
      return (val / 100) * maxRadius;
    });
  }, [scores]);

  const isBlocked = decision === "BLOCKED" || overallScore === 0;
  const isPass = decision === "PASS" || (overallScore !== null && overallScore >= 80);

  const themeColors = isBlocked
    ? { stroke: "#ef4444", fill: "rgba(239, 68, 68, 0.25)", glow: "rgba(239, 68, 68, 0.4)" }
    : isPass
    ? { stroke: "#10b981", fill: "rgba(16, 185, 129, 0.25)", glow: "rgba(16, 185, 129, 0.4)" }
    : { stroke: "#f59e0b", fill: "rgba(245, 158, 11, 0.25)", glow: "rgba(245, 158, 11, 0.4)" };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-indigo-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
            5-Axis Governance Compliance Vector
          </span>
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            isBlocked
              ? "bg-red-50 text-red-700 border-red-200"
              : isPass
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}
        >
          {decision}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {/* SVG Radar Chart */}
        <div className="relative flex items-center justify-center">
          <svg width={size} height={size} className="overflow-visible">
            {/* Background concentric reference pentagons (25%, 50%, 75%, 100%) */}
            {[0.25, 0.5, 0.75, 1.0].map((level, idx) => (
              <polygon
                key={idx}
                points={getPolygonPoints(() => level * maxRadius)}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth={level === 1.0 ? "1.5" : "1"}
                strokeDasharray={level < 1.0 ? "2 2" : "none"}
              />
            ))}

            {/* Spokes from center to vertices */}
            {axes.map((_, i) => {
              const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
              const x = center + maxRadius * Math.cos(angle);
              const y = center + maxRadius * Math.sin(angle);
              return (
                <line
                  key={i}
                  x1={center}
                  y1={center}
                  x2={x}
                  y2={y}
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />
              );
            })}

            {/* Score Polygon with animated fill */}
            <polygon
              points={dataPoints}
              fill={themeColors.fill}
              stroke={themeColors.stroke}
              strokeWidth="2.5"
              className="transition-all duration-700 ease-out"
            />

            {/* Data point dots */}
            {axes.map((axis, i) => {
              const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
              const val = Math.max(10, Math.min(100, axis.score));
              const r = (val / 100) * maxRadius;
              const x = center + r * Math.cos(angle);
              const y = center + r * Math.sin(angle);
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#ffffff"
                  stroke={themeColors.stroke}
                  strokeWidth="2"
                  className="shadow-sm transition-all duration-700"
                />
              );
            })}
          </svg>
        </div>

        {/* Axis Breakdown Legends */}
        <div className="flex-1 w-full space-y-2">
          {axes.map((axis) => {
            const val = axis.score;
            const barColor =
              val >= 80 ? "bg-emerald-500" : val >= 50 ? "bg-amber-500" : "bg-red-500";

            return (
              <div key={axis.key} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700">{axis.label}</span>
                  <span className="font-mono font-bold text-slate-900">{val}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`${barColor} h-1.5 rounded-full transition-all duration-500`}
                    style={{ width: `${val}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
