import type { PriorityMode, ProcessInput, SimulationResult } from "./types";
import { Recorder, assemble, makeById, pickPriority, priorityBetter } from "./core";

function priorityCore(
  processes: ProcessInput[],
  preemptive: boolean,
  mode: PriorityMode,
): SimulationResult {
  const rec = new Recorder(processes);
  const byId = makeById(processes);
  const convention = mode === "LOWER_NUMBER" ? "lower number = higher priority" : "higher number = higher priority";
  let t = 0;

  while (!rec.allCompleted) {
    rec.setTime(t);
    rec.arriveAll();

    if (preemptive && rec.running !== null) {
      const cur = rec.running;
      const curPrio = byId.get(cur)!.priority ?? 0;
      const cand = pickPriority(rec.ready, byId, mode);
      if (cand && priorityBetter(byId.get(cand)!.priority ?? 0, curPrio, mode)) {
        rec.preempt(
          cur,
          `${cand} (priority ${byId.get(cand)!.priority}) has higher priority than ${cur} (priority ${curPrio}) under "${convention}", so it preempts ${cur}.`,
        );
      }
    }

    if (rec.running === null) {
      if (rec.ready.length > 0) {
        const id = pickPriority(rec.ready, byId, mode)!;
        rec.dispatch(id, `${id} has the highest priority (${byId.get(id)!.priority}) under "${convention}".`);
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
      rec.complete(id, `${id} finished its burst.`);
    }
  }

  return assemble(preemptive ? "PRIORITY_P" : "PRIORITY_NP", processes, rec);
}

export function priorityNonPreemptive(
  processes: ProcessInput[],
  mode: PriorityMode = "LOWER_NUMBER",
): SimulationResult {
  return priorityCore(processes, false, mode);
}

export function priorityPreemptive(
  processes: ProcessInput[],
  mode: PriorityMode = "LOWER_NUMBER",
): SimulationResult {
  return priorityCore(processes, true, mode);
}
