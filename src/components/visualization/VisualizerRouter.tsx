"use client";

import type { VisualizerId } from "@/data/types";
import {
  ContextSwitchViz,
  PCBInspector,
  ProcessStateMachine,
  ProcessTreeViz,
  ProgramToProcessViz,
  SchedulerDispatcherViz,
  SchedulingQueuesViz,
} from "./ProcessViz";
import { IPCViz, ProducerConsumerViz, ThreadModelsViz, ThreadsViz } from "./CommsViz";
import { BurstCycleViz, MetricsCalculatorViz, MultiprocessorViz } from "./SchedViz";

export function VisualizerRouter({ id }: { id: VisualizerId }) {
  switch (id) {
    case "program-to-process":
      return <ProgramToProcessViz />;
    case "process-states":
      return <ProcessStateMachine />;
    case "pcb":
      return <PCBInspector />;
    case "context-switch":
      return <ContextSwitchViz />;
    case "scheduling-queues":
      return <SchedulingQueuesViz />;
    case "process-tree":
      return <ProcessTreeViz />;
    case "scheduler-dispatcher":
      return <SchedulerDispatcherViz />;
    case "ipc":
      return <IPCViz />;
    case "producer-consumer":
      return <ProducerConsumerViz />;
    case "threads":
      return <ThreadsViz />;
    case "thread-models":
      return <ThreadModelsViz />;
    case "metrics-calculator":
      return <MetricsCalculatorViz />;
    case "burst-cycle":
      return <BurstCycleViz />;
    case "multiprocessor":
      return <MultiprocessorViz />;
    default:
      return null;
  }
}
