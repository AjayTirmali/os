"use client";

import Link from "next/link";
import { useProgress } from "@/lib/providers";
import { cn } from "@/lib/utils";
import { card } from "@/components/common/ui";

const ROADMAP = [
  { label: "Process", sub: "What is a process?", topic: "process-concept" },
  { label: "Process States", sub: "New · Ready · Running · Waiting", topic: "process-states" },
  { label: "PCB", sub: "The kernel's record card", topic: "pcb" },
  { label: "Context Switch", sub: "How the CPU moves between processes", topic: "context-switching" },
  { label: "Scheduling Queues", sub: "Ready & waiting queues", topic: "scheduling-queues" },
  { label: "Threads", sub: "Lightweight execution units", topic: "thread-concept" },
  { label: "IPC", sub: "Shared memory & messages", topic: "ipc-concept" },
  { label: "CPU Scheduling", sub: "Criteria & algorithms", topic: "scheduling-criteria" },
  { label: "Algorithms", sub: "FCFS · SJF · SRTF · RR · MLFQ", topic: "fcfs" },
  { label: "Evaluation", sub: "Compare & choose", topic: "algorithm-evaluation" },
];

export default function UnitOverviewPage() {
  const { progress } = useProgress();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Unit 2 — Visual Roadmap</h1>
      <p className="mt-1 text-slate-500 dark:text-slate-400">
        Follow the journey from a program on disk to a fully scheduled, running system. Every node is clickable.
      </p>

      <div className="mt-8 space-y-0">
        {ROADMAP.map((node, i) => {
          const done = progress.completedTopics.includes(node.topic);
          return (
            <div key={node.topic}>
              <Link
                href={`/topics/${node.topic}`}
                className={cn(
                  "group relative flex items-center gap-4 rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md",
                  done
                    ? "border-emerald-300 bg-emerald-50/60 dark:border-emerald-500/40 dark:bg-emerald-500/10"
                    : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    done ? "bg-emerald-500 text-white" : "bg-indigo-600 text-white",
                  )}
                >
                  {done ? "✓" : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800 group-hover:text-indigo-600 dark:text-slate-100">{node.label}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{node.sub}</p>
                </div>
                <span className="text-slate-300 transition-transform group-hover:translate-x-1 dark:text-slate-600">→</span>
              </Link>
              {i < ROADMAP.length - 1 ? (
                <div className="ml-10 h-5 w-0.5 bg-slate-200 dark:bg-slate-700" aria-hidden />
              ) : null}
            </div>
          );
        })}
      </div>

      <div className={cn(card, "mt-8 p-5")}>
        <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">Where should I start?</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          If you&apos;re new, begin at <Link href="/topics/process-concept" className="font-medium text-indigo-600 underline dark:text-indigo-300">Process Concept</Link> and follow
          the roadmap top-to-bottom. Preparing for an exam? Jump straight to the{" "}
          <Link href="/revision" className="font-medium text-indigo-600 underline dark:text-indigo-300">Exam Revision</Link>.
        </p>
      </div>
    </div>
  );
}
