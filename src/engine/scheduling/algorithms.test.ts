import { describe, it, expect } from "vitest";
import type { GanttSegment, ProcessInput } from "./types";
import { fcfs } from "./fcfs";
import { sjf } from "./sjf";
import { srtf } from "./srtf";
import { priorityNonPreemptive, priorityPreemptive } from "./priority";
import { roundRobin } from "./roundRobin";
import { computeMetricsFromSegments } from "./metrics";

const P = (id: string, at: number, bt: number, pr?: number): ProcessInput => ({
  id,
  arrivalTime: at,
  burstTime: bt,
  ...(pr !== undefined ? { priority: pr } : {}),
});

const ids = (segments: GanttSegment[]) => segments.map((s) => s.processId);

describe("FCFS", () => {
  it("runs the acceptance dataset in arrival order", () => {
    const res = fcfs([P("P1", 0, 8), P("P2", 1, 4), P("P3", 2, 2)]);
    expect(ids(res.gantt)).toEqual(["P1", "P2", "P3"]);
    const m = Object.fromEntries(res.processMetrics.map((x) => [x.id, x]));
    expect(m.P1.completionTime).toBe(8);
    expect(m.P2.completionTime).toBe(12);
    expect(m.P3.completionTime).toBe(14);
    expect(m.P1.turnaroundTime).toBe(8);
    expect(m.P2.turnaroundTime).toBe(11);
    expect(m.P3.turnaroundTime).toBe(12);
    expect(m.P2.waitingTime).toBe(7);
    expect(m.P3.waitingTime).toBe(10);
    expect(res.averages.turnaroundTime).toBeCloseTo(31 / 3);
    expect(res.averages.waitingTime).toBeCloseTo(17 / 3);
    expect(res.contextSwitches).toBe(2);
  });

  it("handles a single process", () => {
    const res = fcfs([P("P1", 0, 5)]);
    expect(res.gantt).toEqual([{ processId: "P1", start: 0, end: 5 }]);
    expect(res.averages.waitingTime).toBe(0);
    expect(res.averages.turnaroundTime).toBe(5);
    expect(res.contextSwitches).toBe(0);
  });

  it("handles an initially idle CPU", () => {
    const res = fcfs([P("P1", 3, 4)]);
    expect(res.gantt).toEqual([{ processId: "P1", start: 3, end: 7 }]);
    expect(res.totalTime).toBe(7);
    expect(res.cpuUtilization).toBeCloseTo((4 / 7) * 100);
    expect(res.throughput).toBeCloseTo(1 / 7);
  });
});

describe("SJF", () => {
  it("picks the shortest burst (non-preemptive)", () => {
    const res = sjf([P("P1", 0, 5), P("P2", 0, 3), P("P3", 0, 1)]);
    expect(ids(res.gantt)).toEqual(["P3", "P2", "P1"]);
    expect(res.averages.turnaroundTime).toBeCloseTo(14 / 3);
  });

  it("breaks ties by arrival time, then id", () => {
    const res = sjf([P("P1", 0, 4), P("P2", 0, 4)]);
    expect(ids(res.gantt)).toEqual(["P1", "P2"]);
  });
});

describe("SRTF", () => {
  it("preempts the running process when a shorter job arrives", () => {
    const res = srtf([P("P1", 0, 8), P("P2", 1, 4), P("P3", 2, 2)]);
    expect(ids(res.gantt)).toEqual(["P1", "P2", "P3", "P2", "P1"]);
    const m = Object.fromEntries(res.processMetrics.map((x) => [x.id, x]));
    expect(m.P1.completionTime).toBe(14);
    expect(m.P2.completionTime).toBe(7);
    expect(m.P3.completionTime).toBe(4);
    expect(m.P1.waitingTime).toBe(6);
    expect(m.P2.waitingTime).toBe(2);
    expect(m.P3.waitingTime).toBe(0);
    expect(res.contextSwitches).toBe(4);
  });
});

describe("Priority", () => {
  it("non-preemptive runs highest priority first", () => {
    const res = priorityNonPreemptive(
      [P("P1", 0, 5, 2), P("P2", 0, 3, 1), P("P3", 0, 1, 3)],
      "LOWER_NUMBER",
    );
    expect(ids(res.gantt)).toEqual(["P2", "P1", "P3"]);
  });

  it("preemptive interrupts for a higher-priority arrival", () => {
    const res = priorityPreemptive([P("P1", 0, 5, 2), P("P2", 1, 3, 1)], "LOWER_NUMBER");
    expect(ids(res.gantt)).toEqual(["P1", "P2", "P1"]);
    const m = Object.fromEntries(res.processMetrics.map((x) => [x.id, x]));
    expect(m.P2.completionTime).toBe(4);
    expect(m.P1.completionTime).toBe(8);
    expect(res.contextSwitches).toBe(2);
  });

  it("respects the HIGHER_NUMBER convention", () => {
    const res = priorityNonPreemptive(
      [P("P1", 0, 5, 2), P("P2", 0, 3, 9)],
      "HIGHER_NUMBER",
    );
    expect(ids(res.gantt)).toEqual(["P2", "P1"]);
  });
});

describe("Round Robin", () => {
  it("slices processes by the time quantum", () => {
    const res = roundRobin([P("P1", 0, 8), P("P2", 1, 4), P("P3", 2, 2)], 2);
    const m = Object.fromEntries(res.processMetrics.map((x) => [x.id, x]));
    expect(m.P1.completionTime).toBe(14);
    expect(m.P2.completionTime).toBe(10);
    expect(m.P3.completionTime).toBe(8);
    expect(m.P1.waitingTime).toBe(6);
    expect(m.P2.waitingTime).toBe(5);
    expect(m.P3.waitingTime).toBe(4);
    expect(res.averages.waitingTime).toBeCloseTo(5);
    expect(res.contextSwitches).toBe(5);
  });

  it("runs to completion when the quantum is larger than the burst", () => {
    const res = roundRobin([P("P1", 0, 2), P("P2", 0, 2)], 5);
    expect(ids(res.gantt)).toEqual(["P1", "P2"]);
    expect(res.contextSwitches).toBe(1);
    expect(res.averages.waitingTime).toBe(1);
  });
});

describe("Metric formulas", () => {
  it("derives turnaround, waiting, and response correctly", () => {
    const processes = [P("P1", 0, 5), P("P2", 1, 3)];
    const segments: GanttSegment[] = [
      { processId: "P1", start: 0, end: 5 },
      { processId: "P2", start: 5, end: 8 },
    ];
    const m = computeMetricsFromSegments(processes, segments);
    const p1 = m.metrics.find((x) => x.id === "P1")!;
    const p2 = m.metrics.find((x) => x.id === "P2")!;
    // Turnaround = Completion - Arrival
    expect(p1.turnaroundTime).toBe(5);
    expect(p2.turnaroundTime).toBe(7);
    // Waiting = Turnaround - Burst
    expect(p1.waitingTime).toBe(0);
    expect(p2.waitingTime).toBe(4);
    // Response = First start - Arrival
    expect(p1.responseTime).toBe(0);
    expect(p2.responseTime).toBe(4);
    expect(m.contextSwitches).toBe(1);
  });
});
