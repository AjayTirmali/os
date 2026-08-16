"use client";

import { useMemo, useState } from "react";
import type { AlgorithmId } from "@/engine/scheduling";
import { simulateScheduling } from "@/engine/scheduling";
import { DEFAULT_PROCESSES } from "@/data/presets";
import { cn } from "@/lib/utils";
import { card } from "@/components/common/ui";
import {
  ContextSwitchViz,
  PCBInspector,
  ProcessStateMachine,
  SchedulingQueuesViz,
} from "@/components/visualization/ProcessViz";
import { IPCViz, ProducerConsumerViz, ThreadModelsViz, ThreadsViz } from "@/components/visualization/CommsViz";
import { BurstCycleViz, MultiprocessorViz } from "@/components/visualization/SchedViz";
import { SimulationViewer } from "@/components/scheduling/SimulationViewer";

const TABS = [
  { id: "states", label: "Process States" },
  { id: "pcb", label: "PCB" },
  { id: "queues", label: "Scheduling Queues" },
  { id: "context", label: "Context Switch" },
  { id: "ipc", label: "IPC" },
  { id: "producer", label: "Producer-Consumer" },
  { id: "threads", label: "Threads" },
  { id: "models", label: "Thread Models" },
  { id: "burst", label: "CPU / I/O Burst" },
  { id: "scheduling", label: "CPU Scheduling" },
  { id: "multicore", label: "Multi-Core" },
];

export default function PlaygroundPage() {
  const [tab, setTab] = useState("states");

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">🕹️ OS Playground</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          A free experimentation environment. Pick a system and manipulate it directly.
        </p>
      </header>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              tab === t.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "states" && <ProcessStateMachine />}
      {tab === "pcb" && <PCBInspector />}
      {tab === "queues" && <SchedulingQueuesViz />}
      {tab === "context" && <ContextSwitchViz />}
      {tab === "ipc" && <IPCViz />}
      {tab === "producer" && <ProducerConsumerViz />}
      {tab === "threads" && <ThreadsViz />}
      {tab === "models" && <ThreadModelsViz />}
      {tab === "burst" && <BurstCycleViz />}
      {tab === "scheduling" && <PlaygroundScheduling />}
      {tab === "multicore" && <MultiprocessorViz />}

      <p className={cn(card, "mt-6 p-4 text-center text-xs text-slate-400")}>
        Everything here runs locally in your browser — no server needed. Changes are yours to make and undo.
      </p>
    </div>
  );
}

function PlaygroundScheduling() {
  const [algo, setAlgo] = useState<AlgorithmId>("ROUND_ROBIN");
  const [quantum, setQuantum] = useState(2);
  const result = useMemo(() => simulateScheduling(DEFAULT_PROCESSES, algo, { timeQuantum: quantum, priorityMode: "LOWER_NUMBER" }), [algo, quantum]);

  return (
    <div className="space-y-4">
      <div className={cn(card, "flex flex-wrap items-center gap-3 p-4")}>
        <label className="text-sm text-slate-600 dark:text-slate-300">
          Algorithm
          <select value={algo} onChange={(e) => setAlgo(e.target.value as AlgorithmId)} className="ml-2 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
            <option value="FCFS">FCFS</option>
            <option value="SJF">SJF</option>
            <option value="SRTF">SRTF</option>
            <option value="PRIORITY_NP">Priority (NP)</option>
            <option value="PRIORITY_P">Priority (P)</option>
            <option value="ROUND_ROBIN">Round Robin</option>
            <option value="MLQ">MLQ</option>
            <option value="MLFQ">MLFQ</option>
          </select>
        </label>
        {algo === "ROUND_ROBIN" ? (
          <label className="text-sm text-slate-600 dark:text-slate-300">
            Quantum
            <input type="number" min={1} value={quantum} onChange={(e) => setQuantum(Number(e.target.value) || 1)} className="ml-2 w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm tabular-nums dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          </label>
        ) : null}
      </div>
      <SimulationViewer result={result} processes={DEFAULT_PROCESSES} contextLine={algo === "ROUND_ROBIN" ? `Time quantum = ${quantum}` : undefined} />
    </div>
  );
}
