import type { EventStatus } from "@/lib/validation/event";

export const statusBadgeClass: Record<EventStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  paused: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  ended: "bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400",
  undefined: "bg-slate-50 text-slate-400 dark:bg-slate-900/40 dark:text-slate-500",
};
