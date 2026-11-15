"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plus, Shield, Leaf, FileText, ChevronDown, Lock, Globe, Building2, LogOut, User, Check } from "lucide-react";
import { useBrand } from "@/context/BrandContext";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    activeBrand,
    brandConfig,
    currentRole,
    currentUser,
    brandUsers,
    switchUser,
    logout,
    setIsBrandModalOpen,
    setIsRegisterModalOpen,
    canEditBrandBrain,
    canSubmitReviews,
  } = useBrand();

  const isSuperAdmin = pathname.startsWith("/superadmin") || currentRole === "superadmin";
  const isSolaria = !isSuperAdmin && activeBrand === "solaria";

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Brand & Workspace Status Indicator (Static) */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 shadow-2xs">
          <div className={cn(
            "h-4 w-4 rounded-md flex items-center justify-center text-white shrink-0",
            isSuperAdmin ? "bg-purple-700" : isSolaria ? "bg-emerald-600" : "bg-indigo-600"
          )}>
            {isSuperAdmin ? <Globe className="h-3 w-3" /> : isSolaria ? <Leaf className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
          </div>
          <span>{isSuperAdmin ? "Master SuperAdmin Console" : brandConfig.name}</span>
        </div>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center gap-3">
        {isSuperAdmin ? (
          <>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border bg-purple-50 border-purple-200 text-purple-800">
              <span>Superadmin</span>
            </span>

            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-white text-xs font-semibold shadow-sm transition-colors bg-purple-700 hover:bg-purple-800"
            >
              <Plus className="h-4 w-4" />
              <span>Onboard New Brand</span>
            </button>

            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-rose-200 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-xs font-semibold transition-colors"
              title="Log out of SuperAdmin"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log Out</span>
            </button>
          </>
        ) : (
          <>
            {/* Official Brand Guidelines PDF Download */}
            <a
              href={brandConfig.pdfDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
              title={`Download official brand guidelines for ${brandConfig.name}`}
            >
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              <span>Identity PDF</span>
            </a>

            {/* User Profile & Role Quick Switcher Dropdown */}
            <div className="relative group">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-2xs hover:opacity-95"
                style={{
                  backgroundColor: currentRole === "admin" ? "#EEF2FF" : currentRole === "reviewer" ? "#FEF3C7" : "#F0F9FF",
                  borderColor: currentRole === "admin" ? "#C7D2FE" : currentRole === "reviewer" ? "#FDE68A" : "#BAE6FD",
                  color: currentRole === "admin" ? "#3730A3" : currentRole === "reviewer" ? "#92400E" : "#0369A1",
                }}
                title={`Active: ${currentUser?.name} (${currentRole.toUpperCase()}). Click or hover to switch profile/role.`}
              >
                <div
                  className="h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] text-white shrink-0 shadow-xs"
                  style={{
                    backgroundColor: currentRole === "admin" ? "#4F46E5" : currentRole === "reviewer" ? "#D97706" : "#0284C7"
                  }}
                >
                  {currentUser?.name?.slice(0, 2).toUpperCase() || "US"}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="font-bold">{currentUser?.name}</span>
                  <span className="text-[10px] opacity-75 capitalize ml-1.5">({currentRole})</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>

              <div className="absolute right-0 top-full mt-1.5 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 hidden group-hover:block z-50 animate-in fade-in">
                {/* Active Profile Header */}
                <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/70">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Authenticated Identity
                  </div>
                  <div className="font-bold text-slate-900 text-xs mt-0.5 truncate">{currentUser?.name}</div>
                  <div className="text-[11px] text-slate-500 truncate">{currentUser?.email}</div>
                  <div className="text-[10px] text-slate-600 font-medium truncate mt-0.5">{currentUser?.title}</div>
                </div>

                {/* Switch Profile (Team Roster) Section */}
                <div className="px-3 pt-2.5 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Profile ({brandConfig.name})
                </div>
                <div className="max-h-60 overflow-y-auto space-y-0.5 px-1.5">
                  {brandUsers.map((u) => {
                    const isSelected = u.email === currentUser.email;
                    return (
                      <button
                        key={u.email}
                        type="button"
                        onClick={() => {
                          switchUser(u);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between hover:bg-slate-100 transition-colors cursor-pointer ${
                          isSelected ? "bg-indigo-50/80 font-bold text-indigo-900" : "text-slate-700"
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
                        {isSelected && (
                          <span className="text-[10px] text-emerald-600 font-bold shrink-0 ml-1">✓ Active</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* New Review CTA */}
            {canSubmitReviews ? (
              <Link
                href="/reviews/new"
                className={cn(
                  "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-white text-xs font-semibold shadow-sm transition-colors",
                  isSolaria ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700"
                )}
              >
                <Plus className="h-4 w-4" />
                <span>New Review</span>
              </Link>
            ) : (
              <span
                title={`Draft submission is disabled for ${currentRole}s by Brand Admin in Settings`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-400 text-xs font-semibold cursor-not-allowed opacity-80"
              >
                <Lock className="h-3.5 w-3.5 text-slate-400" />
                <span>Drafting Restricted</span>
              </span>
            )}

            {/* Log Out CTA */}
            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-rose-200 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-xs font-semibold transition-colors"
              title="Log out of this brand workspace"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
