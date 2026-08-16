"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { AlgorithmId, PriorityMode, ProcessInput } from "@/engine/scheduling";
import { ALGORITHM_META, simulateScheduling } from "@/engine/scheduling";
import { COMPARISON_PROCESSES, DEFAULT_PROCESSES, STARVATION_PROCESSES, randomProcesses } from "@/data/presets";
import { useProgress } from "@/lib/providers";
import { cn, fmt, pct, processColor } from "@/lib/utils";
import { Badge, Button, Callout, card } from "@/components/common/ui";
import { SimulationViewer } from "@/components/scheduling/SimulationViewer";

export default function LabPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-400">Loading Algorithm Lab…</div>}>
      <LabInner />
    </Suspense>
  );
}

function LabInner() {
  const sp = useSearchParams();
  const initialAlgo = (sp.get("algo") as AlgorithmId | null) ?? "FCFS";
  const { bumpSimulator } = useProgress();

  const [processes, setProcesses] = useState<ProcessInput[]>(DEFAULT_PROCESSES);
  const [algorithm, setAlgorithm] = useState<AlgorithmId>(ALGORITHM_META.some((a) => a.id === initialAlgo) ? initialAlgo : "FCFS");
  const [timeQuantum, setTimeQuantum] = useState(2);
  const [priorityMode, setPriorityMode] = useState<PriorityMode>("LOWER_NUMBER");

  const meta = ALGORITHM_META.find((a) => a.id === algorithm)!;

  const errors = useMemo(() => {
    const errs: string[] = [];
    if (processes.length === 0) errs.push("At least one process is required.");
    for (const p of processes) {
      if (!Number.isFinite(p.arrivalTime) || p.arrivalTime < 0) errs.push(`${p.id}: arrival time cannot be negative.`);
      if (!Number.isFinite(p.burstTime) || p.burstTime < 1) errs.push(`${p.id}: burst time must be greater than 0.`);
    }
    if (algorithm === "ROUND_ROBIN" && (timeQuantum < 1 || !Number.isFinite(timeQuantum))) {
      errs.push("Time quantum must be greater than 0.");
    }
    return errs;
  }, [processes, algorithm, timeQuantum]);

  const result = useMemo(() => {
    if (errors.length) return null;
    return simulateScheduling(processes, algorithm, { timeQuantum, priorityMode });
  }, [processes, algorithm, timeQuantum, priorityMode, errors.length]);

  const contextLine =
    algorithm === "ROUND_ROBIN"
      ? `Time quantum = ${timeQuantum}`
      : meta.needsPriority
        ? `Priority: ${priorityMode === "LOWER_NUMBER" ? "lower number wins" : "higher number wins"}${algorithm === "MLQ" ? " · priority selects the queue" : ""}`
        : undefined;

  const updateProcess = (id: string, field: "arrivalTime" | "burstTime" | "priority", value: number) => {
    setProcesses((ps) => ps.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const addProcess = () => {
    setProcesses((ps) => [...ps, { id: `P${ps.length + 1}`, arrivalTime: 0, burstTime: 3, priority: 2 }]);
  };

  const removeProcess = (id: string) => setProcesses((ps) => ps.filter((p) => p.id !== id));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">🧪 Algorithm Lab</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Configure a process set, pick an algorithm, run it, and step through every scheduling decision the OS makes.
        </p>
      </header>

      {/* Configuration */}
      <div className={cn(card, "p-5")}>
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Algorithm selector */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Scheduling algorithm</label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value as AlgorithmId)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {ALGORITHM_META.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
            <div className="mt-3 flex flex-wrap gap-3">
              {meta.needsQuantum ? (
                <label className="text-xs text-slate-600 dark:text-slate-300">
                  Time quantum
                  <input
                    type="number"
                    min={1}
                    value={timeQuantum}
                    onChange={(e) => setTimeQuantum(Number(e.target.value) || 0)}
                    className="ml-2 w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm tabular-nums dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </label>
              ) : null}
              {meta.needsPriority && algorithm !== "MLQ" ? (
                <label className="text-xs text-slate-600 dark:text-slate-300">
                  Priority convention
                  <select
                    value={priorityMode}
                    onChange={(e) => setPriorityMode(e.target.value as PriorityMode)}
                    className="ml-2 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="LOWER_NUMBER">Lower number = higher priority</option>
                    <option value="HIGHER_NUMBER">Higher number = higher priority</option>
                  </select>
                </label>
              ) : null}
            </div>
            <p className="mt-3 text-xs text-slate-400">
              {algorithm === "MLQ" && "For MLQ, each process's Priority selects its queue: 1 → System, 2 → Interactive, 3+ → Batch."}
              {algorithm === "MLFQ" && "MLFQ uses 3 queues with quanta 2 / 4 / 8, demotion on full quantum, and aging after 8 units."}
            </p>
          </div>

          {/* Process table */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Processes</span>
              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" variant="ghost" onClick={() => setProcesses(DEFAULT_PROCESSES)}>Default</Button>
                <Button size="sm" variant="ghost" onClick={() => setProcesses(COMPARISON_PROCESSES)}>Rich set</Button>
                <Button size="sm" variant="ghost" onClick={() => setProcesses(STARVATION_PROCESSES)}>Starvation</Button>
                <Button size="sm" variant="ghost" onClick={() => setProcesses(randomProcesses(4))}>Random</Button>
              </div>
            </div>
            <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
                    <th className="px-3 py-2 text-left font-semibold">ID</th>
                    <th className="px-3 py-2 text-left font-semibold">Arrival</th>
                    <th className="px-3 py-2 text-left font-semibold">Burst</th>
                    <th className="px-3 py-2 text-left font-semibold">Priority</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {processes.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                      <td className="px-3 py-1.5">
                        <span className={cn("rounded px-2 py-0.5 text-xs font-bold", processColor(p.id).chip)}>{p.id}</span>
                      </td>
                      <td className="px-3 py-1.5">
                        <input type="number" value={p.arrivalTime} min={0} onChange={(e) => updateProcess(p.id, "arrivalTime", Number(e.target.value) || 0)} className="w-16 rounded border border-slate-200 px-2 py-1 text-sm tabular-nums dark:border-slate-700 dark:bg-slate-800 dark:text-white" aria-label={`${p.id} arrival time`} />
                      </td>
                      <td className="px-3 py-1.5">
                        <input type="number" value={p.burstTime} min={1} onChange={(e) => updateProcess(p.id, "burstTime", Number(e.target.value) || 0)} className="w-16 rounded border border-slate-200 px-2 py-1 text-sm tabular-nums dark:border-slate-700 dark:bg-slate-800 dark:text-white" aria-label={`${p.id} burst time`} />
                      </td>
                      <td className="px-3 py-1.5">
                        <input type="number" value={p.priority ?? 0} onChange={(e) => updateProcess(p.id, "priority", Number(e.target.value) || 0)} className="w-16 rounded border border-slate-200 px-2 py-1 text-sm tabular-nums dark:border-slate-700 dark:bg-slate-800 dark:text-white" aria-label={`${p.id} priority`} />
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        <button type="button" onClick={() => removeProcess(p.id)} disabled={processes.length <= 1} className="rounded px-1.5 text-xs text-rose-500 hover:bg-rose-50 disabled:opacity-40 dark:hover:bg-rose-500/10" aria-label={`Remove ${p.id}`}>
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={addProcess}>+ Add process</Button>
              <Button size="sm" variant="secondary" onClick={() => setProcesses([])}>Clear all</Button>
              <Button size="sm" variant="primary" onClick={bumpSimulator} disabled={errors.length > 0}>
                ▶ Run Simulation
              </Button>
            </div>
          </div>
        </div>

        {errors.length ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300">
            <p className="font-semibold">Fix the input to run the simulation:</p>
            <ul className="mt-1 list-inside list-disc">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {/* Simulation */}
      {result ? (
        <SimulationViewer result={result} processes={processes} contextLine={contextLine} />
      ) : (
        <div className={cn(card, "p-10 text-center text-sm text-slate-400")}>
          Fix the input errors above to run the simulation.
        </div>
      )}

      {/* Comparison */}
      <ComparisonSection processes={processes.length ? processes : DEFAULT_PROCESSES} quantum={timeQuantum} />
    </div>
  );
}

function ComparisonSection({ processes, quantum }: { processes: ProcessInput[]; quantum: number }) {
  const rows = useMemo(() => {
    return ALGORITHM_META.map((a) => {
      const res = simulateScheduling(processes, a.id, { timeQuantum: quantum, priorityMode: "LOWER_NUMBER" });
      return {
        label: a.short,
        avgWaiting: res.averages.waitingTime,
        avgTurnaround: res.averages.turnaroundTime,
        avgResponse: res.averages.responseTime,
        switches: res.contextSwitches,
        util: res.cpuUtilization,
      };
    });
  }, [processes, quantum]);

  const bestWaiting = Math.min(...rows.map((r) => r.avgWaiting));

  return (
    <div className={cn(card, "p-5")}>
      <h2 className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">Algorithm comparison</h2>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        The same {processes.length} processes run through every algorithm. No algorithm wins everywhere — spot the trade-offs.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <th className="px-2 py-2 text-left font-semibold">Algorithm</th>
              <th className="px-2 py-2 text-left font-semibold">Avg Waiting</th>
              <th className="px-2 py-2 text-left font-semibold">Avg Turnaround</th>
              <th className="px-2 py-2 text-left font-semibold">Avg Response</th>
              <th className="px-2 py-2 text-left font-semibold">Switches</th>
              <th className="px-2 py-2 text-left font-semibold">CPU Util</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className={cn("border-b border-slate-100 last:border-0 dark:border-slate-800", r.avgWaiting === bestWaiting && "bg-emerald-50/50 dark:bg-emerald-500/5")}>
                <td className="px-2 py-2 font-semibold text-slate-700 dark:text-slate-200">
                  {r.label}
                  {r.avgWaiting === bestWaiting ? <span className="ml-1 text-xs text-emerald-600">★ lowest waiting</span> : null}
                </td>
                <td className="px-2 py-2 tabular-nums">{fmt(r.avgWaiting)}</td>
                <td className="px-2 py-2 tabular-nums">{fmt(r.avgTurnaround)}</td>
                <td className="px-2 py-2 tabular-nums">{fmt(r.avgResponse)}</td>
                <td className="px-2 py-2 tabular-nums">{r.switches}</td>
                <td className="px-2 py-2 tabular-nums">{pct(r.util)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Callout tone="info" title="Trade-offs">
        SJF/SRTF minimize average waiting, but can starve long jobs. Round Robin gives fair response at the cost of more context switches.
        MLFQ balances all of these dynamically. There is no universal “best” — the right algorithm depends on the workload.
      </Callout>
    </div>
  );
}
