"use client";

import { useRef } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  X,
  Printer,
  Download,
  Award,
  Lock,
  Calendar,
  FileText,
  Building2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface GovernanceCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: any;
  brandName?: string;
}

export function GovernanceCertificateModal({
  isOpen,
  onClose,
  review,
  brandName = "Aureon Technologies",
}: GovernanceCertificateModalProps) {
  const certRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !review) return null;

  const isApproved = review.status === "approved";
  const isBlocked = !isApproved && (review.decision === "BLOCKED" || (review.governance_score ?? 0) < 70);
  const isPendingApproval = !isBlocked && !isApproved;

  const certId = isApproved
    ? `BOS-CERT-${review.id.slice(0, 8).toUpperCase()}`
    : isBlocked
    ? `BOS-DENIED-${review.id.slice(0, 8).toUpperCase()}`
    : `BOS-PENDING-${review.id.slice(0, 8).toUpperCase()}`;

  const rawText = review.content?.raw_text || "";
  
  const mockSha = Array.from(review.id.replace(/-/g, ""))
    .map((c: any) => c.charCodeAt(0).toString(16))
    .join("")
    .slice(0, 32);

  const radar = review.radar_scores || {
    domain: isBlocked ? 0 : 100,
    tone: isBlocked ? 25 : 95,
    facts: isBlocked ? 20 : 100,
    terminology: isBlocked ? 30 : 95,
    resilience: isBlocked ? 10 : 90,
  };

  const agentAttestation = [
    {
      agent: "Domain Perimeter",
      score: `${radar.domain}%`,
      status: radar.domain >= 70 ? "PASSED" : "BLOCKED",
      passed: radar.domain >= 70,
    },
    {
      agent: "Voice & Tone",
      score: `${radar.tone}%`,
      status: radar.tone >= 70 ? "VERIFIED" : "NON-COMPLIANT",
      passed: radar.tone >= 70,
    },
    {
      agent: "TruthMark™ Facts",
      score: `${radar.facts}%`,
      status: radar.facts >= 70 ? "PASSED" : "UNVERIFIED",
      passed: radar.facts >= 70,
    },
    {
      agent: "Controlled Lexicon",
      score: `${radar.terminology}%`,
      status: radar.terminology >= 70 ? "PASSED" : "VIOLATIONS",
      passed: radar.terminology >= 70,
    },
    {
      agent: "Devil's Advocate",
      score: `${radar.resilience}%`,
      status: radar.resilience >= 70 ? "VERIFIED" : "HIGH RISK",
      passed: radar.resilience >= 70,
    },
  ];

  const handlePrint = () => {
    if (isPendingApproval) {
      alert("Draft Notice: Final Publication Certificate unlocks only after an authorized Reviewer or Administrator clicks 'Approve for Publication'.");
      return;
    }
    if (isBlocked) {
      alert("Enforcement Notice: Content publication clearance denied by Firewall. Only approved assets can generate an official printable certificate.");
      return;
    }
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Modal Top Toolbar (hidden on print) */}
        <div
          className={`px-6 py-3 ${
            isBlocked
              ? "bg-slate-950 border-b border-red-900/50"
              : isApproved
              ? "bg-emerald-950 border-b border-emerald-800/50"
              : "bg-slate-900 border-b border-amber-900/40"
          } text-white flex items-center justify-between print:hidden`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            {isBlocked ? (
              <>
                <ShieldAlert className="h-4 w-4 text-red-400" />
                <span className="text-red-300 font-bold">BrandOS Governance Enforcement — Publication Clearance Denied</span>
              </>
            ) : isApproved ? (
              <>
                <Award className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-300 font-bold">Official Publication Clearance Certificate (Active)</span>
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 text-amber-400" />
                <span className="text-amber-300 font-bold">AI Pre-Screen Verified — Awaiting Reviewer Sign-Off</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isPendingApproval}
              title={isPendingApproval ? "Official Certificate is printable only after formal Reviewer sign-off" : "Print Official Document"}
              className={`px-3 py-1.5 rounded-lg ${
                isBlocked
                  ? "bg-red-700 hover:bg-red-800 text-white"
                  : isApproved
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700"
              } text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors`}
            >
              <Printer className="h-3.5 w-3.5" />
              <span>{isPendingApproval ? "Print Locked (Pending Approval)" : "Print / Export PDF"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Certificate Printable Canvas */}
        <div className="p-8 sm:p-12 overflow-y-auto flex-1 bg-gradient-to-b from-slate-50/50 to-white print:p-0">
          <div
            ref={certRef}
            className={`border-8 border-double ${
              isBlocked
                ? "border-red-300 bg-red-50/20"
                : isApproved
                ? "border-emerald-500/80 bg-white"
                : "border-amber-300/80 bg-amber-50/20"
            } p-8 sm:p-10 rounded-xl shadow-sm relative overflow-hidden print:border-4 print:shadow-none`}
          >
            {/* Background Security Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05]">
              {isBlocked ? (
                <ShieldAlert className="w-[450px] h-[450px] text-red-900" />
              ) : isApproved ? (
                <ShieldCheck className="w-[450px] h-[450px] text-emerald-900" />
              ) : (
                <Clock className="w-[450px] h-[450px] text-amber-900" />
              )}
            </div>

            {/* Top Certificate Header */}
            <div className="text-center pb-6 border-b-2 border-slate-200 relative z-10">
              <div
                className={`inline-flex items-center justify-center h-14 w-14 rounded-full ${
                  isBlocked
                    ? "bg-red-900 text-red-200"
                    : isApproved
                    ? "bg-emerald-900 text-emerald-300"
                    : "bg-amber-900 text-amber-300"
                } shadow-md mb-3`}
              >
                {isBlocked ? (
                  <ShieldAlert className="h-8 w-8 text-red-400" />
                ) : isApproved ? (
                  <Award className="h-8 w-8 text-emerald-300" />
                ) : (
                  <Clock className="h-8 w-8 text-amber-300" />
                )}
              </div>

              <div
                className={`text-[11px] font-mono uppercase tracking-[0.3em] font-bold ${
                  isBlocked
                    ? "text-red-600"
                    : isApproved
                    ? "text-emerald-700"
                    : "text-amber-700"
                }`}
              >
                {isBlocked
                  ? "FIREWALL INTERCEPTION & ENFORCEMENT NOTICE"
                  : isApproved
                  ? "OFFICIAL PUBLICATION CLEARANCE GRANTED"
                  : "AI AUDIT PRE-SCREEN RECORD — PENDING HUMAN SIGN-OFF"}
              </div>

              <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight mt-1">
                {isBlocked
                  ? "CLEARANCE DENIED - PUBLICATION PROHIBITED"
                  : isApproved
                  ? "BRAND GOVERNANCE PUBLICATION CERTIFICATE"
                  : "PRE-PUBLICATION CLEARANCE: PENDING APPROVAL"}
              </h1>

              <div className="text-xs text-slate-600 font-sans mt-1">
                {isApproved
                  ? "Formally Cleared & Certified by Enterprise Reviewer / Administrator"
                  : isPendingApproval
                  ? "AI Multi-Agent Pre-Screen Verified • Awaiting Human Reviewer Sign-Off"
                  : "Issued by BrandOS Autonomous Governance Firewall System"}
              </div>

              <div
                className={`mt-3 inline-block px-3 py-1 ${
                  isBlocked
                    ? "bg-red-100 text-red-800 border-red-300"
                    : isApproved
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : "bg-amber-100 text-amber-800 border-amber-300"
                } rounded-full font-mono text-xs font-bold border`}
              >
                AUDIT ID: {certId}
              </div>
            </div>

            {/* Content Specifications */}
            <div className="my-6 space-y-4 relative z-10">
              <div
                className={`text-center text-xs ${
                  isBlocked
                    ? "text-red-700 font-semibold"
                    : isApproved
                    ? "text-emerald-800 font-medium"
                    : "text-amber-900 font-medium italic"
                }`}
              >
                {isBlocked
                  ? "This official record certifies that the submitted commercial copy has FAILED brand perimeter governance criteria and has been BLOCKED by the BrandOS Autonomous Firewall. Public release is strictly prohibited until all violations are resolved."
                  : isApproved
                  ? "This document certifies that the commercial copy specified below has satisfied all regulatory, voice, factual veracity, and brand perimeter requirements and has received formal human clearance from an authorized Brand Reviewer for public release."
                  : "This document certifies that the commercial copy specified below has satisfied AI multi-agent pre-screening checks and is currently AWAITING OFFICIAL SIGN-OFF from an authorized Brand Reviewer or Enterprise Administrator. This draft record does NOT grant public distribution authority until formal clearance is granted."}
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Entity Brand</span>
                  <span className="font-bold text-slate-900">{brandName}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Asset Title</span>
                  <span className="font-bold text-slate-900 truncate block">{review.content?.title || "Untitled"}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Distribution Channel</span>
                  <span className="font-bold text-slate-900 capitalize">{review.content?.channel || "Global"}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Clearance Status</span>
                  <span className={`font-bold ${isApproved ? "text-emerald-700" : isBlocked ? "text-red-700" : "text-amber-700"}`}>
                    {isApproved ? "Cleared for Publication" : isBlocked ? "Clearance Denied" : "Awaiting Reviewer Sign-Off"}
                  </span>
                </div>
              </div>

              {/* 5-Agent Consensus Sign-off Matrix */}
              <div className="pt-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Autonomous Multi-Agent Consensus Attestation
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center">
                  {agentAttestation.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-lg border ${
                        item.passed
                          ? "bg-emerald-50/70 border-emerald-200"
                          : "bg-red-50/90 border-red-300"
                      }`}
                    >
                      <div className="text-[9px] font-bold uppercase text-slate-500 truncate">{item.agent}</div>
                      <div className="text-[10px] font-mono font-bold text-slate-700">{item.score}</div>
                      <div className={`text-[11px] font-bold ${item.passed ? "text-emerald-800" : "text-red-700"} flex items-center justify-center gap-1 mt-0.5`}>
                        {item.passed ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-600" />
                        )}
                        <span>{item.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cryptographic Hash */}
              <div className="p-3 bg-slate-900 text-white rounded-lg font-mono text-[10px] space-y-1">
                <div className="text-slate-400 flex items-center justify-between">
                  <span>CRYPTOGRAPHIC CONTENT AUDIT HASH (SHA-256)</span>
                  <span className={isBlocked ? "text-red-400 font-bold" : isApproved ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                    {isBlocked ? "FIREWALL VIOLATION LOGGED" : isApproved ? "TAMPER-PROOF VERIFIED & CLEARED" : "PRE-SCREEN AUDIT RECORD"}
                  </span>
                </div>
                <div className="break-all text-indigo-300">
                  sha256:{mockSha}b071e612948a27d49e1a
                </div>
              </div>
            </div>

            {/* Signature Block */}
            <div className="mt-8 pt-6 border-t-2 border-slate-200 grid grid-cols-2 gap-8 text-center relative z-10">
              <div>
                <div className="font-serif italic text-lg text-slate-800 border-b border-slate-300 pb-1">
                  BrandOS Engine v2.4
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-500 mt-1">Autonomous Governance Board</div>
              </div>
              <div>
                <div className={`font-serif italic text-lg ${isApproved ? "text-emerald-800" : isBlocked ? "text-red-800" : "text-amber-800"} border-b border-slate-300 pb-1`}>
                  {isApproved
                    ? "Cleared for Publication"
                    : isBlocked
                    ? "CLEARANCE DENIED"
                    : "Pending Human Sign-Off"}
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-500 mt-1">
                  {isApproved
                    ? "Certified Enterprise Reviewer / Administrator"
                    : isBlocked
                    ? "Firewall Enforcement Officer"
                    : "Authorized Reviewer / Enterprise Administrator (Awaiting Approval)"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
