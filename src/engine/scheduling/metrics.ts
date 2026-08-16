import type { Averages, GanttSegment, ProcessInput, ProcessMetric } from "./types";

export interface MetricSummary {
  metrics: ProcessMetric[];
  averages: Averages;
  contextSwitches: number;
  cpuUtilization: number;
  throughput: number;
  totalTime: number;
}

const avg = (values: number[]): number =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

/**
 * Derive every scheduling metric purely from the process definitions and the
 * final Gantt timeline. This keeps metric computation independent from the
 * algorithm implementations and fully unit-testable.
 *
 * Conventions (documented because they are implementation-defined):
 * - totalTime = completion time of the last process, measured from t = 0.
 * - CPU utilization = (sum of busy segment lengths) / totalTime × 100.
 * - Throughput = completed processes / totalTime.
 * - A context switch is counted whenever two adjacent segments (no idle gap
 *   between them) belong to two *different* processes.
 */
export function computeMetricsFromSegments(
  processes: ProcessInput[],
  segments: GanttSegment[],
): MetricSummary {
  const metrics: ProcessMetric[] = processes.map((p) => {
    const own = segments.filter((s) => s.processId === p.id);
    const firstStartTime = own.length ? Math.min(...own.map((s) => s.start)) : null;
    const completionTime = own.length ? Math.max(...own.map((s) => s.end)) : null;
    const turnaroundTime = completionTime !== null ? completionTime - p.arrivalTime : null;
    const waitingTime = turnaroundTime !== null ? turnaroundTime - p.burstTime : null;
    const responseTime = firstStartTime !== null ? firstStartTime - p.arrivalTime : null;
    return {
      id: p.id,
      arrivalTime: p.arrivalTime,
      burstTime: p.burstTime,
      priority: p.priority ?? null,
      firstStartTime,
      completionTime,
      turnaroundTime,
      waitingTime,
      responseTime,
    };
  });

  const completed = metrics.filter((m) => m.completionTime !== null);
  const averages: Averages = {
    waitingTime: avg(completed.map((m) => m.waitingTime as number)),
    turnaroundTime: avg(completed.map((m) => m.turnaroundTime as number)),
    responseTime: avg(completed.map((m) => m.responseTime as number)),
  };

  const totalTime = segments.length ? Math.max(...segments.map((s) => s.end)) : 0;
  const busy = segments.reduce(
    (acc, s) => acc + (s.processId !== null ? s.end - s.start : 0),
    0,
  );
  const cpuUtilization = totalTime > 0 ? (busy / totalTime) * 100 : 0;
  const throughput = totalTime > 0 ? completed.length / totalTime : 0;

  let contextSwitches = 0;
  for (let i = 0; i < segments.length - 1; i++) {
    const a = segments[i];
    const b = segments[i + 1];
    if (
      a.processId !== null &&
      b.processId !== null &&
      a.processId !== b.processId &&
      a.end === b.start
    ) {
      contextSwitches++;
    }
  }

  return { metrics, averages, contextSwitches, cpuUtilization, throughput, totalTime };
}
