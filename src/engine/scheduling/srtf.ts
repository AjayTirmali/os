import type { ProcessInput, SimulationResult } from "./types";
import { Recorder, assemble, makeById, pickShortest } from "./core";

/**
 * Shortest-Remaining-Time-First (preemptive SJF).
 * At every event (arrival or completion), the ready process with the smallest
 * *remaining* burst time runs. A shorter arrival preempts the running process.
 */
export function srtf(processes: ProcessInput[]): SimulationResult {
  const rec = new Recorder(processes);
  const byId = makeById(processes);
  let t = 0;

  while (!rec.allCompleted) {
    rec.setTime(t);
    rec.arriveAll();

    if (rec.running !== null) {
      const cur = rec.running;
      const curRem = rec.remaining.get(cur)!;
      const cand = pickShortest(rec.ready, rec.remaining, byId);
      if (cand && (rec.remaining.get(cand)! < curRem)) {
        rec.preempt(
          cur,
          `${cand} has remaining time ${rec.remaining.get(cand)}, which is less than ${cur}'s remaining time ${curRem}, so SRTF preempts ${cur}.`,
        );
      }
    }

    if (rec.running === null) {
      if (rec.ready.length > 0) {
        const id = pickShortest(rec.ready, rec.remaining, byId)!;
        const rem = rec.remaining.get(id)!;
        rec.dispatch(id, `${id} has the shortest remaining time (${rem}) among ready processes.`);
        continue;
      }
      const na = rec.nextArrivalTime;
      if (na === Infinity) break;
      rec.idle(na);
      t = na;
      continue;
    }

    const id = rec.running;
    const rem = rec.remaining.get(id)!;
    const na = rec.nextArrivalTime;
    if (na === Infinity) {
      t += rem;
      rec.setTime(t);
      rec.remaining.set(id, 0);
      rec.complete(id, `${id} finished — no more processes can arrive.`);
      continue;
    }
    const span = Math.min(rem, na - t);
    t = na;
    rec.setTime(t);
    rec.remaining.set(id, rem - span);
    if (rem - span === 0) {
      rec.complete(id, `${id} finished its remaining ${span} unit(s).`);
    }
    // Otherwise a new process has arrived; preemption is evaluated at the top of the loop.
  }

  return assemble("SRTF", processes, rec);
}
