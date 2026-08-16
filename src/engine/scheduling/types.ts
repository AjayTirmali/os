export type AlgorithmId =
  | "FCFS"
  | "SJF"
  | "SRTF"
  | "PRIORITY_NP"
  | "PRIORITY_P"
  | "ROUND_ROBIN"
  | "MLQ"
  | "MLFQ";

export interface ProcessInput {
  id: string;
  arrivalTime: number;
  burstTime: number;
  /** Optional priority. For MLQ, this value selects the queue (1 -> Q0, 2 -> Q1, …). */
  priority?: number;
}

export type PriorityMode = "LOWER_NUMBER" | "HIGHER_NUMBER";

export interface QueueConfig {
  id: string;
  name: string;
  algorithm: "FCFS" | "RR";
  quantum?: number;
  /** Lower number = higher priority queue. */
  priority: number;
}

export interface MLFQConfig {
  levels: number;
  quanta: number[];
  agingAfter: number;
  priorityMode: PriorityMode;
}

export interface SimulationOptions {
  timeQuantum?: number;
  priorityMode?: PriorityMode;
  queues?: QueueConfig[];
  mlfq?: Partial<MLFQConfig>;
}

/** A contiguous interval of CPU execution. `processId === null` marks idle CPU. */
export interface GanttSegment {
  processId: string | null;
  start: number;
  end: number;
}

export type StepEvent =
  | "ARRIVAL"
  | "DISPATCH"
  | "PREEMPT"
  | "COMPLETION"
  | "QUANTUM_EXPIRED"
  | "IDLE"
  | "PROMOTED"
  | "DEMOTED"
  | "AGING";

export interface QueueState {
  id: string;
  name: string;
  processes: string[];
}

export interface SimulationStep {
  time: number;
  runningProcessId: string | null;
  readyQueue: string[];
  completedProcesses: string[];
  event: StepEvent;
  explanation: string;
  internalExplanation: string;
  /** Human explanation of *why* the scheduler made this decision. */
  why?: string;
  /** Gantt chart progress up to this point in time. */
  gantt: GanttSegment[];
  /** Per-queue state for multilevel algorithms. */
  queues?: QueueState[];
}

export interface ProcessMetric {
  id: string;
  arrivalTime: number;
  burstTime: number;
  priority: number | null;
  firstStartTime: number | null;
  completionTime: number | null;
  turnaroundTime: number | null;
  waitingTime: number | null;
  responseTime: number | null;
}

export interface Averages {
  waitingTime: number;
  turnaroundTime: number;
  responseTime: number;
}

export interface SchedulingDecision {
  time: number;
  reason: string;
  why?: string;
}

export interface SimulationResult {
  algorithm: AlgorithmId;
  steps: SimulationStep[];
  gantt: GanttSegment[];
  processMetrics: ProcessMetric[];
  averages: Averages;
  contextSwitches: number;
  /** 0–100 */
  cpuUtilization: number;
  throughput: number;
  totalTime: number;
  decisions: SchedulingDecision[];
}
