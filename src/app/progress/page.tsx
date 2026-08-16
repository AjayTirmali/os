"use client";

import Link from "next/link";
import { SECTIONS, TOPICS } from "@/data/curriculum";
import { getLesson } from "@/data/lessons";
import { QUIZZES } from "@/data/quizzes";
import { useProgress } from "@/lib/providers";
import { cn, fmt } from "@/lib/utils";
import { Badge, Button, card } from "@/components/common/ui";

export default function ProgressPage() {
  const { progress, resetProgress } = useProgress();
  const completed = progress.completedTopics.length;
  const pct = TOPICS.length ? Math.round((completed / TOPICS.length) * 100) : 0;

  const quizScores = Object.values(progress.quizScores);
  const quizAvg = quizScores.length ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">📈 Progress</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Tracked locally in your browser — no account needed.</p>
        </div>
        <Button variant="danger" size="sm" onClick={() => { if (confirm("Reset all progress? This cannot be undone.")) resetProgress(); }}>
          Reset progress
        </Button>
      </header>

      <div className={cn(card, "p-6")}>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Unit 2 Progress</p>
        <div className="mt-2 flex items-end gap-2">
          <span className="text-4xl font-extrabold tabular-nums text-slate-900 dark:text-white">{pct}%</span>
          <span className="pb-1 text-sm text-slate-500 dark:text-slate-400">{completed} / {TOPICS.length} topics</span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
            <p className="text-xs text-slate-500 dark:text-slate-400">Quiz average</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{quizAvg === null ? "—" : `${quizAvg}%`}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
            <p className="text-xs text-slate-500 dark:text-slate-400">Simulation runs</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{progress.simulatorUsage}</p>
          </div>
        </div>
      </div>

      {/* Per-section breakdown */}
      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((s) => {
          const done = s.topics.filter((t) => progress.completedTopics.includes(t.id)).length;
          const spct = Math.round((done / s.topics.length) * 100);
          return (
            <div key={s.id} className={cn(card, "p-4")}>
              <div className="flex items-center gap-2">
                <span aria-hidden>{s.icon}</span>
                <p className="font-semibold text-slate-800 dark:text-slate-100">{s.title}</p>
                <Badge tone="slate" className="ml-auto">{done}/{s.topics.length}</Badge>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${spct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quiz scores */}
      <div className={cn(card, "p-5")}>
        <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">Quiz scores</h2>
        {QUIZZES.some((q) => progress.quizScores[q.id] !== undefined) ? (
          <div className="space-y-2">
            {QUIZZES.map((q) => {
              const score = progress.quizScores[q.id];
              if (score === undefined) return null;
              return (
                <div key={q.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
                  <span className="text-sm text-slate-700 dark:text-slate-200">{q.title}</span>
                  <Badge tone={score >= 80 ? "emerald" : score >= 50 ? "amber" : "rose"}>{score}%</Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No quizzes taken yet. <Link href="/quiz" className="text-indigo-600 underline dark:text-indigo-300">Try one →</Link>
          </p>
        )}
      </div>

      {/* Completed topics */}
      <div className={cn(card, "p-5")}>
        <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">Completed topics ({completed})</h2>
        {completed ? (
          <div className="flex flex-wrap gap-1.5">
            {progress.completedTopics.map((id) => {
              const lesson = getLesson(id);
              return lesson ? (
                <Link key={id} href={`/topics/${id}`} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20">
                  ✓ {lesson.title}
                </Link>
              ) : null;
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">Nothing completed yet — start with the <Link href="/topics/process-concept" className="text-indigo-600 underline dark:text-indigo-300">Process Concept</Link>.</p>
        )}
      </div>
    </div>
  );
}
