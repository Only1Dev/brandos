import Link from "next/link";
import { Shield, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-5">
        <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400 shadow-inner">
          <Shield className="h-7 w-7" />
        </div>

        <div className="space-y-1.5">
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
            404
          </div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Page Not Found within Brand Boundary
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            The requested resource does not exist or has been relocated outside the current governance boundary.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Go to Dashboard</span>
          </Link>
          <Link
            href="/reviews"
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all flex items-center gap-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Reviews</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
