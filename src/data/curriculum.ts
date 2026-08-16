import type { Section, SectionId, TopicRef } from "./types";

export const SECTIONS: Section[] = [
  {
    id: "processes",
    title: "Processes",
    icon: "🧠",
    description: "What a process is, how it lives in memory, its states, the PCB, context switching and process operations.",
    topics: [
      { id: "process-concept", title: "Process Concept", short: "Process Concept" },
      { id: "program-vs-process", title: "Program vs Process", short: "Program vs Process" },
      { id: "process-in-memory", title: "Process in Memory", short: "Memory Layout" },
      { id: "process-states", title: "Process States", short: "States" },
      { id: "process-lifecycle", title: "Process Lifecycle", short: "Lifecycle" },
      { id: "pcb", title: "Process Control Block", short: "PCB" },
      { id: "context-switching", title: "Context Switching", short: "Context Switch" },
      { id: "process-scheduling", title: "Process Scheduling", short: "Scheduling" },
      { id: "scheduling-queues", title: "Scheduling Queues", short: "Queues" },
      { id: "scheduler-vs-dispatcher", title: "Scheduler vs Dispatcher", short: "Scheduler / Dispatcher" },
      { id: "process-creation", title: "Process Creation", short: "Creation" },
      { id: "process-termination", title: "Process Termination", short: "Termination" },
      { id: "parent-child-processes", title: "Parent & Child Processes", short: "Parent / Child" },
      { id: "process-trees", title: "Process Trees", short: "Process Tree" },
      { id: "process-operations", title: "Process Operations", short: "Operations" },
    ],
  },
  {
    id: "ipc",
    title: "IPC & Cooperating Processes",
    icon: "🔗",
    description: "How processes share information — shared memory, message passing, and the producer-consumer problem.",
    topics: [
      { id: "independent-vs-cooperating", title: "Independent vs Cooperating", short: "Independent vs Cooperating" },
      { id: "cooperating-processes", title: "Cooperating Processes", short: "Cooperating Processes" },
      { id: "ipc-concept", title: "Inter-Process Communication", short: "IPC Concept" },
      { id: "shared-memory", title: "Shared Memory", short: "Shared Memory" },
      { id: "message-passing", title: "Message Passing", short: "Message Passing" },
      { id: "direct-vs-indirect", title: "Direct vs Indirect Communication", short: "Direct vs Indirect" },
      { id: "synchronous-vs-asynchronous", title: "Synchronous vs Asynchronous", short: "Sync vs Async" },
      { id: "producer-consumer", title: "Producer-Consumer Problem", short: "Producer-Consumer" },
      { id: "buffering", title: "Buffering", short: "Buffering" },
    ],
  },
  {
    id: "threads",
    title: "Threads",
    icon: "🧵",
    description: "Lightweight units of execution — what threads are, how they differ from processes, and multithreading models.",
    topics: [
      { id: "thread-concept", title: "Thread Concept", short: "Thread Concept" },
      { id: "process-vs-thread", title: "Process vs Thread", short: "Process vs Thread" },
      { id: "thread-components", title: "Thread Components", short: "Components" },
      { id: "benefits-of-threads", title: "Benefits of Threads", short: "Benefits" },
      { id: "user-level-threads", title: "User-Level Threads", short: "User Threads" },
      { id: "kernel-level-threads", title: "Kernel-Level Threads", short: "Kernel Threads" },
      { id: "multithreading", title: "Multithreading", short: "Multithreading" },
      { id: "multithreading-models", title: "Multithreading Models", short: "Threading Models" },
      { id: "thread-scheduling", title: "Thread Scheduling", short: "Thread Scheduling" },
    ],
  },
  {
    id: "scheduling",
    title: "CPU Scheduling",
    icon: "⚙️",
    description: "How the CPU decides which process runs next — criteria, algorithms, and multiprocessor scheduling.",
    topics: [
      { id: "scheduling-concept", title: "CPU Scheduling Concept", short: "Scheduling Concept" },
      { id: "preemptive-vs-nonpreemptive", title: "Preemptive vs Non-Preemptive", short: "Preemptive vs NP" },
      { id: "scheduling-criteria", title: "Scheduling Criteria", short: "Criteria" },
      { id: "cpu-burst-io-burst", title: "CPU Burst & I/O Burst", short: "Burst Cycle" },
      { id: "fcfs", title: "FCFS Scheduling", short: "FCFS" },
      { id: "sjf", title: "SJF Scheduling", short: "SJF" },
      { id: "srtf", title: "SRTF Scheduling", short: "SRTF" },
      { id: "priority-scheduling", title: "Priority Scheduling", short: "Priority" },
      { id: "round-robin", title: "Round Robin", short: "Round Robin" },
      { id: "multilevel-queue", title: "Multilevel Queue", short: "MLQ" },
      { id: "mlfq", title: "Multilevel Feedback Queue", short: "MLFQ" },
      { id: "multiprocessor-scheduling", title: "Multiprocessor Scheduling", short: "Multiprocessor" },
      { id: "algorithm-evaluation", title: "Algorithm Evaluation", short: "Evaluation" },
      { id: "starvation-and-aging", title: "Starvation & Aging", short: "Starvation" },
    ],
  },
];

export const TOPICS: TopicRef[] = SECTIONS.flatMap((s) => s.topics);

export const SECTION_BY_ID: Record<SectionId, Section> = SECTIONS.reduce(
  (acc, s) => {
    acc[s.id] = s;
    return acc;
  },
  {} as Record<SectionId, Section>,
);

export function getTopicNav(id: string): {
  topic: TopicRef;
  section: Section;
  prev?: TopicRef;
  next?: TopicRef;
  index: number;
  total: number;
} {
  const index = TOPICS.findIndex((t) => t.id === id);
  const topic = TOPICS[Math.max(0, index)];
  const section = SECTION_BY_ID[getSectionForTopic(topic.id)];
  return {
    topic,
    section,
    prev: index > 0 ? TOPICS[index - 1] : undefined,
    next: index >= 0 && index < TOPICS.length - 1 ? TOPICS[index + 1] : undefined,
    index: index + 1,
    total: TOPICS.length,
  };
}

export function getSectionForTopic(id: string): SectionId {
  for (const s of SECTIONS) {
    if (s.topics.some((t) => t.id === id)) return s.id;
  }
  return "processes";
}
