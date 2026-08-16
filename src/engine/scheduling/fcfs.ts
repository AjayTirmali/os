import type { ProcessInput, SimulationResult } from "./types";
import { Recorder, assemble } from "./core";

/**
 * First-Come, First-Served (non-preemptive).
 * Selects the process that arrived first (front of the ready queue),
 * runs it to completion, and never preempts on arrival.
 */
export function fcfs(processes: ProcessInput[]): SimulationResult {
  const rec = new Recorder(processes);
  let t = 0;

  while (!rec.allCompleted) {
    rec.setTime(t);
    rec.arriveAll();

    if (rec.running === null) {
      if (rec.ready.length > 0) {
        const id = rec.ready[0];
        rec.dispatch(id, `${id} is at the front of the ready queue (it arrived first), so FCFS selects it.`);
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
      rec.complete(id, `${id} is the running process and has finished its CPU burst.`);
    }
    // If an arrival is now due, FCFS is non-preemptive so the running process keeps the CPU.
  }

  return assemble("FCFS", processes, rec);
}
