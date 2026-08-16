"use client";

import { useState } from "react";
import { SECTIONS } from "@/data/curriculum";
import { getLesson } from "@/data/lessons";
import { cn } from "@/lib/utils";
import { Badge, ButtonLink, card } from "@/components/common/ui";

export default function RevisionPage() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">📚 Exam Revision</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Unit 2 — Last-Minute Revision. Everything you need, compressed. Tap a topic to expand its key facts.
        </p>
      </header>

      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
        <strong>Revision strategy:</strong> read each definition, memorize the formulas, and run the{" "}
        <ButtonLink href="/lab" variant="outline" size="sm" className="inline-flex h-auto px-2 py-0.5 text-xs">Algorithm Lab</ButtonLink> for
        FCFS / SJF / SRTF / RR — calculation questions come from those.
      </div>

      {SECTIONS.map((section) => (
        <div key={section.id} className="mb-6">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
            <span aria-hidden>{section.icon}</span> {section.title}
          </h2>
          <div className="space-y-2">
            {section.topics.map((t) => {
              const lesson = getLesson(t.id)!;
              const isOpen = open === t.id;
              return (
                <div key={t.id} className={cn(card, "overflow-hidden")}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : t.id)}
                    className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{lesson.title}</span>
                    <span className="text-slate-400" aria-hidden>{isOpen ? "▴" : "▾"}</span>
                  </button>
                  {isOpen ? (
                    <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
                      <p className="text-sm text-slate-700 dark:text-slate-300"><strong>Definition:</strong> {lesson.definition}</p>
                      <ul className="mt-2 grid gap-1 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                        {lesson.keyPoints.map((k, i) => (
                          <li key={i} className="flex gap-1.5"><span className="text-emerald-500" aria-hidden>✓</span><span>{k}</span></li>
                        ))}
                      </ul>
                      {lesson.formulas?.length ? (
                        <div className="mt-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
                          {lesson.formulas.map((f) => (
                            <p key={f.name} className="font-mono text-sm text-indigo-600 dark:text-indigo-300">{f.expression}</p>
                          ))}
                        </div>
                      ) : null}
                      {lesson.examTips.length ? (
                        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                          <strong>Exam tip:</strong> {lesson.examTips[0]}
                        </p>
                      ) : null}
                      <div className="mt-3 flex gap-2">
                        <ButtonLink href={`/topics/${lesson.id}`} variant="outline" size="sm">Full lesson →</ButtonLink>
                        {lesson.labAlgorithm ? <ButtonLink href={`/lab?algo=${lesson.labAlgorithm}`} variant="outline" size="sm">Run in lab</ButtonLink> : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
