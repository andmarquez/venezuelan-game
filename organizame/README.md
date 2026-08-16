# Organízame

A polished mobile-first personal planner with **Andsiosa** — your brutally honest scheduling assistant.

## Quick start

```bash
cd organizame
npm install
npm run dev
```

Open http://127.0.0.1:5174/

## Features

- **Today** — Dashboard with timeline, free time, current mode, and quick actions
- **Organízame** — Brain dump tasks, parse durations, generate realistic schedules
- **Week / Month** — Weekly overview with rebalance; monthly strategic planning
- **Inbox** — Unscheduled task dump
- **Modes** — Work, Workout, Cooking, Time Off, Creative, Admin, Content, Errands + custom
- **Andsiosa** — Floating mascot with quick actions and animated states
- **Reaction Vault** — Upload GIF reactions for scheduling moments
- **Google Calendar** — Mock connection flow with sample events (ready for real OAuth)

## Stack

- React 19 + TypeScript
- Tailwind CSS v4
- Framer Motion
- date-fns
- LocalStorage persistence

## Architecture

- `src/services/calendarService.ts` — Calendar abstraction (mock → Google Calendar API)
- `src/services/schedulingEngine.ts` — Scheduling logic
- `src/services/reactionService.ts` — Reaction GIF library (mock → Supabase Storage)
- `src/services/taskParser.ts` — Brain dump text parsing
