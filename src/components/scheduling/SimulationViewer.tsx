"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ProcessInput, SimulationResult } from "@/engine/scheduling";
import { ALGORITHM_META } from "@/engine/scheduling";
import { cn, fmt, pct, processColor, EVENT_META } from "@/lib/utils";
import { Badge, Button, Callout, card } from "@/components/common/ui";
import { GanttChart } from "./GanttChart";

interface SimulationViewerProps {
  result: SimulationResult;
  processes: ProcessInput[];
  /** Optional extra context line, e.g. the time quantum used. */
  contextLine?: string;
}

const SPEEDS: { label: string; ms: number }[] = [
  { label: "0.5×", ms: 1600 },
  { label: "1×", ms: 900 },
  { label: "2×", ms: 450 },
];

export function SimulationViewer({ result, processes, contextLine }: SimulationViewerProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const lastIndex = Math.max(0, result.steps.length - 1);
  const step = result.steps[Math.min(stepIndex, lastIndex)];
  const meta = ALGORITHM_META.find((a) => a.id === result.algorithm);

  useEffect(() => {
    setStepIndex(0);
    setPlaying(false);
    setSelectedId(null);
  }, [result]);

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setStepIndex((i) => {
        if (i >= lastIndex) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, SPEEDS[speedIdx].ms);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, speedIdx, lastIndex]);

  const jumpTo = useCallback((i: number) => setStepIndex(Math.max(0, Math.min(lastIndex, i))), [lastIndex]);

  const selectedMetric = useMemo(
    () => result.processMetrics.find((m) => m.id === selectedId),
    [result.processMetrics, selectedId],
  );

  const isDone = stepIndex >= lastIndex && !playing;

  return (
    <div className="space-y-4">
      {/* Header / controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Time</span>
          <span className="ml-2 font-mono text-xl font-bold tabular-nums text-slate-900 dark:text-white">
            t = {step.time}
          </span>
        </div>

        {step && (
          <Badge tone="slate" className="border">
            {EVENT_META[step.event].label}
          </Badge>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-2" role="group" aria-label="Simulation controls">
          <Button variant="secondary" size="sm" onClick={() => { setPlaying(false); jumpTo(0); }} aria-label="Restart">
            ⏮ Restart
          </Button>
          <Button variant="secondary" size="sm" onClick={() => { setPlaying(false); jumpTo(stepIndex - 1); }} disabled={stepIndex === 0} aria-label="Previous step">
            ◀ Prev
          </Button>
          <Button variant="primary" size="sm" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause" : "Play"}>
            {playing ? "⏸ Pause" : "▶ Play"}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => { setPlaying(false); jumpTo(stepIndex + 1); }} disabled={stepIndex >= lastIndex} aria-label="Next step">
            Next ▶
          </Button>
          <Button variant="secondary" size="sm" onClick={() => { setPlaying(false); jumpTo(lastIndex); }} aria-label="Finish">
            ⏭ Finish
          </Button>
          <select
            value={speedIdx}
            onChange={(e) => setSpeedIdx(Number(e.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            aria-label="Playback speed"
          >
            {SPEEDS.map((s, i) => (
              <option key={s.label} value={i}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Explanation / why */}
      {step && (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{step.explanation}</p>
          </div>
          {step.why ? (
            <Callout tone="warn" title="Why did the scheduler do that?">
              {step.why}
            </Callout>
          ) : null}
          <Callout tone="internal" title="What is happening internally?">
            {step.internalExplanation}
          </Callout>
        </div>
      )}

      {/* CPU + queues */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={cn(card, "p-4")}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">CPU</p>
          <div className="flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
            {step?.runningProcessId ? (
              <div className="flex flex-col items-center gap-1">
                <span className={cn("rounded-lg px-4 py-2 text-lg font-bold", processColor(step.runningProcessId).chip)}>
                  {step.runningProcessId}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">executing on CPU</span>
              </div>
            ) : (
              <span className="text-sm font-medium text-slate-400 dark:text-slate-500">CPU idle</span>
            )}
          </div>

          {step?.queues ? (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Queues (highest → lowest)</p>
              {step.queues.map((q) => (
                <div key={q.id} className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">{q.name}</span>
                  <div className="flex flex-1 flex-wrap gap-1 rounded-lg border border-slate-200 p-1.5 dark:border-slate-700">
                    {q.processes.length ? (
                      q.processes.map((id) => (
                        <span key={id} className={cn("rounded px-2 py-0.5 text-xs font-semibold", processColor(id).chip)}>
                          {id}
                        </span>
                      ))
                    ) : (
                      <span className="px-1 text-xs text-slate-400">empty</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Ready Queue</p>
              <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 p-2 dark:border-slate-700">
                {step?.readyQueue.length ? (
                  step.readyQueue.map((id, i) => (
                    <span key={`${id}-${i}`} className={cn("rounded px-2 py-1 text-xs font-semibold", processColor(id).chip)}>
                      {id}
                    </span>
                  ))
                ) : (
                  <span className="px-1 text-xs text-slate-400">empty</span>
                )}
              </div>
            </div>
          )}

          <div className="mt-3">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Completed</p>
            <div className="flex min-h-8 flex-wrap items-center gap-1.5">
              {step?.completedProcesses.length ? (
                step.completedProcesses.map((id) => (
                  <span key={id} className="rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600 line-through dark:bg-slate-700 dark:text-slate-300">
                    {id}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">none yet</span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className={cn(card, "p-4")}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Gantt Chart</p>
            <GanttChart segments={step.gantt} onSelect={setSelectedId} selectedId={selectedId} />
          </div>
          <div className={cn(card, "p-4")}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Scheduler & Dispatcher
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-indigo-50 p-3 dark:bg-indigo-500/10">
                <p className="font-semibold text-indigo-700 dark:text-indigo-300">Scheduler</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  Decides WHICH process runs next ({meta?.short ?? result.algorithm}).
                </p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-500/10">
                <p className="font-semibold text-emerald-700 dark:text-emerald-300">Dispatcher</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  Hands the CPU to the selected process (loads its context).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className={cn(card, "p-4")}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Metrics</p>
          {contextLine ? <Badge tone="indigo">{contextLine}</Badge> : null}
          {isDone ? <Badge tone="emerald">Simulation complete</Badge> : <Badge tone="amber">In progress</Badge>}
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <MetricStat label="Avg Waiting" value={fmt(result.averages.waitingTime)} />
          <MetricStat label="Avg Turnaround" value={fmt(result.averages.turnaroundTime)} />
          <MetricStat label="Avg Response" value={fmt(result.averages.responseTime)} />
          <MetricStat label="CPU Utilization" value={pct(result.cpuUtilization)} />
          <MetricStat label="Context Switches" value={String(result.contextSwitches)} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <th className="px-2 py-2 font-semibold">Process</th>
                <th className="px-2 py-2 font-semibold">AT</th>
                <th className="px-2 py-2 font-semibold">BT</th>
                <th className="px-2 py-2 font-semibold">Start</th>
                <th className="px-2 py-2 font-semibold">CT</th>
                <th className="px-2 py-2 font-semibold">TT</th>
                <th className="px-2 py-2 font-semibold">WT</th>
                <th className="px-2 py-2 font-semibold">RT</th>
              </tr>
            </thead>
            <tbody>
              {result.processMetrics.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => setSelectedId(m.id === selectedId ? null : m.id)}
                  className={cn(
                    "cursor-pointer border-b border-slate-100 transition-colors last:border-0 dark:border-slate-800",
                    selectedId === m.id ? "bg-indigo-50 dark:bg-indigo-500/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                  )}
                >
                  <td className="px-2 py-2">
                    <span className={cn("rounded px-2 py-0.5 text-xs font-bold", processColor(m.id).chip)}>{m.id}</span>
                  </td>
                  <td className="px-2 py-2 tabular-nums">{m.arrivalTime}</td>
                  <td className="px-2 py-2 tabular-nums">{m.burstTime}</td>
                  <td className="px-2 py-2 tabular-nums">{fmt(m.firstStartTime)}</td>
                  <td className="px-2 py-2 tabular-nums">{fmt(m.completionTime)}</td>
                  <td className="px-2 py-2 tabular-nums">{fmt(m.turnaroundTime)}</td>
                  <td className="px-2 py-2 tabular-nums">{fmt(m.waitingTime)}</td>
                  <td className="px-2 py-2 tabular-nums">{fmt(m.responseTime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedMetric ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
            <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {selectedMetric.id} — how the numbers were derived
            </p>
            <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-3">
              <p>
                <span className="font-medium">Turnaround</span> = {fmt(selectedMetric.completionTime)} −{" "}
                {selectedMetric.arrivalTime} = {fmt(selectedMetric.turnaroundTime)}
              </p>
              <p>
                <span className="font-medium">Waiting</span> = {fmt(selectedMetric.turnaroundTime)} −{" "}
                {selectedMetric.burstTime} = {fmt(selectedMetric.waitingTime)}
              </p>
              <p>
                <span className="font-medium">Response</span> = {fmt(selectedMetric.firstStartTime)} −{" "}
                {selectedMetric.arrivalTime} = {fmt(selectedMetric.responseTime)}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-400">Click a process row (or a Gantt block) to see how its metrics were derived.</p>
        )}
      </div>

      {isDone ? (
        <Callout tone="tip" title="Simulation complete">
          <LearningSummary algorithm={result.algorithm} result={result} />
        </Callout>
      ) : null}
    </div>
  );
}

function MetricStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function LearningSummary({ algorithm, result }: { algorithm: string; result: SimulationResult }) {
  const lessons: Record<string, string> = {
    FCFS: "FCFS is simple but can suffer the convoy effect — short jobs wait behind long ones, raising average waiting time.",
    SJF: "SJF minimizes average waiting time, but it must know burst lengths in advance and can starve long jobs.",
    SRTF: "SRTF improves response time by preempting for shorter remaining jobs, at the cost of more context switches.",
    PRIORITY_NP: "Priority scheduling runs the most important job first. Watch for starvation of low-priority processes.",
    PRIORITY_P: "Preemptive priority interrupts the running job for a higher-priority arrival — better responsiveness, more switches.",
    ROUND_ROBIN: "Round Robin gives fair, predictable response. A smaller quantum improves fairness but raises context-switch overhead.",
    MLQ: "Multilevel Queue keeps workload classes apart. High-priority queues always run first, so low-priority queues can starve.",
    MLFQ: "MLFQ adapts dynamically: CPU hogs get demoted, waiting processes get promoted — approximating SJF without needing future knowledge.",
  };
  return (
    <div className="space-y-1">
      <p className="font-medium">
        {algorithm} · {fmt(result.averages.waitingTime)} avg waiting · {fmt(result.averages.turnaroundTime)} avg turnaround ·{" "}
        {result.contextSwitches} context switches.
      </p>
      <p>{lessons[algorithm] ?? "Every algorithm trades off waiting time, response time, and overhead differently."}</p>
    </div>
  );
}
