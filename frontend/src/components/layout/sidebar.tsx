"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldCheck,
  FileText,
  BookOpen,
  Database,
  FileCheck2,
  Tag,
  Palette,
  BarChart3,
  History,
  Settings,
  ChevronRight,
  ShieldAlert,
  Shield,
  Leaf,
  Globe,
  RefreshCw,
  Brain,
  Building2,
  Lock,
  Compass,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useBrand } from "@/context/BrandContext";

const brandNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Reviews", href: "/reviews", icon: ShieldCheck, badge: "BrandFlow" },
  { name: "Content", href: "/content", icon: FileText },
  {
    name: "AI Brand Brain",
    icon: Brain,
    badge: "Core",
    children: [
      { name: "Guidelines & Rules", href: "/knowledge/guidelines", icon: BookOpen },
      { name: "Approved Facts", href: "/knowledge/facts", icon: Database },
      { name: "Claims Lifecycle", href: "/knowledge/claims", icon: FileCheck2 },
      { name: "Terminology", href: "/knowledge/terminology", icon: Tag },
      { name: "Assets & Logos", href: "/knowledge/assets", icon: Palette },
    ],
  },
  { name: "Governance Analytics", href: "/analytics", icon: BarChart3, badge: "BrandPulse" },
  { name: "Audit Trail", href: "/audit", icon: History },
  { name: "Settings", href: "/settings", icon: Settings },
];

const superAdminNavigation = [
  { name: "Master Console", href: "/superadmin", icon: Globe, badge: "Global" },
  { name: "Governance Analytics", href: "/analytics", icon: BarChart3, badge: "BrandPulse" },
  { name: "Global Audit Trail", href: "/audit", icon: History },
  { name: "System Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [knowledgeOpen, setKnowledgeOpen] = useState(true);
  const {
    activeBrand,
    brandConfig,
    currentRole,
    currentUser,
    canEditBrandBrain,
    setIsJudgeModalOpen,
  } = useBrand();

  const isSuperAdmin = pathname.startsWith("/superadmin") || currentRole === "superadmin";
  const isSolaria = !isSuperAdmin && activeBrand === "solaria";

  const navigation = isSuperAdmin ? superAdminNavigation : brandNavigation;

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between select-none">
      <div>
        {/* BrandOS Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold shadow-md",
              isSuperAdmin
                ? "bg-gradient-to-tr from-purple-700 to-indigo-600 shadow-purple-500/20"
                : isSolaria
                ? "bg-emerald-600 shadow-emerald-500/20"
                : "bg-indigo-600 shadow-indigo-500/20"
            )}>
              {isSuperAdmin ? <Globe className="h-5 w-5" /> : isSolaria ? <Leaf className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
            </div>
            <div>
              <div className="font-bold text-white tracking-tight flex items-center gap-1.5 text-sm">
                BrandOS <span className="text-[10px] bg-indigo-500/20 text-indigo-400 font-semibold px-1.5 py-0.5 rounded border border-indigo-500/30">Enterprise</span>
              </div>
              <div className="text-[11px] text-slate-400 tracking-tight">
                {isSuperAdmin ? "Global Governance Layer" : "Pre-Publication Firewall"}
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Organization Indicator (Locked Perimeter) */}
        <div className="p-3 mx-3 my-3 bg-slate-800/60 rounded-xl border border-slate-700/50 shadow-xs">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            {isSuperAdmin ? "System Scope" : "Active Workspace"}
          </div>
          <div className="w-full text-left font-semibold text-white text-xs truncate flex items-center gap-2 p-1">
            <span className={cn(
              "h-2 w-2 rounded-full shrink-0 animate-pulse",
              isSuperAdmin ? "bg-purple-400" : isSolaria ? "bg-emerald-400" : "bg-indigo-400"
            )} />
            <span className="truncate">
              {isSuperAdmin ? "All Brand Workspaces" : brandConfig.name}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="px-3 space-y-1">
          {navigation.map((item: any) => {
            if (item.children) {
              const isChildActive = item.children.some((c: any) => pathname.startsWith(c.href));
              return (
                <div key={item.name} className="space-y-1">
                  <button
                    onClick={() => setKnowledgeOpen(!knowledgeOpen)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors",
                      isChildActive ? "text-white bg-slate-800/80" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn("h-4 w-4", isSolaria ? "text-emerald-400" : "text-indigo-400")} />
                      <span>{item.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span className={cn(
                          "text-[9px] font-bold px-1.5 py-0.2 rounded border",
                          isSolaria
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                        )}>
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", knowledgeOpen && "rotate-90")} />
                    </div>
                  </button>

                  {knowledgeOpen && (
                    <div className="pl-6 space-y-1">
                      {item.children.map((sub: any) => {
                        const active = pathname === sub.href;
                        return (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            className={cn(
                              "flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                              active
                                ? isSolaria
                                  ? "text-emerald-300 bg-emerald-950/50 font-bold"
                                  : "text-indigo-300 bg-indigo-950/50 font-bold"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                            )}
                          >
                            <sub.icon className="h-3.5 w-3.5" />
                            <span>{sub.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const active = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors",
                  active
                    ? isSuperAdmin
                      ? "text-white bg-purple-700 shadow-xs"
                      : isSolaria
                      ? "text-white bg-emerald-600 shadow-xs"
                      : "text-white bg-indigo-600 shadow-xs"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={cn(
                    "text-[9px] font-bold px-1.5 py-0.2 rounded border",
                    active
                      ? "bg-white/20 text-white border-white/30"
                      : item.badge === "Global"
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                      : isSolaria
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                  )}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Quick Judge Quickstart & Tour Launchers */}
      <div className="px-3 pt-2 space-y-1.5">
        <button
          type="button"
          onClick={() => setIsJudgeModalOpen(true)}
          className="w-full px-3 py-2 rounded-xl text-xs font-bold text-amber-300 hover:text-amber-100 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
            <span>Judge Quickstart</span>
          </div>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
            J
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("brandos:open-tour"));
          }}
          className="w-full px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all flex items-center justify-between group cursor-pointer border border-slate-800 hover:border-slate-700 shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <Compass className="h-3.5 w-3.5 text-indigo-400 group-hover:rotate-45 transition-transform duration-300" />
            <span>5-Step Tour</span>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Tour
          </span>
        </button>
      </div>

      {/* Authenticated Identity Footer (Read-Only Status) */}
      <div className="p-3 m-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Authenticated Identity
        </div>

        <div className="flex items-center justify-between p-1 rounded-lg">
          <div className="flex items-center gap-2.5 truncate">
            <div className={cn(
              "h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0",
              isSuperAdmin
                ? "bg-purple-600"
                : currentRole === "admin"
                ? isSolaria ? "bg-emerald-600" : "bg-indigo-600"
                : currentRole === "reviewer"
                ? "bg-amber-600"
                : "bg-sky-600"
            )}>
              {isSuperAdmin ? "SA" : currentUser?.name?.slice(0, 2).toUpperCase() || "US"}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-white leading-tight truncate">
                {isSuperAdmin ? "Chief Governance Officer" : currentUser?.name}
              </div>
              <div className="text-[10px] text-slate-400 capitalize leading-tight flex items-center gap-1 truncate">
                <span>{currentUser?.title || currentRole}</span>
                {!canEditBrandBrain && !isSuperAdmin && <Lock className="h-2.5 w-2.5 text-amber-400" />}
              </div>
            </div>
          </div>
          <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="Active Authenticated Session" />
        </div>
      </div>
    </aside>
  );
}
