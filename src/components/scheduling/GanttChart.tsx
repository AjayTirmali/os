"use client";

import { useMemo } from "react";
import type { GanttSegment } from "@/engine/scheduling";
import { cn, processColor } from "@/lib/utils";

interface GanttChartProps {
  segments: GanttSegment[];
  height?: number;
  onSelect?: (processId: string | null) => void;
  selectedId?: string | null;
  className?: string;
}

/**
 * A reusable, responsive Gantt chart. Segments are rendered proportionally to
 * their duration with time markers underneath; idle sections are shown as a
 * hatched region. Clicking a block reports the process id (or null for idle).
 */
export function GanttChart({ segments, height = 56, onSelect, selectedId, className }: GanttChartProps) {
  const total = useMemo(() => {
    if (!segments.length) return 0;
    return Math.max(...segments.map((s) => s.end));
  }, [segments]);

  const markers = useMemo(() => {
    const times = new Set<number>([0]);
    for (const s of segments) {
      times.add(s.start);
      times.add(s.end);
    }
    return [...times].sort((a, b) => a - b);
  }, [segments]);

  if (!segments.length || total === 0) {
    return (
      <div className={cn("rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400 dark:border-slate-700", className)}>
        No execution timeline yet.
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <div className="min-w-[320px]">
        <div className="relative flex w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700" style={{ height }}>
          {segments.map((s, i) => {
            const width = ((s.end - s.start) / total) * 100;
            const isIdle = s.processId === null;
            const color = s.processId ? processColor(s.processId) : null;
            const selected = selectedId != null && s.processId === selectedId;
            return (
              <button
                key={`${s.processId ?? "idle"}-${s.start}-${i}`}
                type="button"
                onClick={() => onSelect?.(s.processId)}
                aria-label={isIdle ? `CPU idle from ${s.start} to ${s.end}` : `${s.processId} from ${s.start} to ${s.end}`}
                title={isIdle ? `CPU idle [${s.start}–${s.end}]` : `${s.processId}  [${s.start}–${s.end}]`}
                style={{ width: `${width}%`, backgroundColor: color?.hex }}
                className={cn(
                  "group relative flex h-full items-center justify-center border-r border-white/40 text-[11px] font-bold text-white transition-opacity last:border-r-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-900 dark:focus-visible:ring-white",
                  isIdle && "bg-slate-200 text-slate-400 dark:bg-slate-800",
                  selected && "ring-2 ring-inset ring-slate-900 dark:ring-white",
                )}
              >
                {!isIdle && s.end - s.start > 0.5 ? (
                  <span className="truncate px-0.5">{s.processId}</span>
                ) : isIdle ? (
                  <span aria-hidden>·</span>
                ) : null}
                <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-white group-hover:block dark:bg-slate-700">
                  {isIdle ? "CPU idle" : s.processId} · {s.start}–{s.end}
                </span>
              </button>
            );
          })}
        </div>
        <div className="relative mt-1 h-4 w-full text-[10px] text-slate-400 dark:text-slate-500">
          {markers.map((m) => (
            <span key={m} className="absolute -translate-x-1/2" style={{ left: `${(m / total) * 100}%` }}>
              {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
