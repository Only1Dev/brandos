"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plus, Shield, Leaf, FileText, Lock, Globe, LogOut } from "lucide-react";
import { useBrand } from "@/context/BrandContext";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    activeBrand,
    brandConfig,
    currentRole,
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
