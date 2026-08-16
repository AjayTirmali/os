"use client";

import { useEffect, useRef, useState } from "react";
import { cn, processColor } from "@/lib/utils";
import { Badge, Button, Callout, card } from "@/components/common/ui";

/* ------------------------- IPC (shared memory vs message passing) ------------------------- */

export function IPCViz() {
  const [tab, setTab] = useState<"shared" | "message">("shared");

  return (
    <div className={cn(card, "p-5")}>
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("shared")}
          className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", tab === "shared" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300")}
        >
          Shared Memory
        </button>
        <button
          type="button"
          onClick={() => setTab("message")}
          className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", tab === "message" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300")}
        >
          Message Passing
        </button>
      </div>
      {tab === "shared" ? <SharedMemoryViz /> : <MessagePassingViz />}
    </div>
  );
}

function SharedMemoryViz() {
  const [step, setStep] = useState(0);
  const steps = [
    "P1 and P2 have attached the same shared memory region.",
    "P1 writes the value 42 into the shared region (no kernel copy).",
    "P2 reads 42 from the shared region — communication complete.",
  ];
  return (
    <div>
      <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <ProcessNode id="P1" active={step === 1} />
        <div className="flex flex-col items-center gap-1 text-xs font-semibold text-slate-500">
          <span>↑ write</span>
          <div
            className={cn(
              "flex h-24 w-40 flex-col items-center justify-center rounded-xl border-2 border-dashed text-sm font-bold transition-colors",
              step >= 1 ? "border-indigo-400 bg-indigo-50 dark:border-indigo-500/50 dark:bg-indigo-500/10" : "border-slate-300 dark:border-slate-700",
            )}
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Shared Memory</span>
            <span className="mt-1 font-mono text-xl text-indigo-600 dark:text-indigo-300">{step >= 1 ? "42" : "—"}</span>
          </div>
          <span>read ↓</span>
        </div>
        <ProcessNode id="P2" active={step === 2} />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button variant="primary" size="sm" onClick={() => setStep((s) => (s + 1) % steps.length)}>Next step →</Button>
        <p className="text-sm text-slate-600 dark:text-slate-300">{steps[step]}</p>
      </div>
      <Callout tone="info" title="Key idea">
        After the region is set up, the kernel is <em>not</em> involved per access — this makes shared memory fast, but the processes must synchronize themselves.
      </Callout>
    </div>
  );
}

function MessagePassingViz() {
  const [step, setStep] = useState(0);
  const stages = [
    { n: "P1", active: step === 0 },
    { n: "msg", active: step === 1 },
    { n: "kernel", active: step === 2 },
    { n: "P2", active: step === 3 },
  ];
  const steps = [
    "P1 prepares a message to send to P2.",
    "P1 calls send(msg) — the message leaves P1.",
    "The kernel copies the message into the channel/mailbox.",
    "P2 calls receive() and gets the message.",
  ];
  return (
    <div>
      <div className="grid items-center gap-2 sm:grid-cols-4">
        <ProcessNode id="P1" active={stage(0)} />
        <div className={cn("flex h-20 flex-col items-center justify-center rounded-xl border-2 text-center text-xs font-semibold transition-colors", step >= 1 ? "border-indigo-400 bg-indigo-50 dark:border-indigo-500/50 dark:bg-indigo-500/10" : "border-slate-300 dark:border-slate-700")}>
          <span aria-hidden>💌</span> Message
        </div>
        <div className={cn("flex h-20 flex-col items-center justify-center rounded-xl border-2 text-center text-xs font-semibold transition-colors", step >= 2 ? "border-indigo-400 bg-indigo-50 dark:border-indigo-500/50 dark:bg-indigo-500/10" : "border-slate-300 dark:border-slate-700")}>
          <span aria-hidden>🛡️</span> Kernel / Channel
        </div>
        <ProcessNode id="P2" active={step === 3} />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button variant="primary" size="sm" onClick={() => setStep((s) => (s + 1) % steps.length)}>Next step →</Button>
        <p className="text-sm text-slate-600 dark:text-slate-300">{steps[step]}</p>
      </div>
      <Callout tone="info" title="Key idea">
        The kernel mediates the exchange and copies data between address spaces — safer and cleaner, but slower than shared memory.
      </Callout>
      <span className="hidden">{stages.length}</span>
    </div>
  );

  function stage(i: number) {
    return stages[i].active;
  }
}

function ProcessNode({ id, active }: { id: string; active: boolean }) {
  return (
    <div className={cn("flex h-20 items-center justify-center rounded-xl border-2 transition-colors", active ? "border-indigo-500 bg-indigo-50 dark:border-indigo-500/50 dark:bg-indigo-500/10" : "border-slate-200 dark:border-slate-700")}>
      <span className={cn("rounded px-3 py-1 text-sm font-bold", processColor(id).chip)}>{id}</span>
    </div>
  );
}

/* ------------------------- Producer / Consumer ------------------------- */

export function ProducerConsumerViz() {
  const BUFFER_SIZE = 6;
  const [buffer, setBuffer] = useState<(string | null)[]>(Array(BUFFER_SIZE).fill(null));
  const [nextItem, setNextItem] = useState(0);
  const [auto, setAuto] = useState(false);
  const [message, setMessage] = useState("Produce an item or consume one to see the bounded buffer in action.");
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toggleRef = useRef(false);

  const produce = () => {
    setBuffer((buf) => {
      const idx = buf.indexOf(null);
      if (idx === -1) {
        setMessage("Buffer is FULL — the producer must wait for space.");
        return buf;
      }
      const letter = String.fromCharCode(65 + (nextItem % 26));
      const next = [...buf];
      next[idx] = letter;
      setMessage(`Producer added item "${letter}".`);
      return next;
    });
    setNextItem((n) => n + 1);
  };

  const consume = () => {
    setBuffer((buf) => {
      const idx = buf.findIndex((x) => x !== null);
      if (idx === -1) {
        setMessage("Buffer is EMPTY — the consumer must wait for an item.");
        return buf;
      }
      const item = buf[idx];
      const next = [...buf];
      next[idx] = null;
      setMessage(`Consumer removed item "${item}".`);
      return next;
    });
  };

  useEffect(() => {
    if (!auto) {
      if (autoRef.current) clearInterval(autoRef.current);
      return;
    }
    autoRef.current = setInterval(() => {
      toggleRef.current = !toggleRef.current;
      if (toggleRef.current) produce();
      else consume();
    }, 700);
    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto]);

  const full = buffer.every((x) => x !== null);
  const empty = buffer.every((x) => x === null);

  return (
    <div className={cn(card, "p-5")}>
      <p className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">Producer-Consumer bounded buffer</p>
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">The producer waits when the buffer is full; the consumer waits when empty.</p>

      <div className="mb-4 flex items-center gap-3">
        <span className={cn("rounded-lg px-3 py-2 text-sm font-bold", processColor("P1").chip)}>Producer</span>
        <span className="text-slate-400">↓</span>
        <div className="flex gap-1">
          {buffer.map((slot, i) => (
            <div
              key={i}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-lg border-2 text-lg font-bold transition-colors",
                slot ? "border-indigo-400 bg-indigo-100 text-indigo-700 dark:border-indigo-500/50 dark:bg-indigo-500/20 dark:text-indigo-200" : "border-dashed border-slate-300 dark:border-slate-600",
              )}
            >
              {slot ?? ""}
            </div>
          ))}
        </div>
        <span className="text-slate-400">↓</span>
        <span className={cn("rounded-lg px-3 py-2 text-sm font-bold", processColor("P2").chip)}>Consumer</span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant="primary" size="sm" onClick={produce} disabled={full}>Produce</Button>
        <Button variant="secondary" size="sm" onClick={consume} disabled={empty}>Consume</Button>
        <Button variant={auto ? "danger" : "outline"} size="sm" onClick={() => setAuto((a) => !a)}>{auto ? "⏸ Pause" : "▶ Auto"}</Button>
        <Button variant="ghost" size="sm" onClick={() => { setBuffer(Array(BUFFER_SIZE).fill(null)); setNextItem(0); setAuto(false); setMessage("Buffer reset."); }}>Reset</Button>
      </div>

      <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
        {message}
      </p>
      <p className="mt-2 text-xs text-slate-400">Slots used: {buffer.filter((x) => x !== null).length} / {BUFFER_SIZE}. In a real system, semaphores (empty, full, mutex) prevent the producer and consumer from corrupting the buffer.</p>
    </div>
  );
}

/* ------------------------- Threads ------------------------- */

export function ThreadsViz() {
  const [selected, setSelected] = useState<number>(0);
  const threads = ["T1", "T2", "T3", "T4"];
  const shared = [
    { name: "Code (Text)", detail: "The executable instructions, shared by all threads." },
    { name: "Data", detail: "Global/static variables, shared by all threads." },
    { name: "Heap", detail: "Dynamically allocated memory, shared by all threads." },
    { name: "Open files", detail: "File descriptors are shared across threads." },
  ];
  const privatePer = [
    { name: "Program counter", detail: "Where this thread is in its code." },
    { name: "Registers", detail: "This thread's CPU register values." },
    { name: "Stack", detail: "This thread's function calls & local variables." },
  ];

  return (
    <div className={cn(card, "p-5")}>
      <p className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">Threads inside a process</p>
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Threads share the process's resources but each has its own execution context.</p>

      <div className="rounded-xl border-2 border-slate-200 p-4 dark:border-slate-700">
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-lg bg-slate-200 px-3 py-1 text-sm font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">Process</span>
          <span className="text-xs text-slate-400">shared address space</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {threads.map((t, i) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelected(i)}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-bold transition-colors",
                selected === i ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/5">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            <span aria-hidden>👥</span> Shared by all threads
          </p>
          <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
            {shared.map((s) => (
              <li key={s.name} className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-500" aria-hidden>✓</span>
                <span><strong>{s.name}</strong> — {s.detail}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-500/30 dark:bg-indigo-500/5">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
            <span aria-hidden>🔒</span> Private to each thread
          </p>
          <p className="mb-2 text-xs font-medium text-indigo-600 dark:text-indigo-300">Currently inspecting {threads[selected]}:</p>
          <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
            {privatePer.map((s) => (
              <li key={s.name} className="flex items-start gap-2">
                <span className="mt-0.5 text-indigo-500" aria-hidden>•</span>
                <span><strong>{s.name}</strong> — {s.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ------------------------- Threading models ------------------------- */

interface ModelSpec {
  id: string;
  name: string;
  user: number;
  kernel: number;
  map: (i: number) => number;
  bindings?: number[];
  adv: string[];
  dis: string[];
  example: string;
}

const MODELS: ModelSpec[] = [
  {
    id: "m2o",
    name: "Many-to-One",
    user: 4,
    kernel: 1,
    map: () => 0,
    adv: ["Very cheap thread switching (no kernel mode)", "Portable to any OS"],
    dis: ["One blocking call blocks the whole process", "No parallelism on multiple cores"],
    example: "Solaris Green Threads (historical)",
  },
  {
    id: "o2o",
    name: "One-to-One",
    user: 3,
    kernel: 3,
    map: (i) => i,
    adv: ["True parallelism across cores", "One blocked thread doesn't block others"],
    dis: ["Thread creation/switch is costly (system call)", "Many threads → kernel overhead"],
    example: "Linux, Windows",
  },
  {
    id: "m2m",
    name: "Many-to-Many",
    user: 5,
    kernel: 2,
    map: (i) => i % 2,
    adv: ["Flexible: parallel when possible, cheap when not", "Good balance of parallelism and overhead"],
    dis: ["More complex to implement"],
    example: "Older Solaris, HP-UX",
  },
  {
    id: "two",
    name: "Two-Level",
    user: 4,
    kernel: 2,
    map: (i) => i % 2,
    bindings: [0],
    adv: ["Allows a critical thread to be bound to a dedicated kernel thread", "Combines flexibility + guarantee"],
    dis: ["Most complex model"],
    example: "IRIX, HP-UX",
  },
];

export function ThreadModelsViz() {
  const [modelId, setModelId] = useState("m2o");
  const model = MODELS.find((m) => m.id === modelId)!;

  const userXs = (i: number) => 40 + (i * (320 / Math.max(1, model.user - 1)));
  const kernelXs = (i: number) => 40 + (i * (320 / Math.max(1, model.kernel - 1)));

  return (
    <div className={cn(card, "p-5")}>
      <p className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">How user threads map to kernel threads</p>
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Select a model to see its mapping, trade-offs, and a real-world example.</p>

      <div className="mb-4 flex flex-wrap gap-2">
        {MODELS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setModelId(m.id)}
            className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", modelId === m.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300")}
          >
            {m.name}
          </button>
        ))}
      </div>

      <svg viewBox="0 0 400 180" className="w-full max-w-md" role="img" aria-label={`${model.name} thread mapping`}>
        {Array.from({ length: model.user }).map((_, i) => {
          const k = model.map(i);
          const bound = model.bindings?.includes(i);
          return (
            <line
              key={i}
              x1={userXs(i)}
              y1={50}
              x2={kernelXs(k)}
              y2={130}
              stroke={bound ? "#f59e0b" : "#6366f1"}
              strokeWidth={bound ? 3 : 1.5}
            />
          );
        })}
        {Array.from({ length: model.user }).map((_, i) => (
          <g key={`u${i}`}>
            <circle cx={userXs(i)} cy={42} r="14" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1.5" />
            <text x={userXs(i)} y={46} textAnchor="middle" className="fill-indigo-700 text-[11px] font-bold">U{i + 1}</text>
          </g>
        ))}
        {Array.from({ length: model.kernel }).map((_, i) => (
          <g key={`k${i}`}>
            <rect x={kernelXs(i) - 14} y={130} width="28" height="28" rx="6" fill="#d1fae5" stroke="#10b981" strokeWidth="1.5" />
            <text x={kernelXs(i)} y={149} textAnchor="middle" className="fill-emerald-700 text-[10px] font-bold">K{i + 1}</text>
          </g>
        ))}
        <text x={200} y={16} textAnchor="middle" className="fill-slate-500 text-[10px]">User threads</text>
        <text x={200} y={174} textAnchor="middle" className="fill-slate-500 text-[10px]">Kernel threads</text>
      </svg>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-500/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Advantages</p>
          <ul className="mt-1 space-y-1 text-sm text-slate-600 dark:text-slate-300">
            {model.adv.map((a) => <li key={a}>• {a}</li>)}
          </ul>
        </div>
        <div className="rounded-lg bg-rose-50 p-3 dark:bg-rose-500/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">Disadvantages</p>
          <ul className="mt-1 space-y-1 text-sm text-slate-600 dark:text-slate-300">
            {model.dis.map((d) => <li key={d}>• {d}</li>)}
          </ul>
        </div>
        <div className="rounded-lg bg-indigo-50 p-3 dark:bg-indigo-500/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Real example</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{model.example}</p>
        </div>
      </div>
    </div>
  );
}
