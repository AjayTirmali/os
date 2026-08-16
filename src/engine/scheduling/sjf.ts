import type { ProcessInput, SimulationResult } from "./types";
import { Recorder, assemble, makeById, pickShortest } from "./core";

/**
 * Shortest-Job-First (non-preemptive).
 * At each scheduling decision, picks the ready process with the smallest
 * burst time and runs it to completion.
 */
export function sjf(processes: ProcessInput[]): SimulationResult {
  const rec = new Recorder(processes);
  const byId = makeById(processes);
  let t = 0;

  while (!rec.allCompleted) {
    rec.setTime(t);
    rec.arriveAll();

    if (rec.running === null) {
      if (rec.ready.length > 0) {
        const id = pickShortest(rec.ready, rec.remaining, byId)!;
        const bt = byId.get(id)!.burstTime;
        rec.dispatch(id, `${id} has the shortest burst time (${bt}) among ready processes, so SJF selects it.`);
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
    const span = na === Infinity ? rem : Math.min(rem, na - t);

    t += span;
    rec.setTime(t);
    rec.remaining.set(id, rem - span);

    if (rem - span === 0) {
      rec.complete(id, `${id} has finished its (shortest-selected) burst.`);
    }
  }

  return assemble("SJF", processes, rec);
}
