"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { DifferenceTable as DifferenceTableData, Formula } from "@/data/types";

export const card = "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn(card, className)}>{children}</div>;
}

export function SectionTitle({
  icon,
  title,
  subtitle,
  className,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-4", className)}>
      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
        {icon ? <span aria-hidden>{icon}</span> : null}
        {title}
      </h2>
      {subtitle ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "slate",
  className,
}: {
  children: ReactNode;
  tone?: "slate" | "indigo" | "emerald" | "amber" | "rose" | "sky";
  className?: string;
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
    sky: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

export function Callout({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "tip" | "warn" | "internal";
  title?: string;
  children: ReactNode;
}) {
  const tones: Record<string, string> = {
    info: "border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-100",
    tip: "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100",
    warn: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100",
    internal: "border-violet-300 bg-violet-50 text-violet-900 dark:border-violet-500/40 dark:bg-violet-500/10 dark:text-violet-100",
  };
  const icons: Record<string, string> = { info: "ℹ️", tip: "💡", warn: "⚠️", internal: "⚙️" };
  return (
    <div className={cn("rounded-xl border p-4 text-sm leading-relaxed", tones[tone])}>
      <p className="mb-1 flex items-center gap-2 font-semibold">
        <span aria-hidden>{icons[tone]}</span>
        {title ?? "Note"}
      </p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export function DefinitionCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-500/40 dark:bg-indigo-500/10">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
        Quick Definition
      </p>
      <p className="text-base leading-relaxed text-slate-800 dark:text-slate-100">{children}</p>
    </div>
  );
}

export function FormulaBlock({ formula }: { formula: Formula }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{formula.name}</p>
      <p className="mt-1 font-mono text-base font-semibold text-indigo-600 dark:text-indigo-300">{formula.expression}</p>
      {formula.note ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formula.note}</p> : null}
    </div>
  );
}

export function DifferenceTable({ data }: { data: DifferenceTableData }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
        {data.title}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              {data.headers.map((h) => (
                <th key={h} className="px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                {row.map((cell, j) => (
                  <td key={j} className={cn("px-4 py-2 text-slate-600 dark:text-slate-300", j === 1 && "font-medium text-slate-800 dark:text-slate-100")}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "indigo",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "indigo" | "emerald" | "amber" | "rose" | "sky" | "slate";
}) {
  const tones: Record<string, string> = {
    indigo: "text-indigo-600 dark:text-indigo-300",
    emerald: "text-emerald-600 dark:text-emerald-300",
    amber: "text-amber-600 dark:text-amber-300",
    rose: "text-rose-600 dark:text-rose-300",
    sky: "text-sky-600 dark:text-sky-300",
    slate: "text-slate-700 dark:text-slate-200",
  };
  return (
    <div className={cn(card, "p-4")}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold tabular-nums", tones[tone])}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </div>
  );
}

export function KeyPoints({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <span className="mt-0.5 text-emerald-500" aria-hidden>
            ✓
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900/50">
      <p className="text-2xl" aria-hidden>🛰️</p>
      <p className="font-semibold text-slate-700 dark:text-slate-200">{title}</p>
      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {action}
    </div>
  );
}

const buttonVariants: Record<string, string> = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-indigo-300",
  secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
  danger: "bg-rose-600 text-white hover:bg-rose-500",
  outline: "border border-indigo-300 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-500/50 dark:text-indigo-300 dark:hover:bg-indigo-500/10",
};

const buttonSizes: Record<string, string> = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

export function buttonClasses(variant: keyof typeof buttonVariants = "primary", size: keyof typeof buttonSizes = "md") {
  return cn(
    "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60",
    buttonVariants[variant],
    buttonSizes[size],
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
}

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return <button className={cn(buttonClasses(variant, size), className)} {...props} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cn(buttonClasses(variant, size), className)}>
      {children}
    </Link>
  );
}
