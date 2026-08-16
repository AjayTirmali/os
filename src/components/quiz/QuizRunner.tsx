"use client";

import { useMemo, useState } from "react";
import type { Quiz } from "@/data/types";
import { useProgress } from "@/lib/providers";
import { cn } from "@/lib/utils";
import { Badge, Button, Callout, card } from "@/components/common/ui";

export function QuizRunner({ quiz }: { quiz: Quiz }) {
  const { recordQuizScore } = useProgress();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = quiz.questions[index];
  const total = quiz.questions.length;
  const progressPct = useMemo(() => Math.round((index / total) * 100), [index, total]);

  const choose = (i: number) => {
    if (checked) return;
    setSelected(i);
  };

  const check = () => {
    if (selected === null || checked) return;
    setChecked(true);
    if (selected === q.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (index + 1 >= total) {
      const pct = Math.round((score / total) * 100);
      recordQuizScore(quiz.id, pct);
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setChecked(false);
  };

  const restart = () => {
    setIndex(0);
    setSelected(null);
    setChecked(false);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    const pct = Math.round((score / total) * 100);
    return (
      <div className={cn(card, "p-6 text-center")}>
        <p className="text-3xl" aria-hidden>{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "📘"}</p>
        <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">Quiz complete</h3>
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          You scored <strong>{score} / {total}</strong> ({pct}%).
        </p>
        <div className="mx-auto mt-3 h-2 w-48 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-5 flex justify-center gap-2">
          <Button variant="secondary" onClick={restart}>Retry quiz</Button>
        </div>
        <p className="mt-3 text-xs text-slate-400">Your score is saved to your progress.</p>
      </div>
    );
  }

  return (
    <div className={cn(card, "p-5")}>
      <div className="mb-4 flex items-center gap-3">
        <Badge tone="indigo">Question {index + 1} / {total}</Badge>
        <Badge tone={q.type === "calc" ? "amber" : q.type === "scenario" ? "sky" : q.type === "tf" ? "rose" : "emerald"}>
          {q.type === "mcq" ? "Multiple choice" : q.type === "tf" ? "True / False" : q.type === "calc" ? "Calculation" : "Scenario"}
        </Badge>
        <div className="ml-auto h-2 w-32 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <p className="text-base font-medium text-slate-800 dark:text-slate-100">{q.question}</p>

      <div className="mt-4 space-y-2">
        {q.options?.map((opt, i) => {
          const isAnswer = checked && i === q.answer;
          const isWrongPick = checked && selected === i && i !== q.answer;
          return (
            <button
              key={i}
              type="button"
              onClick={() => choose(i)}
              disabled={checked}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                isAnswer
                  ? "border-emerald-400 bg-emerald-50 dark:border-emerald-500/50 dark:bg-emerald-500/10"
                  : isWrongPick
                    ? "border-rose-400 bg-rose-50 dark:border-rose-500/50 dark:bg-rose-500/10"
                    : selected === i
                      ? "border-indigo-400 bg-indigo-50 dark:border-indigo-500/50 dark:bg-indigo-500/10"
                      : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50",
              )}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-slate-700 dark:text-slate-200">{opt}</span>
            </button>
          );
        })}
      </div>

      {checked ? (
        <div className="mt-4">
          <Callout tone={selected === q.answer ? "tip" : "warn"} title={selected === q.answer ? "Correct!" : "Not quite."}>
            {q.explanation}
          </Callout>
          {q.formula ? (
            <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 font-mono text-sm text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
              {q.formula}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex justify-end gap-2">
        {!checked ? (
          <Button onClick={check} disabled={selected === null}>Check Answer</Button>
        ) : (
          <Button onClick={next}>{index + 1 >= total ? "See results" : "Next question →"}</Button>
        )}
      </div>
    </div>
  );
}
