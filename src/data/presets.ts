import type { ProcessInput } from "@/engine/scheduling";

/** Classic dataset used across the lab and the acceptance tests. */
export const DEFAULT_PROCESSES: ProcessInput[] = [
  { id: "P1", arrivalTime: 0, burstTime: 8, priority: 2 },
  { id: "P2", arrivalTime: 1, burstTime: 4, priority: 1 },
  { id: "P3", arrivalTime: 2, burstTime: 2, priority: 3 },
];

/** A richer dataset for the comparison table. */
export const COMPARISON_PROCESSES: ProcessInput[] = [
  { id: "P1", arrivalTime: 0, burstTime: 10, priority: 3 },
  { id: "P2", arrivalTime: 1, burstTime: 4, priority: 1 },
  { id: "P3", arrivalTime: 2, burstTime: 5, priority: 4 },
  { id: "P4", arrivalTime: 4, burstTime: 3, priority: 2 },
];

/** Demonstrates starvation under priority scheduling. */
export const STARVATION_PROCESSES: ProcessInput[] = [
  { id: "P1", arrivalTime: 0, burstTime: 2, priority: 1 },
  { id: "P2", arrivalTime: 1, burstTime: 2, priority: 1 },
  { id: "P3", arrivalTime: 2, burstTime: 2, priority: 1 },
  { id: "P4", arrivalTime: 3, burstTime: 2, priority: 1 },
  { id: "P5", arrivalTime: 4, burstTime: 8, priority: 5 },
];

export function randomProcesses(count = 4): ProcessInput[] {
  const out: ProcessInput[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      id: `P${i + 1}`,
      arrivalTime: Math.floor(Math.random() * 6),
      burstTime: 1 + Math.floor(Math.random() * 9),
      priority: 1 + Math.floor(Math.random() * 4),
    });
  }
  return out.sort((a, b) => a.arrivalTime - b.arrivalTime);
}
