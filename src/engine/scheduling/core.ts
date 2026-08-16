import type {
  GanttSegment,
  ProcessInput,
  QueueState,
  SchedulingDecision,
  SimulationResult,
  SimulationStep,
  StepEvent,
} from "./types";
import { computeMetricsFromSegments } from "./metrics";

/** Clip a full segment list down to everything that has happened by `time`. */
export function snapshot(segments: GanttSegment[], time: number): GanttSegment[] {
  const out: GanttSegment[] = [];
  for (const s of segments) {
    if (s.end <= time) {
      out.push({ processId: s.processId, start: s.start, end: s.end });
    } else if (s.start < time) {
      out.push({ processId: s.processId, start: s.start, end: time });
    }
  }
  return out;
}

interface PendingEvent {
  time: number;
  runningProcessId: string | null;
  readyQueue: string[];
  completedProcesses: string[];
  event: StepEvent;
  explanation: string;
  internalExplanation: string;
  why?: string;
  gantt: GanttSegment[];
  queues?: QueueState[];
}

/**
 * A small stateful recorder that the algorithms drive. It owns the mutable
 * simulation state (remaining time, ready queue, running process, timeline)
 * and produces a chronological event log with snapshots.
 */
export class Recorder {
  processes: ProcessInput[];
  remaining = new Map<string, number>();
  ready: string[] = [];
  completed: string[] = [];
  running: string | null = null;
  runStart = 0;
  segments: GanttSegment[] = [];
  events: PendingEvent[] = [];
  arrivals: ProcessInput[];
  nextArrival = 0;
  time = 0;
  lastQueues: QueueState[] | undefined;

  constructor(processes: ProcessInput[]) {
    this.processes = processes;
    this.arrivals = [...processes].sort(
      (a, b) => a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id),
    );
    for (const p of processes) this.remaining.set(p.id, p.burstTime);
  }

  get allCompleted(): boolean {
    return this.completed.length === this.processes.length;
  }

  get nextArrivalTime(): number {
    return this.nextArrival < this.arrivals.length ? this.arrivals[this.nextArrival].arrivalTime : Infinity;
  }

  setTime(t: number): void {
    this.time = t;
  }

  arriveAll(): void {
    while (this.nextArrival < this.arrivals.length && this.arrivals[this.nextArrival].arrivalTime <= this.time) {
      const p = this.arrivals[this.nextArrival++];
      this.remaining.set(p.id, p.burstTime);
      this.ready.push(p.id);
      this.record(
        "ARRIVAL",
        `${p.id} arrived (AT=${p.arrivalTime}, BT=${p.burstTime}).`,
        `The OS creates a process image for ${p.id} and inserts its PCB into the ready queue.`,
      );
    }
  }

  dispatch(id: string, why?: string): void {
    this.ready = this.ready.filter((x) => x !== id);
    if (this.running !== null) this.closeRun();
    this.running = id;
    this.runStart = this.time;
    this.record(
      "DISPATCH",
      `${id} dispatched to the CPU.`,
      `The dispatcher loads ${id}'s context (program counter + registers) from its PCB into the CPU.`,
      why,
    );
  }

  closeRun(): void {
    if (this.running === null) return;
    if (this.time > this.runStart) {
      this.segments.push({ processId: this.running, start: this.runStart, end: this.time });
    }
    this.running = null;
  }

  complete(id: string, why?: string): void {
    this.closeRun();
    this.completed.push(id);
    this.record(
      "COMPLETION",
      `${id} finished execution.`,
      `The OS reclaims ${id}'s resources, removes its PCB, and returns its exit status to its parent.`,
      why,
    );
  }

  preempt(id: string, why?: string): void {
    this.closeRun();
    this.ready.push(id);
    this.record(
      "PREEMPT",
      `${id} is preempted and returned to the ready queue.`,
      `The scheduler saves ${id}'s state into its PCB, then moves ${id} back to the ready queue.`,
      why,
    );
  }

  quantumExpired(id: string, why?: string): void {
    this.closeRun();
    this.ready.push(id);
    this.record(
      "QUANTUM_EXPIRED",
      `${id}'s time quantum expired.`,
      `A timer interrupt fires; the scheduler saves ${id}'s context and moves ${id} to the back of the ready queue.`,
      why,
    );
  }

  idle(until: number): void {
    this.record(
      "IDLE",
      `CPU idle until t=${until} — no process is ready.`,
      `The CPU runs the OS idle loop; the scheduler has no runnable process to select.`,
    );
  }

  /** Record an arbitrary event using the current simulation state. */
  record(event: StepEvent, explanation: string, internal: string, why?: string): void {
    this.events.push({
      time: this.time,
      runningProcessId: this.running,
      readyQueue: [...this.ready],
      completedProcesses: [...this.completed],
      event,
      explanation,
      internalExplanation: internal,
      why,
      gantt: this.snapshotGantt(),
      queues: this.lastQueues,
    });
  }

  private snapshotGantt(): GanttSegment[] {
    const segs = snapshot(this.segments, this.time);
    if (this.running !== null && this.time > this.runStart) {
      segs.push({ processId: this.running, start: this.runStart, end: this.time });
    }
    return segs;
  }
}

export function assemble(
  algorithm: SimulationResult["algorithm"],
  processes: ProcessInput[],
  rec: Recorder,
): SimulationResult {
  const steps: SimulationStep[] = rec.events.map((e) => ({
    time: e.time,
    runningProcessId: e.runningProcessId,
    readyQueue: e.readyQueue,
    completedProcesses: e.completedProcesses,
    event: e.event,
    explanation: e.explanation,
    internalExplanation: e.internalExplanation,
    why: e.why,
    gantt: e.gantt,
    queues: e.queues,
  }));

  const m = computeMetricsFromSegments(processes, rec.segments);

  const decisionEvents: StepEvent[] = ["DISPATCH", "PREEMPT", "QUANTUM_EXPIRED", "PROMOTED", "DEMOTED", "AGING"];
  const decisions: SchedulingDecision[] = rec.events
    .filter((e) => Boolean(e.why) || decisionEvents.includes(e.event))
    .map((e) => ({ time: e.time, reason: e.explanation, why: e.why }));

  return {
    algorithm,
    steps,
    gantt: rec.segments,
    processMetrics: m.metrics,
    averages: m.averages,
    contextSwitches: m.contextSwitches,
    cpuUtilization: m.cpuUtilization,
    throughput: m.throughput,
    totalTime: m.totalTime,
    decisions,
  };
}

export function makeById(processes: ProcessInput[]): Map<string, ProcessInput> {
  return new Map(processes.map((p) => [p.id, p]));
}

export function pickShortest(
  ready: string[],
  remaining: Map<string, number>,
  byId: Map<string, ProcessInput>,
): string | null {
  if (ready.length === 0) return null;
  let best = ready[0];
  for (const id of ready) {
    const rId = remaining.get(id) ?? Infinity;
    const rBest = remaining.get(best) ?? Infinity;
    if (rId < rBest) {
      best = id;
      continue;
    }
    if (rId === rBest) {
      const a = byId.get(id)!;
      const b = byId.get(best)!;
      if (a.arrivalTime < b.arrivalTime) best = id;
      else if (a.arrivalTime === b.arrivalTime && a.id < b.id) best = id;
    }
  }
  return best;
}

export function pickPriority(
  ready: string[],
  byId: Map<string, ProcessInput>,
  mode: "LOWER_NUMBER" | "HIGHER_NUMBER",
): string | null {
  if (ready.length === 0) return null;
  let best = ready[0];
  for (const id of ready) {
    const a = byId.get(id)!;
    const b = byId.get(best)!;
    const pa = a.priority ?? 0;
    const pb = b.priority ?? 0;
    if (pa === pb) {
      if (a.arrivalTime < b.arrivalTime) best = id;
      else if (a.arrivalTime === b.arrivalTime && a.id < b.id) best = id;
      continue;
    }
    if (mode === "LOWER_NUMBER" ? pa < pb : pa > pb) best = id;
  }
  return best;
}

export function priorityBetter(pa: number, pb: number, mode: "LOWER_NUMBER" | "HIGHER_NUMBER"): boolean {
  return mode === "LOWER_NUMBER" ? pa < pb : pa > pb;
}
