import type { ProcessInput, SimulationResult } from "./types";
import { Recorder, assemble } from "./core";

/**
 * Round Robin (preemptive, time-sliced).
 * Processes run for at most `timeQuantum` units, then move to the back of the
 * FIFO ready queue. New arrivals are appended to the back of the queue.
 */
export function roundRobin(processes: ProcessInput[], timeQuantum: number): SimulationResult {
  const rec = new Recorder(processes);
  const q = timeQuantum;
  let t = 0;
  let quantumLeft = q;

  while (!rec.allCompleted) {
    rec.setTime(t);
    rec.arriveAll();

    if (rec.running === null) {
      if (rec.ready.length > 0) {
        const id = rec.ready[0];
        quantumLeft = q;
        rec.dispatch(id, `Round Robin picks the front of the FIFO ready queue: ${id}.`);
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
    const limit = na === Infinity ? Math.min(rem, quantumLeft) : Math.min(rem, quantumLeft, na - t);
    const runFor = limit;

    if (runFor <= 0) {
      t += 1;
      rec.setTime(t);
      continue;
    }

    t += runFor;
    rec.setTime(t);
    rec.remaining.set(id, rem - runFor);
    quantumLeft -= runFor;

    if (rem - runFor === 0) {
      rec.complete(id, `${id} completed within its time slice.`);
    } else if (quantumLeft === 0) {
      rec.quantumExpired(id, `${id}'s time quantum of ${q} units expired.`);
    }
    // Else a new arrival occurred mid-slice; RR does not preempt on arrival.
  }

  return assemble("ROUND_ROBIN", processes, rec);
}
