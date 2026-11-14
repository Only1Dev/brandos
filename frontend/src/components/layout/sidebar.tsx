"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  const router = useRouter();
  const [knowledgeOpen, setKnowledgeOpen] = useState(true);
  const {
    activeBrand,
    brandConfig,
    currentRole,
    currentUser,
    brandUsers,
    switchBrand,
    switchRole,
    switchUser,
    canEditBrandBrain,
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

        {/* Workspace Organization Switcher Dropdown */}
        <div className="relative group mx-3 my-3">
          <div className="p-3 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/50 hover:border-slate-600 shadow-xs transition-all cursor-pointer">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>{isSuperAdmin ? "System Scope" : "Active Workspace"}</span>
              <span className="text-[9px] text-indigo-400 group-hover:underline">Switch ▾</span>
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

          <div className="absolute left-0 top-full mt-1 w-full bg-slate-950 rounded-xl shadow-2xl border border-slate-700 py-1.5 hidden group-hover:block z-50 animate-in fade-in">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              Select Workspace
            </div>
            <button
              type="button"
              onClick={() => { switchBrand("solaria"); router.push("/dashboard"); }}
              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 cursor-pointer ${
                activeBrand === "solaria" && !isSuperAdmin ? "text-emerald-400 font-bold bg-emerald-950/40" : "text-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Leaf className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Solaria Wellness</span>
              </div>
              {activeBrand === "solaria" && !isSuperAdmin && <span className="text-[10px] text-emerald-400">✓</span>}
            </button>
            <button
              type="button"
              onClick={() => { switchBrand("aureon"); router.push("/dashboard"); }}
              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 cursor-pointer ${
                activeBrand === "aureon" && !isSuperAdmin ? "text-indigo-400 font-bold bg-indigo-950/40" : "text-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">Aureon Technologies</span>
              </div>
              {activeBrand === "aureon" && !isSuperAdmin && <span className="text-[10px] text-indigo-400">✓</span>}
            </button>
            <button
              type="button"
              onClick={() => router.push("/superadmin")}
              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 cursor-pointer border-t border-slate-800/80 ${
                isSuperAdmin ? "text-purple-400 font-bold bg-purple-950/40" : "text-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                <span className="truncate">SuperAdmin Console</span>
              </div>
              {isSuperAdmin && <span className="text-[10px] text-purple-400">✓</span>}
            </button>
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

      {/* Quick Interactive Tour Launcher */}
      <div className="px-3 pt-2">
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("brandos:open-tour"));
          }}
          className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all flex items-center justify-between group cursor-pointer border border-slate-800 hover:border-slate-700 shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <Compass className="h-4 w-4 text-indigo-400 group-hover:rotate-45 transition-transform duration-300" />
            <span>Interactive Tour</span>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            5 Steps
          </span>
        </button>
      </div>

      {/* Authenticated Identity Footer & Profile Switcher */}
      <div className="relative group p-0 m-3">
        <div className="p-3 bg-slate-950/80 hover:bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-all space-y-1.5 cursor-pointer">
          <div className="text-[10px] font-semibold text-slate-400 group-hover:text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Authenticated Identity</span>
            <span className="text-[9px] text-indigo-400 font-bold group-hover:underline">
              Switch Profile ▾
            </span>
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

        {/* Profile Roster Dropdown */}
        <div className="absolute left-0 right-0 bottom-full mb-1 bg-slate-950 rounded-xl shadow-2xl border border-slate-700 py-2 hidden group-hover:block z-50 animate-in fade-in">
          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            Switch Persona ({brandConfig.name})
          </div>
          <div className="max-h-56 overflow-y-auto space-y-0.5 px-1 py-1">
            {brandUsers.map((u) => {
              const isSelected = u.email === currentUser.email;
              return (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => {
                    switchUser(u);
                    switchRole(u.role);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between hover:bg-slate-800 transition-colors cursor-pointer ${
                    isSelected ? "bg-slate-800 font-bold text-white" : "text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <div className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white shrink-0",
                      u.role === "admin" ? "bg-indigo-600" : u.role === "reviewer" ? "bg-amber-600" : "bg-sky-600"
                    )}>
                      {u.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-xs leading-tight truncate">{u.name}</div>
                      <div className="text-[10px] text-slate-400 leading-tight truncate">{u.title}</div>
                    </div>
                  </div>
                  {isSelected && <span className="text-[10px] text-emerald-400 font-bold shrink-0 ml-1">✓</span>}
                </button>
              );
            })}
          </div>
          <div className="mt-1 pt-1 border-t border-slate-800 px-3">
            <Link
              href="/settings"
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center justify-between py-1"
            >
              <span>Manage Role Matrix in Settings</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
