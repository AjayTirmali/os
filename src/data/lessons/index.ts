import type { Lesson } from "../types";
import { PROCESS_LESSONS } from "./processes";
import { IPC_THREAD_LESSONS } from "./ipc-threads";
import { SCHEDULING_LESSONS } from "./scheduling";

export const LESSONS: Lesson[] = [...PROCESS_LESSONS, ...IPC_THREAD_LESSONS, ...SCHEDULING_LESSONS];

export const LESSONS_BY_ID: Record<string, Lesson> = LESSONS.reduce(
  (acc, lesson) => {
    acc[lesson.id] = lesson;
    return acc;
  },
  {} as Record<string, Lesson>,
);

export function getLesson(id: string): Lesson | undefined {
  return LESSONS_BY_ID[id];
}
