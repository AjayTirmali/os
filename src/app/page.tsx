"use client";

import Link from "next/link";
import { SECTIONS, TOPICS } from "@/data/curriculum";
import { LESSONS_BY_ID } from "@/data/lessons";
import { QUIZZES } from "@/data/quizzes";
import { useProgress } from "@/lib/providers";
import { cn, fmt } from "@/lib/utils";
import { Badge, ButtonLink, card } from "@/components/common/ui";

export default function DashboardPage() {
  const { progress } = useProgress();
  const completed = progress.completedTopics.length;
  const pct = TOPICS.length ? Math.round((completed / TOPICS.length) * 100) : 0;

  const quizScores = Object.values(progress.quizScores);
  const quizAvg = quizScores.length ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length) : null;

  const nextTopic = TOPICS.find((t) => !progress.completedTopics.includes(t.id));
  const lastTopic = progress.lastVisitedTopic ? LESSONS_BY_ID[progress.lastVisitedTopic] : undefined;
  const recent = progress.recentlyViewed
    .map((id) => LESSONS_BY_ID[id])
    .filter(Boolean)
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-8 text-white sm:p-12">
        <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <p className="text-sm font-medium uppercase tracking-widest text-indigo-200">Operating Systems · Unit 2</p>
        <h1 className="mt-2 max-w-2xl text-3xl font-extrabold leading-tight sm:text-5xl">
          Processes &amp; CPU Scheduling
        </h1>
        <p className="mt-3 max-w-xl text-lg text-indigo-100">
          Don&apos;t just learn how the OS works. <strong className="text-white">Watch it happen.</strong>
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href={nextTopic ? `/topics/${nextTopic.id}` : "/unit"} className="bg-white text-indigo-700 hover:bg-indigo-50">
            Start learning →
          </ButtonLink>
          <ButtonLink href="/lab" variant="outline" className="border-white/40 text-white hover:bg-white/10">
            🧪 Open Algorithm Lab
          </ButtonLink>
          <ButtonLink href="/playground" variant="outline" className="border-white/40 text-white hover:bg-white/10">
            🕹️ OS Playground
          </ButtonLink>
        </div>
      </section>

      {/* Progress summary */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className={cn(card, "p-5")}>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Unit progress</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">{pct}%</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{completed} / {TOPICS.length} topics completed</p>
        </div>
        <div className={cn(card, "p-5")}>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Quiz average</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">{quizAvg === null ? "—" : `${quizAvg}%`}</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{quizScores.length ? `${quizScores.length} quiz${quizScores.length > 1 ? "zes" : ""} taken` : "Take a quiz to see your average"}</p>
        </div>
        <div className={cn(card, "p-5")}>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Lab usage</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">{progress.simulatorUsage}</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">simulation runs so far</p>
        </div>
      </section>

      {/* Continue learning */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className={cn(card, "p-5")}>
          <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Continue learning</h2>
          {lastTopic ? (
            <Link href={`/topics/${lastTopic.id}`} className="group block rounded-xl border border-slate-200 p-4 transition-colors hover:border-indigo-300 dark:border-slate-700 dark:hover:border-indigo-500/50">
              <p className="text-xs text-slate-400">You were reading</p>
              <p className="mt-1 font-semibold text-slate-800 group-hover:text-indigo-600 dark:text-slate-100">{lastTopic.title}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{lastTopic.shortDescription}</p>
            </Link>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">You haven&apos;t read any topics yet. Start with the Process Concept.</p>
          )}
          {nextTopic ? (
            <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-500/40 dark:bg-indigo-500/10">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">Recommended next</p>
              <Link href={`/topics/${nextTopic.id}`} className="mt-1 block font-semibold text-indigo-700 hover:underline dark:text-indigo-200">
                {nextTopic.title} →
              </Link>
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/40 dark:bg-emerald-500/10">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">🎉 You&apos;ve completed every topic in Unit 2!</p>
            </div>
          )}
        </div>

        <div className={cn(card, "p-5")}>
          <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Recently viewed</h2>
          {recent.length ? (
            <ul className="space-y-1">
              {recent.map((lesson) => (
                <li key={lesson.id}>
                  <Link href={`/topics/${lesson.id}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50">
                    <span aria-hidden>📄</span> {lesson.title}
                    {progress.completedTopics.includes(lesson.id) ? <Badge tone="emerald" className="ml-auto">done</Badge> : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Topics you open will appear here.</p>
          )}
        </div>
      </section>

      {/* Quick access */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Explore</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/lab", icon: "🧪", title: "Algorithm Lab", desc: "Run & step through all 8 schedulers" },
            { href: "/playground", icon: "🕹️", title: "OS Playground", desc: "Free experimentation with every concept" },
            { href: "/quiz", icon: "❓", title: "Quizzes", desc: `${QUIZZES.length} topic quizzes with explanations` },
            { href: "/revision", icon: "📚", title: "Exam Revision", desc: "Last-minute Unit 2 summary" },
            { href: "/glossary", icon: "📖", title: "Glossary", desc: "Every term, defined simply" },
            { href: "/progress", icon: "📈", title: "Progress", desc: "Your learning dashboard" },
            { href: "/unit", icon: "🗺️", title: "Unit Overview", desc: "The visual roadmap" },
          ].map((c) => (
            <Link key={c.href} href={c.href} className={cn(card, "group p-4 transition-colors hover:border-indigo-300 dark:hover:border-indigo-500/50")}>
              <span className="text-2xl" aria-hidden>{c.icon}</span>
              <p className="mt-2 font-semibold text-slate-800 group-hover:text-indigo-600 dark:text-slate-100">{c.title}</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{c.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Section overview */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Unit sections</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {SECTIONS.map((s) => {
            const done = s.topics.filter((t) => progress.completedTopics.includes(t.id)).length;
            return (
              <Link key={s.id} href={`/topics/${s.topics[0].id}`} className={cn(card, "p-5 transition-colors hover:border-indigo-300 dark:hover:border-indigo-500/50")}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden>{s.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{s.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{s.topics.length} topics · {fmt((done / s.topics.length) * 100, 0)}% done</p>
                  </div>
                  <span className="text-slate-400">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
