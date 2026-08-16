export * from "./types";
export * from "./metrics";
export * from "./core";
export { fcfs } from "./fcfs";
export { sjf } from "./sjf";
export { srtf } from "./srtf";
export { priorityNonPreemptive, priorityPreemptive } from "./priority";
export { roundRobin } from "./roundRobin";
export { multilevelQueue, DEFAULT_MLQ_QUEUES } from "./multilevelQueue";
export { mlfq, DEFAULT_MLFQ_CONFIG } from "./mlfq";

import type { AlgorithmId, ProcessInput, SimulationOptions, SimulationResult } from "./types";
import { fcfs } from "./fcfs";
import { sjf } from "./sjf";
import { srtf } from "./srtf";
import { priorityNonPreemptive, priorityPreemptive } from "./priority";
import { roundRobin } from "./roundRobin";
import { multilevelQueue } from "./multilevelQueue";
import { mlfq } from "./mlfq";

export interface AlgorithmMeta {
  id: AlgorithmId;
  label: string;
  short: string;
  needsQuantum?: boolean;
  needsPriority?: boolean;
  category: "basic" | "priority" | "multilevel";
}

export const ALGORITHM_META: AlgorithmMeta[] = [
  { id: "FCFS", label: "First-Come, First-Served", short: "FCFS", category: "basic" },
  { id: "SJF", label: "Shortest Job First (Non-Preemptive)", short: "SJF", category: "basic" },
  { id: "SRTF", label: "Shortest Remaining Time First", short: "SRTF", category: "basic" },
  { id: "PRIORITY_NP", label: "Priority (Non-Preemptive)", short: "Priority NP", needsPriority: true, category: "priority" },
  { id: "PRIORITY_P", label: "Priority (Preemptive)", short: "Priority P", needsPriority: true, category: "priority" },
  { id: "ROUND_ROBIN", label: "Round Robin", short: "Round Robin", needsQuantum: true, category: "basic" },
  { id: "MLQ", label: "Multilevel Queue", short: "MLQ", needsPriority: true, category: "multilevel" },
  { id: "MLFQ", label: "Multilevel Feedback Queue", short: "MLFQ", category: "multilevel" },
];

export function simulateScheduling(
  processes: ProcessInput[],
  algorithm: AlgorithmId,
  options: SimulationOptions = {},
): SimulationResult {
  switch (algorithm) {
    case "FCFS":
      return fcfs(processes);
    case "SJF":
      return sjf(processes);
    case "SRTF":
      return srtf(processes);
    case "PRIORITY_NP":
      return priorityNonPreemptive(processes, options.priorityMode ?? "LOWER_NUMBER");
    case "PRIORITY_P":
      return priorityPreemptive(processes, options.priorityMode ?? "LOWER_NUMBER");
    case "ROUND_ROBIN":
      return roundRobin(processes, options.timeQuantum ?? 2);
    case "MLQ":
      return multilevelQueue(processes, options);
    case "MLFQ":
      return mlfq(processes, options);
  }
}
