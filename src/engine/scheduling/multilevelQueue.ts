import type { ProcessInput, QueueConfig, SimulationOptions, SimulationResult } from "./types";
import { Recorder, assemble } from "./core";

export const DEFAULT_MLQ_QUEUES: QueueConfig[] = [
  { id: "Q0", name: "System", algorithm: "FCFS", priority: 0 },
  { id: "Q1", name: "Interactive", algorithm: "RR", quantum: 2, priority: 1 },
  { id: "Q2", name: "Batch", algorithm: "FCFS", priority: 2 },
];

/**
 * Multilevel Queue.
 * Processes are permanently assigned to a queue (via their Priority value:
 * 1 -> Q0, 2 -> Q1, …). Queues are served in strict priority order; each queue
 * runs its own policy (FCFS or RR). A higher-priority arrival preempts a
 * lower-priority running process.
 */
export function multilevelQueue(processes: ProcessInput[], options: SimulationOptions = {}): SimulationResult {
  const rec = new Recorder(processes);
  const queues = options.queues && options.queues.length ? options.queues : DEFAULT_MLQ_QUEUES;

  const qIndex = new Map<string, number>();
  for (const p of processes) {
    const prio = p.priority ?? 1;
    qIndex.set(p.id, Math.max(0, Math.min(queues.length - 1, prio - 1)));
  }

  const ready: string[][] = queues.map(() => []);
  const sliceLeft = new Map<string, number>();
  let runningQueue = -1;
  let t = 0;

  const sync = () => {
    rec.ready = ready.flat();
    rec.lastQueues = queues.map((q, i) => ({ id: q.id, name: q.name, processes: [...ready[i]] }));
  };

  const highestNonEmpty = (): number => {
    for (let i = 0; i < ready.length; i++) if (ready[i].length > 0) return i;
    return -1;
  };

  while (!rec.allCompleted) {
    rec.setTime(t);

    while (rec.nextArrival < rec.arrivals.length && rec.arrivals[rec.nextArrival].arrivalTime <= t) {
      const p = rec.arrivals[rec.nextArrival++];
      rec.remaining.set(p.id, p.burstTime);
      ready[qIndex.get(p.id)!].push(p.id);
      sync();
      rec.record(
        "ARRIVAL",
        `${p.id} arrived and entered the ${queues[qIndex.get(p.id)!].name} queue.`,
        `The OS places ${p.id}'s PCB into its permanently-assigned queue.`,
      );
    }

    // Preemption across queues: a higher-priority queue became non-empty.
    if (rec.running !== null && runningQueue >= 0) {
      const higher = highestNonEmpty();
      if (higher >= 0 && higher < runningQueue) {
        const id = rec.running;
        rec.closeRun();
        runningQueue = -1;
        ready[qIndex.get(id)!].push(id);
        sync();
        rec.record(
          "PREEMPT",
          `${id} is preempted: a process arrived in the higher-priority ${queues[higher].name} queue.`,
          `MLQ always serves the highest-priority queue first, so ${id} is paused and returned to the ${queues[qIndex.get(id)!].name} queue.`,
        );
      }
    }

    if (rec.running === null) {
      const qi = highestNonEmpty();
      if (qi >= 0) {
        const q = queues[qi];
        const id = ready[qi][0];
        ready[qi] = ready[qi].filter((x) => x !== id);
        runningQueue = qi;
        if (q.algorithm === "RR") sliceLeft.set(id, q.quantum ?? 2);
        sync();
        rec.dispatch(id, `The ${q.name} queue is the highest-priority non-empty queue, so MLQ selects ${id}.`);
        continue;
      }
      const na = rec.nextArrivalTime;
      if (na === Infinity) break;
      rec.idle(na);
      t = na;
      continue;
    }

    const id = rec.running;
    const qi = runningQueue;
    const q = queues[qi];
    const rem = rec.remaining.get(id)!;
    const na = rec.nextArrivalTime;
    const isRR = q.algorithm === "RR";
    const slice = isRR ? sliceLeft.get(id)! : Infinity;
    const limit = na === Infinity ? Math.min(rem, slice) : Math.min(rem, slice, na - t);
    const runFor = limit;

    if (runFor <= 0) {
      t += 1;
      rec.setTime(t);
      continue;
    }

    t += runFor;
    rec.setTime(t);
    rec.remaining.set(id, rem - runFor);
    if (isRR) sliceLeft.set(id, slice - runFor);

    if (rem - runFor === 0) {
      rec.complete(id, `${id} completed in the ${q.name} queue.`);
      runningQueue = -1;
    } else if (isRR && sliceLeft.get(id)! <= 0) {
      rec.closeRun();
      runningQueue = -1;
      ready[qi].push(id);
      sync();
      rec.record(
        "QUANTUM_EXPIRED",
        `${id}'s time quantum (${q.quantum}) expired in the ${q.name} queue.`,
        `The scheduler moves ${id} to the back of the ${q.name} queue.`,
      );
    }
    // Else an arrival occurred mid-slice; MLQ continues the running process.
  }

  return assemble("MLQ", processes, rec);
}
