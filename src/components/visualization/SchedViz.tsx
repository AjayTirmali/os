"use client";

import { useMemo, useState } from "react";
import { cn, fmt, processColor } from "@/lib/utils";
import { Badge, Button, Callout, card } from "@/components/common/ui";

/* ------------------------- Metrics calculator ------------------------- */

function NumField({ label, value, onChange, min = 0 }: { label: string; value: string; onChange: (v: string) => void; min?: number }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm tabular-nums dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      />
    </label>
  );
}

export function MetricsCalculatorViz() {
  const [at, setAt] = useState("0");
  const [bt, setBt] = useState("6");
  const [ct, setCt] = useState("10");
  const [first, setFirst] = useState("0");
  const [busy, setBusy] = useState("80");
  const [total, setTotal] = useState("100");
  const [completed, setCompleted] = useState("8");

  const n = (s: string) => {
    const v = Number(s);
    return Number.isFinite(v) ? v : NaN;
  };

  const tt = n(ct) - n(at);
  const wt = tt - n(bt);
  const rt = n(first) - n(at);
  const util = n(total) > 0 ? (n(busy) / n(total)) * 100 : NaN;
  const throughput = n(total) > 0 ? n(completed) / n(total) : NaN;

  const validProcess = Number.isFinite(tt) && Number.isFinite(wt) && Number.isFinite(rt);

  return (
    <div className={cn(card, "p-5")}>
      <p className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">Metric calculator</p>
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Type values to compute scheduling metrics live.</p>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Per-process time metrics</p>
          <div className="grid grid-cols-2 gap-3">
            <NumField label="Arrival Time (AT)" value={at} onChange={setAt} />
            <NumField label="Burst Time (BT)" value={bt} onChange={setBt} min={1} />
            <NumField label="Completion Time (CT)" value={ct} onChange={setCt} />
            <NumField label="First CPU Start" value={first} onChange={setFirst} />
          </div>
          {validProcess ? (
            <div className="mt-3 space-y-2 text-sm">
              <ResultRow label="Turnaround = CT − AT" value={`${n(ct)} − ${n(at)} = ${fmt(tt)}`} />
              <ResultRow label="Waiting = TT − BT" value={`${fmt(tt)} − ${n(bt)} = ${fmt(wt)}`} />
              <ResultRow label="Response = Start − AT" value={`${n(first)} − ${n(at)} = ${fmt(rt)}`} />
            </div>
          ) : (
            <p className="mt-3 text-xs text-rose-500">Enter valid numbers (burst time must be at least 1).</p>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">System-wide metrics</p>
          <div className="grid grid-cols-2 gap-3">
            <NumField label="CPU busy time" value={busy} onChange={setBusy} />
            <NumField label="Total time" value={total} onChange={setTotal} min={1} />
            <NumField label="Completed processes" value={completed} onChange={setCompleted} />
          </div>
          <div className="mt-3 space-y-2 text-sm">
            <ResultRow label="CPU Utilization = busy / total × 100%" value={Number.isFinite(util) ? `${fmt(util, 1)}%` : "—"} />
            <ResultRow label="Throughput = completed / total" value={Number.isFinite(throughput) ? fmt(throughput, 3) : "—"} />
          </div>
          <Callout tone="tip" title="Read the definitions">
            Utilization and throughput are <em>system</em> metrics; turnaround, waiting, and response are <em>per-process</em> metrics.
          </Callout>
        </div>
      </div>
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-mono text-sm font-bold tabular-nums text-indigo-600 dark:text-indigo-300">{value}</span>
    </div>
  );
}

/* ------------------------- CPU / I/O burst cycle ------------------------- */

const BURST_PATTERNS = {
  iobound: [
    { type: "CPU", len: 2 },
    { type: "I/O", len: 6 },
    { type: "CPU", len: 2 },
    { type: "I/O", len: 6 },
    { type: "CPU", len: 2 },
    { type: "I/O", len: 4 },
  ],
  cpubound: [
    { type: "CPU", len: 6 },
    { type: "I/O", len: 2 },
    { type: "CPU", len: 6 },
    { type: "I/O", len: 2 },
    { type: "CPU", len: 6 },
    { type: "I/O", len: 1 },
  ],
};

export function BurstCycleViz() {
  const [pattern, setPattern] = useState<"iobound" | "cpubound">("iobound");
  const [step, setStep] = useState(0);
  const segments = BURST_PATTERNS[pattern];
  const active = segments[step];

  return (
    <div className={cn(card, "p-5")}>
      <p className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">CPU burst ↔ I/O burst</p>
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Processes alternate between computing and waiting for I/O.</p>

      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => { setPattern("iobound"); setStep(0); }} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", pattern === "iobound" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300")}>
          I/O-bound (many short CPU bursts)
        </button>
        <button type="button" onClick={() => { setPattern("cpubound"); setStep(0); }} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", pattern === "cpubound" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300")}>
          CPU-bound (long CPU bursts)
        </button>
      </div>

      <div className="flex h-16 w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
        {segments.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setStep(i)}
            style={{ width: `${(s.len / segments.reduce((a, b) => a + b.len, 0)) * 100}%` }}
            className={cn(
              "flex items-center justify-center border-r border-white/40 text-[10px] font-bold uppercase last:border-0",
              s.type === "CPU" ? "bg-emerald-500/80 text-white" : "bg-amber-400/80 text-slate-900",
              i === step && "ring-2 ring-inset ring-slate-900 dark:ring-white",
            )}
          >
            {s.type === "CPU" ? "CPU" : "I/O"}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button variant="primary" size="sm" onClick={() => setStep((s) => (s + 1) % segments.length)}>Next burst →</Button>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Now in a <strong>{active.type}</strong> burst ({active.len} units). {active.type === "CPU" ? "The process is running on the CPU." : "The process is blocked, waiting for I/O to complete."}
        </p>
      </div>

      <Callout tone="internal" title="Why it matters for scheduling">
        When a process enters an I/O burst, the OS moves it to a waiting queue and the scheduler gives the CPU to someone else — that's why the CPU can stay busy even while processes wait.
      </Callout>
    </div>
  );
}

/* ------------------------- Multiprocessor ------------------------- */

interface MpTask {
  id: string;
  load: number;
  cpu: number;
}

const CPU_COUNT = 4;

export function MultiprocessorViz() {
  const [tasks, setTasks] = useState<MpTask[]>([]);
  const [mode, setMode] = useState<"global" | "percpu">("global");
  const [counter, setCounter] = useState(1);
  const [log, setLog] = useState<string[]>(["Add processes and assign them across 4 CPUs."]);

  const cpus = useMemo(() => {
    const lanes: MpTask[][] = Array.from({ length: CPU_COUNT }, () => []);
    for (const t of tasks) lanes[t.cpu].push(t);
    return lanes;
  }, [tasks]);

  const loadOf = (lane: MpTask[]) => lane.reduce((a, t) => a + t.load, 0);

  const addTask = () => {
    const id = `P${counter}`;
    const load = 2 + Math.floor(Math.random() * 6);
    let cpu = 0;
    if (mode === "global") {
      cpu = cpus.map((lane, i) => ({ i, load: loadOf(lane) })).reduce((a, b) => (b.load < a.load ? b : a)).i;
      setLog((l) => [`${id} (load ${load}) assigned to CPU ${cpu + 1} (least loaded).`, ...l].slice(0, 4));
    } else {
      cpu = (counter - 1) % CPU_COUNT;
      setLog((l) => [`${id} (load ${load}) pinned to CPU ${cpu + 1} (round-robin → affinity).`, ...l].slice(0, 4));
    }
    setTasks((t) => [...t, { id, load, cpu }]);
    setCounter((c) => c + 1);
  };

  const balance = () => {
    const loads = cpus.map((lane, i) => ({ i, load: loadOf(lane) }));
    const from = loads.reduce((a, b) => (b.load > a.load ? b : a));
    const to = loads.reduce((a, b) => (b.load < a.load ? b : a));
    if (from.i === to.i || from.load - to.load <= 1) {
      setLog((l) => ["CPUs are already balanced.", ...l].slice(0, 4));
      return;
    }
    const moved = tasks.find((t) => t.cpu === from.i && t.load > 1);
    if (!moved) return;
    setTasks((ts) => ts.map((t) => (t.id === moved.id ? { ...t, cpu: to.i } : t)));
    setLog((l) => [`Moved ${moved.id} from CPU ${from.i + 1} to CPU ${to.i + 1} — but its warm cache is now lost (affinity).`, ...l].slice(0, 4));
  };

  const runTick = () => {
    setTasks((ts) => {
      const next = ts
        .map((t) => ({ ...t, load: t.load - 1 }))
        .filter((t) => t.load > 0);
      return next;
    });
    setLog((l) => ["Executed one time unit on all CPUs.", ...l].slice(0, 4));
  };

  return (
    <div className={cn(card, "p-5")}>
      <p className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">Multi-core simulator</p>
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">See how global vs per-CPU queues trade load balancing against processor affinity.</p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setMode("global")} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", mode === "global" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300")}>
          Global Queue
        </button>
        <button type="button" onClick={() => setMode("percpu")} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", mode === "percpu" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300")}>
          Per-CPU Queues
        </button>
        <Badge tone="slate">{mode === "global" ? "Auto load balancing, weak affinity" : "Strong affinity, may need explicit balancing"}</Badge>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cpus.map((lane, i) => (
          <div key={i} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">CPU {i + 1}</span>
              <Badge tone={loadOf(lane) > 8 ? "rose" : loadOf(lane) > 3 ? "amber" : "emerald"}>load {loadOf(lane)}</Badge>
            </div>
            <div className="min-h-16 space-y-1">
              {lane.length ? (
                lane.map((t) => (
                  <span key={t.id} className={cn("inline-block rounded px-2 py-0.5 text-xs font-bold", processColor(t.id).chip)}>
                    {t.id}·{t.load}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">idle</span>
              )}
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full bg-indigo-500 transition-all" style={{ width: `${Math.min(100, (loadOf(lane) / 12) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" size="sm" onClick={addTask}>Add process</Button>
        <Button variant="secondary" size="sm" onClick={balance}>Load balance</Button>
        <Button variant="secondary" size="sm" onClick={runTick}>Run 1 time unit</Button>
        <Button variant="ghost" size="sm" onClick={() => { setTasks([]); setCounter(1); setLog(["Reset."]); }}>Reset</Button>
      </div>

      <ul className="mt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
        {log.map((l, i) => <li key={i}>• {l}</li>)}
      </ul>
    </div>
  );
}
