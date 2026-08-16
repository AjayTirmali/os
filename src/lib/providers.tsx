"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/* ------------------------------ Theme ------------------------------ */

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("oslab-theme");
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    setThemeState(getInitialTheme());
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("oslab-theme", theme);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = useCallback(() => setThemeState((p) => (p === "dark" ? "light" : "dark")), []);

  const value = useMemo(() => ({ theme, toggleTheme, setTheme }), [theme, toggleTheme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

/* ----------------------------- Progress ---------------------------- */

export interface Progress {
  completedTopics: string[];
  quizScores: Record<string, number>;
  lastVisitedTopic?: string;
  recentlyViewed: string[];
  simulatorUsage: number;
}

interface ProgressContextValue {
  progress: Progress;
  markComplete: (topicId: string) => void;
  markIncomplete: (topicId: string) => void;
  recordQuizScore: (quizId: string, pct: number) => void;
  visitTopic: (topicId: string) => void;
  bumpSimulator: () => void;
  resetProgress: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

const STORAGE_KEY = "oslab-progress";

const EMPTY: Progress = {
  completedTopics: [],
  quizScores: {},
  recentlyViewed: [],
  simulatorUsage: 0,
};

function loadProgress(): Progress {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return {
      completedTopics: Array.isArray(parsed.completedTopics) ? parsed.completedTopics : [],
      quizScores: parsed.quizScores && typeof parsed.quizScores === "object" ? parsed.quizScores : {},
      lastVisitedTopic: typeof parsed.lastVisitedTopic === "string" ? parsed.lastVisitedTopic : undefined,
      recentlyViewed: Array.isArray(parsed.recentlyViewed) ? parsed.recentlyViewed : [],
      simulatorUsage: typeof parsed.simulatorUsage === "number" ? parsed.simulatorUsage : 0,
    };
  } catch {
    return EMPTY;
  }
}

function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(EMPTY);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const markComplete = useCallback((topicId: string) => {
    setProgress((p) =>
      p.completedTopics.includes(topicId)
        ? p
        : { ...p, completedTopics: [...p.completedTopics, topicId] },
    );
  }, []);

  const markIncomplete = useCallback((topicId: string) => {
    setProgress((p) => ({
      ...p,
      completedTopics: p.completedTopics.filter((t) => t !== topicId),
    }));
  }, []);

  const recordQuizScore = useCallback((quizId: string, pct: number) => {
    setProgress((p) => ({
      ...p,
      quizScores: { ...p.quizScores, [quizId]: Math.max(0, Math.min(100, Math.round(pct))) },
    }));
  }, []);

  const visitTopic = useCallback((topicId: string) => {
    setProgress((p) => ({
      ...p,
      lastVisitedTopic: topicId,
      recentlyViewed: [topicId, ...p.recentlyViewed.filter((t) => t !== topicId)].slice(0, 8),
    }));
  }, []);

  const bumpSimulator = useCallback(() => {
    setProgress((p) => ({ ...p, simulatorUsage: p.simulatorUsage + 1 }));
  }, []);

  const resetProgress = useCallback(() => setProgress(EMPTY), []);

  const value = useMemo(
    () => ({ progress, markComplete, markIncomplete, recordQuizScore, visitTopic, bumpSimulator, resetProgress }),
    [progress, markComplete, markIncomplete, recordQuizScore, visitTopic, bumpSimulator, resetProgress],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ProgressProvider>{children}</ProgressProvider>
    </ThemeProvider>
  );
}
