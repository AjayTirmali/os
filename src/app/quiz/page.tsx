"use client";

import { useState } from "react";
import { QUIZZES } from "@/data/quizzes";
import { useProgress } from "@/lib/providers";
import { cn, fmt } from "@/lib/utils";
import { Badge, Button, card } from "@/components/common/ui";
import { QuizRunner } from "@/components/quiz/QuizRunner";

export default function QuizPage() {
  const [quizId, setQuizId] = useState<string | null>(null);
  const { progress } = useProgress();

  const quiz = QUIZZES.find((q) => q.id === quizId);

  if (quiz) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{quiz.title}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{quiz.description}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setQuizId(null)}>← All quizzes</Button>
        </div>
        <QuizRunner key={quiz.id} quiz={quiz} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">❓ Quizzes</h1>
      <p className="mt-1 text-slate-500 dark:text-slate-400">
        Topic-specific practice with full explanations for every answer. Your scores are saved automatically.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {QUIZZES.map((q) => {
          const score = progress.quizScores[q.id];
          return (
            <button key={q.id} type="button" onClick={() => setQuizId(q.id)} className={cn(card, "p-5 text-left transition-colors hover:border-indigo-300 dark:hover:border-indigo-500/50")}>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-800 dark:text-slate-100">{q.title}</p>
                {score !== undefined ? <Badge tone={score >= 80 ? "emerald" : score >= 50 ? "amber" : "rose"}>{score}%</Badge> : <Badge tone="slate">new</Badge>}
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{q.description}</p>
              <p className="mt-2 text-xs font-medium text-indigo-600 dark:text-indigo-300">{q.questions.length} questions →</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
