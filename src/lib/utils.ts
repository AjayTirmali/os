import type { StepEvent } from "@/engine/scheduling";

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Round to at most 2 decimals and drop trailing zeros. */
export function fmt(n: number | null | undefined, digits = 2): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const rounded = Number(n.toFixed(digits));
  return String(rounded);
}

export function pct(n: number): string {
  return `${fmt(n, 1)}%`;
}

export interface ProcessColor {
  hex: string;
  chip: string;
  dot: string;
}

const PALETTE: { hex: string; chip: string; dot: string }[] = [
  { hex: "#6366f1", chip: "bg-indigo-500 text-white", dot: "bg-indigo-500" },
  { hex: "#10b981", chip: "bg-emerald-500 text-white", dot: "bg-emerald-500" },
  { hex: "#f59e0b", chip: "bg-amber-500 text-slate-900", dot: "bg-amber-500" },
  { hex: "#f43f5e", chip: "bg-rose-500 text-white", dot: "bg-rose-500" },
  { hex: "#06b6d4", chip: "bg-cyan-500 text-slate-900", dot: "bg-cyan-500" },
  { hex: "#8b5cf6", chip: "bg-violet-500 text-white", dot: "bg-violet-500" },
  { hex: "#84cc16", chip: "bg-lime-500 text-slate-900", dot: "bg-lime-500" },
  { hex: "#0ea5e9", chip: "bg-sky-500 text-white", dot: "bg-sky-500" },
];

export function processColor(id: string): ProcessColor {
  const digits = id.replace(/\D/g, "");
  let idx: number;
  if (digits.length) {
    idx = (parseInt(digits, 10) - 1) % PALETTE.length;
  } else {
    idx = (id.charCodeAt(0) + id.length) % PALETTE.length;
  }
  return PALETTE[Math.abs(idx) % PALETTE.length];
}

export const EVENT_META: Record<StepEvent, { label: string; cls: string }> = {
  ARRIVAL: { label: "Arrival", cls: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-400/40" },
  DISPATCH: { label: "Dispatch", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/40" },
  PREEMPT: { label: "Preempt", cls: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-400/40" },
  COMPLETION: { label: "Completion", cls: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-400/40" },
  QUANTUM_EXPIRED: { label: "Quantum expired", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/40" },
  IDLE: { label: "CPU idle", cls: "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-400/40" },
  PROMOTED: { label: "Promoted", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/40" },
  DEMOTED: { label: "Demoted", cls: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-400/40" },
  AGING: { label: "Aging", cls: "bg-lime-500/15 text-lime-700 dark:text-lime-300 border-lime-400/40" },
};
