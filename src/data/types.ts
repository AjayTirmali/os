export type SectionId = "processes" | "ipc" | "threads" | "scheduling";

export type VisualizerId =
  | "program-to-process"
  | "process-states"
  | "pcb"
  | "context-switch"
  | "scheduling-queues"
  | "process-tree"
  | "ipc"
  | "producer-consumer"
  | "threads"
  | "thread-models"
  | "metrics-calculator"
  | "scheduler-dispatcher"
  | "burst-cycle"
  | "multiprocessor";

export interface Formula {
  name: string;
  expression: string;
  note?: string;
}

export interface DifferenceTable {
  title: string;
  headers: [string, string];
  rows: [string, string][];
}

export interface Lesson {
  id: string;
  section: SectionId;
  title: string;
  shortDescription: string;
  definition: string;
  whyItMatters: string;
  simple: string;
  technical: string;
  internal: string;
  keyPoints: string[];
  commonMistakes: string[];
  examTips: string[];
  visualizer?: VisualizerId;
  formulas?: Formula[];
  differences?: DifferenceTable;
  /** When set, the lesson links to the Algorithm Lab preloaded with this algorithm. */
  labAlgorithm?: string;
}

export interface TopicRef {
  id: string;
  title: string;
  short: string;
}

export interface Section {
  id: SectionId;
  title: string;
  icon: string;
  description: string;
  topics: TopicRef[];
}

export type QuizType = "mcq" | "tf" | "calc" | "scenario";

export interface QuizQuestion {
  id: string;
  topicId: string;
  type: QuizType;
  question: string;
  options?: string[];
  /** Index of the correct option, or 0 (false) / 1 (true) for tf. */
  answer: number;
  explanation: string;
  formula?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  topicIds: string[];
  questions: QuizQuestion[];
}

export interface GlossaryEntry {
  term: string;
  definition: string;
  simple: string;
  related: string[];
}
