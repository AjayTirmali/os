# OS Lab — Unit 2: Processes & CPU Scheduling

An **interactive operating systems laboratory** that teaches the second unit of a typical OS course. Instead of static notes, every concept is paired with a live, interactive visualization or simulation — process state machines, PCB inspectors, IPC animations, thread-model diagrams, and a full CPU-scheduling engine you can step through decision by decision.

> **Don't just learn how the OS works. Watch it happen.**

---

## ✨ Features

- **47 structured lessons** covering Process Concept, Process States, PCB, Context Switching, Scheduling Queues, Process Operations, IPC (shared memory + message passing), Producer–Consumer, Threads, Multithreading Models, and CPU Scheduling.
- **Pure scheduling engine** (no UI dependencies) implementing 8 algorithms:
  `FCFS`, `SJF`, `SRTF`, `Priority (non-preemptive & preemptive)`, `Round Robin`, `Multilevel Queue`, and `Multilevel Feedback Queue`.
- **Algorithm Lab** — edit process sets, run any algorithm, and replay every scheduling decision step-by-step (ready queue, CPU, Gantt chart, scheduler *why*, internal kernel explanation, metrics, per-process derivation).
- **Algorithm comparison** — run the same workload through all algorithms and compare waiting/turnaround/response time, context switches, and CPU utilization.
- **14 interactive visualizers** — process state machine, PCB inspector, context-switch timeline, scheduling queues, process tree, IPC, bounded-buffer producer/consumer, thread models, burst cycle, multi-core simulator, and a live metric calculator.
- **Learning system** — topic quizzes with full explanations, a searchable glossary, global search, last-minute **Exam Revision** mode, learning/exam toggle, and localStorage **progress tracking** (no account needed).
- **Polished UX** — dark mode, responsive layout, mobile drawer, keyboard-accessible controls, and `prefers-reduced-motion` support.

## 🧰 Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Vitest** for unit tests
- **localStorage** for progress/theme (fully client-side)

## 📁 Folder Structure

```
src/
├── app/                 # Pages (dashboard, lab, topics/[slug], playground, quiz, …)
├── components/
│   ├── layout/          # App shell, sidebar, header, search
│   ├── common/          # Reusable UI primitives
│   ├── scheduling/      # Gantt chart + simulation viewer
│   ├── visualization/   # Interactive concept visualizers
│   └── quiz/            # Quiz runner
├── engine/scheduling/   # Pure scheduling engine + unit tests
├── data/                # Curriculum, lessons, glossary, quizzes, presets
└── lib/                 # Theme & progress providers, utils
```

## 🚀 Installation & Development

```bash
npm install
npm run dev        # http://localhost:3000
```

## ✅ Testing

```bash
npx vitest run     # runs the scheduling engine unit tests
```

The engine is tested independently from the UI (acceptance dataset, ties, idle CPU, preemption, time-quantum variants, and metric-formula validation).

## 🏗️ Build

```bash
npm run build
npm run start      # or: npx next start
```

## ☁️ Deployment

The app is **fully client-side**: the scheduling engine runs in the browser, and progress/theme are stored in `localStorage`. **No database or backend is required** — `DATABASE_URL` is optional and only powers the unused `/api/health` route (it degrades gracefully without it).

### Option 1 — Vercel (recommended, zero config)

1. Push the project to a GitHub/GitLab repo.
2. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
3. Keep the defaults (Next.js is auto-detected). No environment variables are needed.
4. Click **Deploy**. Done — every push redeploys automatically.

### Option 2 — Netlify

1. Push to GitHub.
2. In Netlify: **Add new site → Import an existing project**.
3. Build command: `npm run build` · Publish directory: `.next` (the Netlify Next.js runtime is auto-detected).
4. Deploy.

### Option 3 — Self-host (Node.js)

```bash
npm ci
npm run build
npm start            # serves on http://localhost:3000
```

Put it behind Nginx/Caddy as a reverse proxy to `localhost:3000`, or run it via Docker:

```bash
docker build -t oslab .
docker run -p 3000:3000 oslab
```

### Option 4 — Static export (GitHub Pages, Cloudflare Pages, S3)

Because the app has no server-side logic, it can be exported to plain static files:

1. Add `output: "export"` to `next.config.ts` and delete `src/app/api` (API routes can't be statically exported — it's unused anyway).
2. Run `npm run build` → a fully static site is emitted to `out/`.
3. Upload `out/` to any static host. For GitHub Pages / Cloudflare Pages, add a `_redirects` / fallback so deep links resolve to `index.html` (SPA-style routing).

> Note: use **Option 1** if you want to keep the `/api/health` route; use **Option 4** only if you prefer a pure static host and are happy to drop the unused health route.

## 🧠 Architecture

- **Scheduling engine** (`src/engine/scheduling`) is pure TypeScript with zero React imports. It exposes:

  ```ts
  simulateScheduling(processes, algorithm, options) → SimulationResult
  ```

  returning a chronological `steps` log (with per-step snapshots, explanations, and *why* the scheduler chose as it did), the final Gantt timeline, per-process metrics, averages, context-switch count, CPU utilization, and throughput.

- **Content is data** (`src/data`), kept separate from components, so future units can be added by writing new lesson/quiz/glossary records.

- **State is split** into UI state (local component state), learning state (progress context), and simulation state (engine result + playback cursor).

## 🧩 Scheduling Engine Conventions

Documented assumptions (because they are implementation-defined):

- `totalTime` = completion time of the last process, measured from `t = 0`.
- **CPU utilization** = (busy time / total time) × 100; **throughput** = completed / total time.
- A **context switch** is counted only when two adjacent (no idle gap) segments belong to two *different* processes.
- **Ties** (equal burst/priority/arrival) are broken by earliest arrival, then lexicographically by id.
- **Priority** default convention is *lower number = higher priority* (configurable in the UI).
- For **MLQ**, a process's priority value selects its queue (1 → System, 2 → Interactive, 3+ → Batch).

## 🤝 Contributing

Contributions welcome. Keep the scheduling engine pure, keep content in `src/data`, and add a test for any engine change.
