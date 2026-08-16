import type { MLFQConfig, ProcessInput, SimulationOptions, SimulationResult } from "./types";
import { Recorder, assemble } from "./core";

export const DEFAULT_MLFQ_CONFIG: MLFQConfig = {
  levels: 3,
  quanta: [2, 4, 8],
  agingAfter: 8,
  priorityMode: "LOWER_NUMBER",
};

/**
 * Multilevel Feedback Queue.
 * New processes enter the highest-priority queue. Each level has its own
 * (growing) quantum; a process that uses its full quantum is demoted to the
 * next lower level. Lower levels only run when higher levels are empty
 * (preemptive). Processes that wait too long are promoted (aging) to avoid
 * starvation.
 */
export function mlfq(processes: ProcessInput[], options: SimulationOptions = {}): SimulationResult {
  const cfg: MLFQConfig = { ...DEFAULT_MLFQ_CONFIG, ...(options.mlfq ?? {}) };
  const levels = Math.max(1, cfg.levels);
  const quanta = Array.from({ length: levels }, (_, i) => cfg.quanta[i] ?? cfg.quanta[cfg.quanta.length - 1] ?? 4);
  const qFor = (i: number) => quanta[i];

  const rec = new Recorder(processes);
  const ready: string[][] = Array.from({ length: levels }, () => []);
  const levelOf = new Map<string, number>();
  const sliceLeft = new Map<string, number>();
  const waited = new Map<string, number>();
  let runningLevel = -1;
  let t = 0;

  const sync = () => {
    rec.ready = ready.flat();
    rec.lastQueues = ready.map((list, i) => ({ id: `Q${i}`, name: `Queue ${i}`, processes: [...list] }));
  };

  const enqueue = (id: string, level: number) => {
    ready[level].push(id);
    levelOf.set(id, level);
    if (!waited.has(id)) waited.set(id, t);
  };

  const highestNonEmpty = (): number => {
    for (let i = 0; i < levels; i++) if (ready[i].length > 0) return i;
    return -1;
  };

  while (!rec.allCompleted) {
    rec.setTime(t);

    while (rec.nextArrival < rec.arrivals.length && rec.arrivals[rec.nextArrival].arrivalTime <= t) {
      const p = rec.arrivals[rec.nextArrival++];
      rec.remaining.set(p.id, p.burstTime);
      enqueue(p.id, 0);
      sync();
      rec.record("ARRIVAL", `${p.id} arrived and entered Queue 0 (highest priority).`, `New processes in MLFQ always start in the top queue.`);
    }

    // Aging: promote processes that have waited too long at a lower level.
    const promoted: string[] = [];
    for (let l = 1; l < levels; l++) {
      for (const id of [...ready[l]]) {
        if (waited.has(id) && t - (waited.get(id) as number) >= cfg.agingAfter) {
          ready[l] = ready[l].filter((x) => x !== id);
          enqueue(id, 0);
          promoted.push(id);
        }
      }
    }
    if (promoted.length) {
      sync();
      rec.record("AGING", `${promoted.join(", ")} waited too long and was promoted back to Queue 0.`, `Aging gradually raises the priority of starving processes to prevent indefinite blocking.`);
    }

    // Preemption: a higher queue became non-empty while a lower one was running.
    if (rec.running !== null && runningLevel >= 0) {
      const higher = highestNonEmpty();
      if (higher >= 0 && higher < runningLevel) {
        const id = rec.running;
        const kept = sliceLeft.get(id) ?? 0;
        rec.closeRun();
        runningLevel = -1;
        ready[levelOf.get(id)!].push(id);
        sliceLeft.set(id, kept);
        waited.set(id, t);
        sync();
        rec.record("PREEMPT", `${id} is preempted by a process arriving in the higher-priority Queue ${higher}.`, `MLFQ is preemptive across levels — a higher queue always runs before lower queues.`);
      }
    }

    if (rec.running === null) {
      const lvl = highestNonEmpty();
      if (lvl >= 0) {
        const id = ready[lvl][0];
        ready[lvl] = ready[lvl].filter((x) => x !== id);
        runningLevel = lvl;
        waited.delete(id);
        if (!sliceLeft.has(id) || levelOf.get(id) !== lvl) sliceLeft.set(id, qFor(lvl));
        sync();
        rec.dispatch(id, `${id} is running from Queue ${lvl} (quantum ${qFor(lvl)}).`);
        continue;
      }
      const na = rec.nextArrivalTime;
      if (na === Infinity) break;
      rec.idle(na);
      t = na;
      continue;
    }

    const id = rec.running;
    const lvl = runningLevel;
    const rem = rec.remaining.get(id)!;
    const slice = sliceLeft.get(id) ?? qFor(lvl);
    const na = rec.nextArrivalTime;
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
    sliceLeft.set(id, slice - runFor);

    if (rem - runFor === 0) {
      rec.complete(id, `${id} completed in Queue ${lvl}.`);
      runningLevel = -1;
    } else if (sliceLeft.get(id)! <= 0) {
      rec.closeRun();
      runningLevel = -1;
      const nextLevel = Math.min(levels - 1, lvl + 1);
      enqueue(id, nextLevel);
      sliceLeft.delete(id);
      sync();
      rec.record(
        lvl < levels - 1 ? "DEMOTED" : "QUANTUM_EXPIRED",
        lvl < levels - 1
          ? `${id} used its full quantum in Queue ${lvl} and is demoted to Queue ${nextLevel}.`
          : `${id} used its full quantum in the lowest queue and returns to the back of Queue ${lvl}.`,
        lvl < levels - 1
          ? `CPU-bound processes move down, giving interactive processes faster service.`
          : `In the lowest queue the process runs round-robin until it finishes.`,
      );
    }
    // Else an arrival occurred mid-slice; MLFQ continues the running process.
  }

  return assemble("MLFQ", processes, rec);
}
