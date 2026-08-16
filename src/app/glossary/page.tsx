"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GLOSSARY } from "@/data/glossary";
import { cn } from "@/lib/utils";
import { Badge, card } from "@/components/common/ui";

export default function GlossaryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-400">Loading glossary…</div>}>
      <GlossaryInner />
    </Suspense>
  );
}

function GlossaryInner() {
  const sp = useSearchParams();
  const [query, setQuery] = useState(sp.get("q") ?? "");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GLOSSARY;
    return GLOSSARY.filter((g) => `${g.term} ${g.definition} ${g.simple} ${g.related.join(" ")}`.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">📖 Glossary</h1>
      <p className="mt-1 text-slate-500 dark:text-slate-400">Searchable definitions with a plain-English explanation and related concepts.</p>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search a term… e.g. context switch"
        className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        aria-label="Search glossary"
      />

      <p className="mt-3 text-xs text-slate-400">{filtered.length} term{filtered.length === 1 ? "" : "s"}</p>

      <div className="mt-3 grid gap-2">
        {filtered.map((g) => {
          const isOpen = expanded === g.term;
          return (
            <div key={g.term} className={cn(card, "overflow-hidden")}>
              <button type="button" onClick={() => setExpanded(isOpen ? null : g.term)} className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left" aria-expanded={isOpen}>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{g.term}</span>
                <span className="text-slate-400" aria-hidden>{isOpen ? "▴" : "▾"}</span>
              </button>
              {isOpen ? (
                <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
                  <p className="text-sm text-slate-700 dark:text-slate-300">{g.definition}</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400"><strong>In simple terms:</strong> {g.simple}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {g.related.map((r) => (
                      <button key={r} type="button" onClick={() => setQuery(r)} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20">
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No terms match “{query}”.</p>
        ) : null}
      </div>
    </div>
  );
}
