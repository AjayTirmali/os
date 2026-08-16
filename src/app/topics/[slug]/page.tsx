"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getLesson } from "@/data/lessons";
import { getTopicNav } from "@/data/curriculum";
import { useProgress } from "@/lib/providers";
import { cn } from "@/lib/utils";
import {
  Badge,
  Button,
  ButtonLink,
  Callout,
  DefinitionCard,
  DifferenceTable,
  FormulaBlock,
  KeyPoints,
  card,
} from "@/components/common/ui";
import { VisualizerRouter } from "@/components/visualization/VisualizerRouter";

export default function TopicPage() {
  const { slug } = useParams<{ slug: string }>();
  const lesson = getLesson(slug);
  const nav = getTopicNav(slug);
  const { progress, markComplete, markIncomplete, visitTopic } = useProgress();
  const [examMode, setExamMode] = useState(false);

  useEffect(() => {
    if (lesson) visitTopic(lesson.id);
  }, [lesson, visitTopic]);

  const completed = progress.completedTopics.includes(slug);

  const content = useMemo(() => {
    if (!lesson) return null;
    return lesson;
  }, [lesson]);

  if (!content) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className={cn(card, "p-8 text-center")}>
          <p className="text-3xl" aria-hidden>🔍</p>
          <h1 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">Topic not found</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">We couldn&apos;t find a topic with id “{slug}”.</p>
          <div className="mt-4">
            <ButtonLink href="/unit">View the roadmap →</ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-4xl">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
        <Link href="/" className="hover:text-indigo-500">Dashboard</Link>
        <span aria-hidden>›</span>
        <Link href={`/topics/${nav.section.topics[0].id}`} className="hover:text-indigo-500">{nav.section.title}</Link>
        <span aria-hidden>›</span>
        <span className="text-slate-600 dark:text-slate-300">{content.title}</span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge tone="indigo">{nav.section.title}</Badge>
            <span className="text-xs text-slate-400">
              Topic {nav.index} of {nav.total}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{content.title}</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">{content.shortDescription}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExamMode((m) => !m)}
            className={cn("rounded-lg px-3 py-2 text-xs font-semibold transition-colors", examMode ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300")}
          >
            {examMode ? "📝 Exam Mode" : "📖 Learning Mode"}
          </button>
          <Button variant={completed ? "secondary" : "primary"} size="sm" onClick={() => (completed ? markIncomplete(content.id) : markComplete(content.id))}>
            {completed ? "✓ Completed" : "Mark complete"}
          </Button>
        </div>
      </div>

      <div className="space-y-5">
        <DefinitionCard>{content.definition}</DefinitionCard>

        {!examMode ? (
          <>
            <Section label="Why does this matter?" icon="🎯">
              <p className="text-slate-700 dark:text-slate-300">{content.whyItMatters}</p>
            </Section>

            <Section label="Simple explanation" icon="💬" tone="sky">
              <p className="text-slate-700 dark:text-slate-300">{content.simple}</p>
            </Section>

            <Section label="Technical explanation" icon="🧩" tone="violet">
              <p className="text-slate-700 dark:text-slate-300">{content.technical}</p>
            </Section>

            <Section label="What is happening internally?" icon="⚙️" tone="violet">
              <Callout tone="internal" title="Under the hood">
                {content.internal}
              </Callout>
            </Section>
          </>
        ) : null}

        {content.visualizer ? (
          <Section label="Interactive visualization" icon="🎬">
            <VisualizerRouter id={content.visualizer} />
          </Section>
        ) : null}

        {content.formulas?.length ? (
          <Section label="Formulas" icon="🧮">
            <div className="grid gap-3 sm:grid-cols-2">
              {content.formulas.map((f) => (
                <FormulaBlock key={f.name} formula={f} />
              ))}
            </div>
          </Section>
        ) : null}

        {content.differences ? (
          <Section label="Compare" icon="⚖️">
            <DifferenceTable data={content.differences} />
          </Section>
        ) : null}

        <Section label="Key points" icon="🔑">
          <KeyPoints items={content.keyPoints} />
        </Section>

        {content.labAlgorithm ? (
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-500/40 dark:bg-indigo-500/10">
            <p className="font-semibold text-indigo-800 dark:text-indigo-200">Try it in the Algorithm Lab 🧪</p>
            <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-300">
              Run this algorithm on real process sets and step through every scheduling decision.
            </p>
            <div className="mt-3">
              <ButtonLink href={`/lab?algo=${content.labAlgorithm}`}>Open the lab →</ButtonLink>
            </div>
          </div>
        ) : null}

        {!examMode ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <Section label="Common mistakes" icon="⚠️" tone="rose">
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {content.commonMistakes.map((m, i) => (
                  <li key={i} className="flex gap-2">
                    <span aria-hidden>✗</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </Section>
            <Section label="Exam tips" icon="🎓" tone="emerald">
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {content.examTips.map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <span aria-hidden>💡</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        ) : null}
      </div>

      {/* Prev / Next */}
      <nav className="mt-8 grid gap-3 sm:grid-cols-2" aria-label="Topic navigation">
        {nav.prev ? (
          <Link href={`/topics/${nav.prev.id}`} className={cn(card, "group p-4 hover:border-indigo-300 dark:hover:border-indigo-500/50")}>
            <p className="text-xs text-slate-400">← Previous topic</p>
            <p className="font-semibold text-slate-800 group-hover:text-indigo-600 dark:text-slate-100">{nav.prev.title}</p>
          </Link>
        ) : <span />}
        {nav.next ? (
          <Link href={`/topics/${nav.next.id}`} className={cn(card, "group p-4 text-right hover:border-indigo-300 dark:hover:border-indigo-500/50")}>
            <p className="text-xs text-slate-400">Next topic →</p>
            <p className="font-semibold text-slate-800 group-hover:text-indigo-600 dark:text-slate-100">{nav.next.title}</p>
          </Link>
        ) : null}
      </nav>
    </article>
  );
}

function Section({
  label,
  icon,
  tone = "slate",
  children,
}: {
  label: string;
  icon: string;
  tone?: "slate" | "sky" | "violet" | "rose" | "emerald";
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    slate: "text-slate-800 dark:text-slate-100",
    sky: "text-sky-800 dark:text-sky-200",
    violet: "text-violet-800 dark:text-violet-200",
    rose: "text-rose-800 dark:text-rose-200",
    emerald: "text-emerald-800 dark:text-emerald-200",
  };
  return (
    <section>
      <h2 className={cn("mb-2 flex items-center gap-2 text-lg font-semibold", tones[tone])}>
        <span aria-hidden>{icon}</span>
        {label}
      </h2>
      {children}
    </section>
  );
}
