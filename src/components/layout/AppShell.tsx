"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { SECTIONS, TOPICS, getSectionForTopic } from "@/data/curriculum";
import { LESSONS } from "@/data/lessons";
import { GLOSSARY } from "@/data/glossary";
import { ALGORITHM_META } from "@/engine/scheduling";
import { useProgress, useTheme } from "@/lib/providers";
import { cn } from "@/lib/utils";

interface NavLink {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
}

const MAIN_NAV: NavLink[] = [
  { href: "/", label: "Dashboard", icon: "🏠", exact: true },
  { href: "/unit", label: "Unit Overview", icon: "🗺️" },
  { href: "/lab", label: "Algorithm Lab", icon: "🧪" },
  { href: "/playground", label: "OS Playground", icon: "🕹️" },
  { href: "/quiz", label: "Quizzes", icon: "❓" },
  { href: "/revision", label: "Exam Revision", icon: "📚" },
  { href: "/glossary", label: "Glossary", icon: "📖" },
  { href: "/progress", label: "Progress", icon: "📈" },
];

const SECTION_ICONS: Record<string, string> = { processes: "🧠", ipc: "🔗", threads: "🧵", scheduling: "⚙️" };

export function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header onMenu={() => setDrawerOpen(true)} onSearch={() => setSearchOpen(true)} />

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 overflow-y-auto border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <NavContent />
          </aside>
        </div>
      ) : null}

      <div className="mx-auto flex max-w-[1600px]">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-72 shrink-0 overflow-y-auto border-r border-slate-200 p-4 dark:border-slate-800 lg:block">
          <NavContent />
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      {searchOpen ? <SearchDialog onClose={() => setSearchOpen(false)} /> : null}
    </div>
  );
}

function Header({ onMenu, onSearch }: { onMenu: () => void; onSearch: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const { progress } = useProgress();
  const pct = TOPICS.length ? Math.round((progress.completedTopics.length / TOPICS.length) * 100) : 0;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open navigation"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
        >
          <span aria-hidden>☰</span>
        </button>

        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white" aria-hidden>
            ⚙️
          </span>
          <span className="hidden text-sm leading-tight sm:block">
            <span className="block font-bold">OS Lab</span>
            <span className="block text-[11px] font-normal text-slate-500 dark:text-slate-400">Unit 2 · Processes & Scheduling</span>
          </span>
        </Link>

        <button
          type="button"
          onClick={onSearch}
          className="ml-2 flex flex-1 max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
        >
          <span aria-hidden>🔍</span>
          <span className="hidden sm:inline">Search topics, glossary, formulas…</span>
          <span className="sm:hidden">Search…</span>
          <kbd className="ml-auto hidden rounded border border-slate-300 px-1.5 text-[10px] text-slate-400 dark:border-slate-600 sm:inline">/</kbd>
        </button>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-2 md:flex" title="Unit progress">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{pct}%</span>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <span aria-hidden>{theme === "dark" ? "☀️" : "🌙"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function NavContent() {
  const pathname = usePathname();
  const { progress } = useProgress();
  const activeTopic = useMemo(() => {
    if (pathname.startsWith("/topics/")) return pathname.replace("/topics/", "");
    return null;
  }, [pathname]);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const current = activeTopic ? getSectionForTopic(activeTopic) : null;
    return { processes: true, [current ?? "processes"]: true };
  });

  return (
    <nav aria-label="Main navigation" className="space-y-5">
      <ul className="space-y-0.5">
        {MAIN_NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                )}
              >
                <span aria-hidden>{item.icon}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div>
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Topics</p>
        <ul className="space-y-1">
          {SECTIONS.map((section) => {
            const open = openSections[section.id];
            const done = section.topics.filter((t) => progress.completedTopics.includes(t.id)).length;
            return (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => setOpenSections((s) => ({ ...s, [section.id]: !s[section.id] }))}
                  aria-expanded={open}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <span aria-hidden>{section.icon}</span>
                  <span className="flex-1 text-left">{section.title}</span>
                  <span className="text-[10px] text-slate-400">
                    {done}/{section.topics.length}
                  </span>
                  <span className="text-xs text-slate-400" aria-hidden>
                    {open ? "▾" : "▸"}
                  </span>
                </button>
                {open ? (
                  <ul className="ml-4 mt-1 space-y-0.5 border-l border-slate-200 pl-2 dark:border-slate-700">
                    {section.topics.map((topic) => {
                      const active = activeTopic === topic.id;
                      const completed = progress.completedTopics.includes(topic.id);
                      return (
                        <li key={topic.id}>
                          <Link
                            href={`/topics/${topic.id}`}
                            className={cn(
                              "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                              active
                                ? "bg-indigo-100 font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
                                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                            )}
                          >
                            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", completed ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600")} aria-hidden />
                            <span className="truncate">{topic.title}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

interface SearchResult {
  category: "Topic" | "Algorithm" | "Glossary" | "Formula";
  title: string;
  snippet: string;
  href: string;
}

function SearchDialog({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: SearchResult[] = [];

    for (const lesson of LESSONS) {
      const hay = `${lesson.title} ${lesson.definition} ${lesson.simple} ${lesson.keyPoints.join(" ")}`.toLowerCase();
      if (hay.includes(q)) {
        out.push({ category: "Topic", title: lesson.title, snippet: lesson.shortDescription, href: `/topics/${lesson.id}` });
      }
      for (const f of lesson.formulas ?? []) {
        if (`${f.name} ${f.expression}`.toLowerCase().includes(q)) {
          out.push({ category: "Formula", title: f.name, snippet: f.expression, href: `/topics/${lesson.id}` });
        }
      }
    }
    for (const g of GLOSSARY) {
      if (`${g.term} ${g.definition} ${g.simple}`.toLowerCase().includes(q)) {
        out.push({ category: "Glossary", title: g.term, snippet: g.simple, href: `/glossary?q=${encodeURIComponent(g.term)}` });
      }
    }
    for (const a of ALGORITHM_META) {
      if (a.label.toLowerCase().includes(q)) {
        out.push({ category: "Algorithm", title: a.label, snippet: "Run in the Algorithm Lab", href: `/lab?algo=${a.id}` });
      }
    }
    return out.slice(0, 30);
  }, [query]);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
      <button type="button" aria-label="Close search" className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <span aria-hidden>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search “waiting time”, “PCB”, “Round Robin”…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            aria-label="Search"
          />
          <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            ESC
          </button>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {query.trim() === "" ? (
            <p className="px-3 py-8 text-center text-sm text-slate-400">Type to search topics, glossary terms, algorithms, and formulas.</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-slate-400">No results for “{query}”.</p>
          ) : (
            <ul className="space-y-1">
              {results.map((r, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => go(r.href)}
                    className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <span className="mt-0.5 rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                      {r.category}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">{r.title}</span>
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{r.snippet}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
