import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr?: string | null) {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function getSeverityBadge(severity: string) {
  const s = severity?.toLowerCase();
  if (s === "critical" || s === "error") {
    return {
      bg: "bg-red-50 text-red-700 border-red-200",
      dot: "bg-red-600",
      label: "Critical",
    };
  }
  if (s === "high") {
    return {
      bg: "bg-amber-50 text-amber-700 border-amber-200",
      dot: "bg-amber-600",
      label: "High",
    };
  }
  if (s === "medium" || s === "warning") {
    return {
      bg: "bg-yellow-50 text-yellow-700 border-yellow-200",
      dot: "bg-yellow-500",
      label: "Medium",
    };
  }
  return {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    label: "Low",
  };
}

export function getStatusBadge(status: string) {
  const st = status?.toLowerCase();
  switch (st) {
    case "approved":
    case "pass":
      return "bg-emerald-100 text-emerald-800 border-emerald-300";
    case "pass_with_warnings":
      return "bg-amber-100 text-amber-800 border-amber-300";
    case "review_required":
    case "completed":
      return "bg-indigo-100 text-indigo-800 border-indigo-300";
    case "analyzing":
      return "bg-blue-100 text-blue-800 border-blue-300 animate-pulse";
    case "rejected":
    case "blocked":
      return "bg-red-100 text-red-800 border-red-300";
    default:
      return "bg-slate-100 text-slate-800 border-slate-300";
  }
}
