"use client";

import { useState } from "react";
import { cn, processColor } from "@/lib/utils";
import { Badge, Button, Callout, card } from "@/components/common/ui";

/* ------------------------- Program → Process ------------------------- */

export function ProgramToProcessViz() {
  const stages = [
    { key: "disk", label: "Program on Disk", detail: "Passive instructions & data stored on secondary storage." },
    { key: "loader", label: "Loader", detail: "The OS loader reads the executable file." },
    { key: "memory", label: "Memory", detail: "Code, data, heap, and stack are mapped into an address space." },
    { key: "process", label: "Process", detail: "A PCB is created; the process is now a live entity in the ready queue." },
    { key: "cpu", label: "CPU", detail: "The dispatcher loads the context and the CPU executes it." },
  ];
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const active = Math.min(stage, stages.length - 1);

  return (
    <div className={cn(card, "p-5")}>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Watch a program become a running process</p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setStage(0)}>Reset</Button>
          <Button variant="primary" size="sm" onClick={() => setStage((s) => (s + 1) % stages.length)}>
            Next step →
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-1">
        {stages.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <button
              type="button"
              onClick={() => setStage(i)}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                i === active
                  ? "border-indigo-500 bg-indigo-600 text-white"
                  : i < active
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : "border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-800",
              )}
            >
              {i + 1}. {s.label}
            </button>
            {i < stages.length - 1 ? <span className="mx-0.5 text-slate-300 dark:text-slate-600">→</span> : null}
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Current stage</p>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{stages[active].label}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{stages[active].detail}</p>
        </div>
        <MemoryDiagram stage={active} />
      </div>
      <p className="mt-3 text-xs text-slate-400">Click any stage to jump. The memory layout on the right fills in as loading progresses.</p>
    </div>
  );
}

function MemoryDiagram({ stage }: { stage: number }) {
  const layers = [
    { label: "Stack", desc: "function calls & locals", filledAt: 3 },
    { label: "Heap", desc: "dynamic allocation", filledAt: 3 },
    { label: "Data", desc: "global variables", filledAt: 2 },
    { label: "Code (Text)", desc: "instructions", filledAt: 2 },
  ];
  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Process in Memory</p>
      <div className="space-y-1.5">
        {layers.map((l) => (
          <div
            key={l.label}
            className={cn(
              "flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors",
              stage >= l.filledAt
                ? "border-indigo-300 bg-indigo-50 dark:border-indigo-500/40 dark:bg-indigo-500/10"
                : "border-slate-200 bg-slate-50 opacity-50 dark:border-slate-700 dark:bg-slate-800/50",
            )}
          >
            <span className="font-semibold text-slate-700 dark:text-slate-200">{l.label}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{stage >= l.filledAt ? l.desc : "—"}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-slate-400">Stack grows down ↓ · Heap grows up ↑</p>
    </div>
  );
}

/* ------------------------- Process State Machine ------------------------- */

type PState = "new" | "ready" | "running" | "waiting" | "terminated";

const STATE_NODES: { id: PState; label: string; x: number; y: number }[] = [
  { id: "new", label: "New", x: 75, y: 52 },
  { id: "ready", label: "Ready", x: 235, y: 52 },
  { id: "running", label: "Running", x: 395, y: 52 },
  { id: "terminated", label: "Terminated", x: 515, y: 52 },
  { id: "waiting", label: "Waiting", x: 395, y: 196 },
];

export function ProcessStateMachine() {
  const [state, setState] = useState<PState>("new");
  const [reason, setReason] = useState("A brand-new process has been created and its PCB is being initialized.");

  const transitions: Record<PState, { label: string; to: PState; reason: string }[]> = {
    new: [{ label: "Create (admit)", to: "ready", reason: "The OS allocates the PCB and admits the process to the ready queue." }],
    ready: [{ label: "Dispatch", to: "running", reason: "The scheduler selects this process and the dispatcher loads its context onto the CPU." }],
    running: [
      { label: "Interrupt", to: "ready", reason: "A timer interrupt or higher-priority arrival preempts the process back to Ready." },
      { label: "Request I/O", to: "waiting", reason: "The process issues an I/O request and blocks (moves to a waiting queue)." },
      { label: "Terminate", to: "terminated", reason: "The process calls exit(); the OS reclaims its resources and PCB." },
    ],
    waiting: [{ label: "Complete I/O", to: "ready", reason: "I/O completes; the OS moves the process from the waiting queue back to Ready." }],
    terminated: [{ label: "Reset", to: "new", reason: "Start over with a brand-new process." }],
  };

  return (
    <div className={cn(card, "p-5")}>
      <p className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">Interactive process state machine</p>
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Click a transition to move the process between states.</p>

      <svg viewBox="0 0 590 250" className="w-full" role="img" aria-label="Process state diagram">
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="currentColor" />
          </marker>
        </defs>
        <g className="text-slate-400 dark:text-slate-500">
          <line x1="135" y1="52" x2="175" y2="52" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#arrow)" />
          <line x1="295" y1="52" x2="335" y2="52" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#arrow)" />
          <line x1="455" y1="52" x2="475" y2="52" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#arrow)" />
          <line x1="395" y1="74" x2="395" y2="174" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#arrow)" />
          <path d="M 335 196 C 260 196, 250 100, 275 74" fill="none" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#arrow)" />
          <path d="M 395 30 C 395 -10, 235 -10, 235 30" fill="none" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#arrow)" />
        </g>
        <text x="155" y="44" textAnchor="middle" className="fill-slate-400 text-[10px]">admit</text>
        <text x="315" y="44" textAnchor="middle" className="fill-slate-400 text-[10px]">dispatch</text>
        <text x="408" y="130" textAnchor="middle" className="fill-slate-400 text-[10px]">I/O request</text>
        <text x="286" y="150" textAnchor="middle" className="fill-slate-400 text-[10px]">I/O complete</text>
        <text x="315" y="14" textAnchor="middle" className="fill-slate-400 text-[10px]">interrupt</text>

        {STATE_NODES.map((n) => {
          const active = state === n.id;
          return (
            <g key={n.id}>
              <rect
                x={n.x - 60}
                y={n.y - 22}
                width="120"
                height="44"
                rx="10"
                className={cn(
                  active ? "fill-indigo-500" : "fill-white dark:fill-slate-800",
                )}
                stroke={active ? "#6366f1" : "#94a3b8"}
                strokeWidth={active ? 2.5 : 1.5}
              />
              <text
                x={n.x}
                y={n.y + 4}
                textAnchor="middle"
                className={cn("text-sm font-bold", active ? "fill-white" : "fill-slate-600 dark:fill-slate-300")}
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-4 flex flex-wrap gap-2">
        {transitions[state].map((t) => (
          <Button key={t.label} size="sm" variant={state === "terminated" ? "secondary" : "primary"} onClick={() => { setState(t.to); setReason(t.reason); }}>
            {t.label}
          </Button>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
        <Badge tone="indigo">{state.toUpperCase()}</Badge>
        <p className="text-sm text-slate-600 dark:text-slate-300">{reason}</p>
      </div>
    </div>
  );
}

/* ------------------------- PCB Inspector ------------------------- */

const PCB_FIELDS = [
  "PID",
  "Process State",
  "Program Counter",
  "CPU Registers",
  "Scheduling Info",
  "Memory Info",
  "Accounting Info",
  "I/O Status",
];

export function PCBInspector() {
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const phases = [
    { label: "P1 running", detail: "P1 is executing on the CPU. Its live state lives in the CPU registers." },
    { label: "Save P1 context", detail: "The kernel copies P1's PC and registers into P1's PCB." },
    { label: "Load P2 & run", detail: "The dispatcher loads P2's saved PC and registers into the CPU. P2 resumes exactly where it left off." },
  ];

  return (
    <div className={cn(card, "p-5")}>
      <p className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">PCB inspector & context switch</p>
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Watch the CPU state move between the CPU and the PCBs.</p>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">CPU</p>
          <div className="space-y-1.5 text-sm">
            <Field label="Running" value={phase === 2 ? "P2" : phase === 0 ? "P1" : "…"} />
            <Field label="Program Counter" value={phase === 2 ? "0x2040 (P2)" : phase === 0 ? "0x1020 (P1)" : "saving…"} />
            <Field label="Registers" value={phase === 2 ? "{ P2 values }" : phase === 0 ? "{ P1 values }" : "→ P1 PCB"} />
          </div>
        </div>

        {["P1", "P2"].map((id) => (
          <div key={id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="mb-2 flex items-center justify-between">
              <span className={cn("rounded px-2 py-0.5 text-xs font-bold", processColor(id).chip)}>{id}</span>
              <Badge tone="slate">PCB</Badge>
            </div>
            <div className="space-y-1.5 text-sm">
              {PCB_FIELDS.map((f) => (
                <div key={f} className="flex justify-between gap-2 border-b border-slate-100 pb-1 text-xs last:border-0 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">{f}</span>
                  <span className="font-mono text-slate-700 dark:text-slate-200">
                    {f === "PID" ? (id === "P1" ? "1001" : "1002") : f === "Process State" ? (phase === 0 && id === "P1" ? "Running" : phase === 2 && id === "P2" ? "Running" : "Ready") : "…"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button variant="primary" size="sm" onClick={() => setPhase((p) => ((p + 1) % 3) as 0 | 1 | 2)}>
          {phase === 0 ? "Trigger context switch" : "Next phase"}
        </Button>
        <Badge tone="sky">{phases[phase].label}</Badge>
        <p className="text-sm text-slate-600 dark:text-slate-300">{phases[phase].detail}</p>
      </div>
      <p className="mt-3 text-xs text-slate-400">A context switch is pure overhead — while saving/loading, the CPU does no useful work.</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 rounded bg-slate-50 px-2 py-1.5 dark:bg-slate-800/60">
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-100">{value}</span>
    </div>
  );
}

/* ------------------------- Context Switch Timeline ------------------------- */

const CS_STEPS = [
  { label: "P1 running", detail: "P1 executes normally on the CPU." },
  { label: "Interrupt", detail: "A timer interrupt or I/O/syscall interrupts P1." },
  { label: "Save P1 context", detail: "Kernel saves P1's PC + registers." },
  { label: "PCB(P1)", detail: "State is written to P1's PCB." },
  { label: "Scheduler", detail: "Scheduler selects the next process (P2)." },
  { label: "Load P2 context", detail: "Kernel loads P2's PC + registers from its PCB." },
  { label: "P2 running", detail: "P2 resumes execution." },
];

export function ContextSwitchViz() {
  const [step, setStep] = useState(0);
  return (
    <div className={cn(card, "p-5")}>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Context switch step-by-step</p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setStep(0)}>Reset</Button>
          <Button variant="primary" size="sm" onClick={() => setStep((s) => Math.min(s + 1, CS_STEPS.length - 1))} disabled={step >= CS_STEPS.length - 1}>
            Next
          </Button>
        </div>
      </div>
      <ol className="space-y-1">
        {CS_STEPS.map((s, i) => (
          <li key={s.label}>
            <button
              type="button"
              onClick={() => setStep(i)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                i === step
                  ? "border-indigo-400 bg-indigo-50 dark:border-indigo-500/50 dark:bg-indigo-500/10"
                  : i < step
                    ? "border-emerald-200 bg-emerald-50/50 text-slate-500 dark:border-emerald-500/30 dark:bg-emerald-500/5 dark:text-slate-400"
                    : "border-slate-200 dark:border-slate-700",
              )}
            >
              <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold", i === step ? "bg-indigo-600 text-white" : i < step ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500 dark:bg-slate-700")}>
                {i + 1}
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{s.label}</span>
              <span className="ml-auto hidden text-xs text-slate-500 dark:text-slate-400 sm:block">{s.detail}</span>
            </button>
          </li>
        ))}
      </ol>
      {step >= CS_STEPS.length - 1 ? (
        <Callout tone="warn" title="Overhead">
          The entire sequence performs zero useful work — this is the cost of context switching. Frequent switches waste CPU time.
        </Callout>
      ) : null}
    </div>
  );
}

/* ------------------------- Scheduling Queues ------------------------- */

const QUEUE_STEPS = [
  { pos: "job", text: "P1 is admitted from the job queue into the ready queue." },
  { pos: "ready", text: "P1 waits in the ready queue for the CPU." },
  { pos: "cpu", text: "The scheduler picks P1; the dispatcher loads it onto the CPU." },
  { pos: "io", text: "P1 requests I/O and moves to the waiting (device) queue." },
  { pos: "ready", text: "I/O completes; P1 returns to the ready queue." },
  { pos: "cpu", text: "P1 is dispatched again and finishes its CPU burst." },
  { pos: "done", text: "P1 terminates and leaves all queues." },
];

const QUEUE_NODES = ["job", "ready", "cpu", "io", "done"] as const;

export function SchedulingQueuesViz() {
  const [step, setStep] = useState(0);
  const pos = QUEUE_STEPS[step].pos;
  return (
    <div className={cn(card, "p-5")}>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Follow a process through the scheduling queues</p>
        <Button variant="primary" size="sm" onClick={() => setStep((s) => (s + 1) % QUEUE_STEPS.length)}>Next step →</Button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {QUEUE_NODES.map((n) => {
          const here = pos === n;
          const labels: Record<string, string> = { job: "Job Queue", ready: "Ready Queue", cpu: "CPU", io: "Waiting Queue (I/O)", done: "Terminated" };
          return (
            <div
              key={n}
              className={cn(
                "flex min-h-20 flex-col items-center justify-center gap-1 rounded-xl border p-3 text-center text-xs font-semibold transition-colors",
                here ? "border-indigo-500 bg-indigo-50 dark:border-indigo-500/50 dark:bg-indigo-500/10" : "border-slate-200 dark:border-slate-700",
              )}
            >
              <span className="text-slate-600 dark:text-slate-300">{labels[n]}</span>
              {here ? <span className={cn("rounded px-2 py-0.5 text-xs font-bold", processColor("P1").chip)}>P1</span> : null}
            </div>
          );
        })}
      </div>
      <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
        {QUEUE_STEPS[step].text}
      </p>
    </div>
  );
}

/* ------------------------- Process Tree ------------------------- */

interface TreeNode {
  id: string;
  parentId: string | null;
}

export function ProcessTreeViz() {
  const [nodes, setNodes] = useState<TreeNode[]>([{ id: "P1", parentId: null }]);
  const [selected, setSelected] = useState<string>("P1");
  const [counter, setCounter] = useState(2);

  const createChild = () => {
    const child: TreeNode = { id: `P${counter}`, parentId: selected };
    setNodes((n) => [...n, child]);
    setCounter((c) => c + 1);
    setSelected(child.id);
  };

  const terminate = () => {
    if (selected === "P1") return;
    const toRemove = new Set<string>([selected]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const n of nodes) {
        if (n.parentId && toRemove.has(n.parentId) && !toRemove.has(n.id)) {
          toRemove.add(n.id);
          changed = true;
        }
      }
    }
    const next = nodes.filter((n) => !toRemove.has(n.id));
    setNodes(next);
    setSelected("P1");
  };

  const childrenOf = (id: string) => nodes.filter((n) => n.parentId === id);

  return (
    <div className={cn(card, "p-5")}>
      <p className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">Interactive process tree</p>
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Create child processes and terminate branches. Root (P1) cannot be terminated.</p>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant="primary" size="sm" onClick={createChild}>Create child under {selected}</Button>
        <Button variant="danger" size="sm" onClick={terminate} disabled={selected === "P1"}>Terminate {selected}</Button>
        <Button variant="secondary" size="sm" onClick={() => { setNodes([{ id: "P1", parentId: null }]); setSelected("P1"); setCounter(2); }}>Reset tree</Button>
      </div>

      <div className="rounded-xl border border-slate-200 p-4 font-mono text-sm dark:border-slate-700">
        <TreeBranch id="P1" nodes={nodes} selected={selected} onSelect={setSelected} childrenOf={childrenOf} depth={0} />
      </div>

      <p className="mt-3 text-xs text-slate-400">
        A process tree reflects fork() relationships: each parent is responsible for its children. If a parent dies, its children are re-parented to init.
      </p>
    </div>
  );
}

function TreeBranch({
  id,
  nodes,
  selected,
  onSelect,
  childrenOf,
  depth,
}: {
  id: string;
  nodes: TreeNode[];
  selected: string;
  onSelect: (id: string) => void;
  childrenOf: (id: string) => TreeNode[];
  depth: number;
}) {
  const children = childrenOf(id);
  return (
    <div className={depth > 0 ? "ml-5 border-l border-slate-300 pl-4 dark:border-slate-600" : undefined}>
      <button
        type="button"
        onClick={() => onSelect(id)}
        className={cn(
          "my-1 rounded px-2 py-1 font-bold",
          selected === id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
        )}
      >
        {id}
      </button>
      {children.map((c) => (
        <TreeBranch key={c.id} id={c.id} nodes={nodes} selected={selected} onSelect={onSelect} childrenOf={childrenOf} depth={depth + 1} />
      ))}
    </div>
  );
}

/* ------------------------- Scheduler vs Dispatcher ------------------------- */

export function SchedulerDispatcherViz() {
  const [step, setStep] = useState(0);
  const steps = [
    { stage: "queue", text: "Ready queue holds P1 and P2." },
    { stage: "scheduler", text: "Scheduler: decides P2 should run next (e.g., shortest job)." },
    { stage: "dispatcher", text: "Dispatcher: loads P2's context (PC + registers) into the CPU." },
    { stage: "cpu", text: "CPU: P2 is now running." },
  ];
  const s = steps[step];
  return (
    <div className={cn(card, "p-5")}>
      <p className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">Scheduler decides — Dispatcher acts</p>
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Two different jobs, often confused. Step through to see the split.</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {steps.map((st, i) => (
          <div key={st.stage} className={cn("rounded-xl border p-3 text-center text-xs font-semibold", i === step ? "border-indigo-500 bg-indigo-50 dark:border-indigo-500/50 dark:bg-indigo-500/10" : "border-slate-200 dark:border-slate-700")}>
            {st.stage === "queue" && "Ready Queue"}
            {st.stage === "scheduler" && "🧭 Scheduler"}
            {st.stage === "dispatcher" && "🚚 Dispatcher"}
            {st.stage === "cpu" && "🖥️ CPU"}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button variant="primary" size="sm" onClick={() => setStep((x) => (x + 1) % steps.length)}>Next step →</Button>
        <p className="text-sm text-slate-600 dark:text-slate-300">{s.text}</p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-indigo-50 p-3 text-sm dark:bg-indigo-500/10">
          <p className="font-semibold text-indigo-700 dark:text-indigo-300">Scheduler</p>
          <p className="text-xs text-slate-600 dark:text-slate-300">Selects WHICH process runs next, using the policy (FCFS, SJF, RR…).</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-3 text-sm dark:bg-emerald-500/10">
          <p className="font-semibold text-emerald-700 dark:text-emerald-300">Dispatcher</p>
          <p className="text-xs text-slate-600 dark:text-slate-300">Gives the CPU to the chosen process: context switch, user mode, jump to PC.</p>
        </div>
      </div>
    </div>
  );
}
