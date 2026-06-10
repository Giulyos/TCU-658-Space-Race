# Space Race — TCU-658

## Academic Context

This project is the digital material for **TCU-658** (Trabajo Comunal Universitario), Escuela de Lenguas Modernas, Universidad de Costa Rica (UCR), period **I-2026**. It is developed by Giuliana Ortega Saborío for **CTP de Guácimo**, as part of the MEP Technical English program (secondary level, adaptable to any unit/theme assigned by the host teacher).

The deliverable is **1 complete digital platform**: a React PWA frontend + Node.js/Express/SQLite backend, packaged into 3 standalone executables (Windows `.exe`, macOS, Linux), with an installation/usage manual.

## Core Requirements (NON-NEGOTIABLE)

These are hard constraints that every feature, dependency, and design decision **must** respect. If a change would violate any of these, it is wrong — stop and reconsider the approach.

- **Must run on any device.** The platform must work on whatever the school provides — low-end Windows/macOS/Linux computers, tablets, and Android/iOS phones — with no assumptions about specs, OS version, or pre-installed software.
- **Must work fully offline — zero internet dependency.** All logic, data, assets, fonts, and UI run **locally**. There must be **no** network calls to external services, no CDNs, no remote APIs, no telemetry — nothing that requires (or silently degrades without) an internet connection. The game must run identically in a classroom with no connectivity at all.
- **Must run locally with easy installation — and nothing more.** A teacher runs **one** standalone executable (no Node.js/npm, no admin permissions, no terminal expertise, no multi-step setup). It starts the local server and opens in the browser. That is the entire installation. On mobile, "Add to Home Screen" via the PWA is the only step.

Practical implications when implementing anything: bundle every asset locally (no external `<link>`/`<script>`/font/CDN URLs); the service worker must cache the full app shell so it loads with the network disabled; persist all state in the local SQLite DB; and keep the packaged binary lightweight (~30 MB) so it runs on constrained school hardware.

## Project Concept — Space Race

An in-classroom English quiz game. The teacher splits the class into **4 teams**, each with a spaceship on a 2-lane race track of `n` spaces. Questions (in English) are shown one at a time, drawn randomly (no repeats per session) from a teacher-curated question bank. Teams discuss and answer verbally; the teacher marks the answer **Correct/Incorrect** via the UI. A correct answer advances that team's spaceship by the question's point value (≥1 spaces). First spaceship to reach the finish line wins.

The platform has two views:
- **Admin Panel** (`/admin`) — teacher-only: CRUD for the question bank (text, correct answer, optional distractors, point value), game settings (finish line `n`, team names), and turn controls (Start, Correct/Incorrect, Pause, Restart, Mute).
- **Game Screen** (`/game`) — projected/student-facing: race track, spaceships, active question, scoreboard, turn indicator, winner announcement.

### Why this architecture (PWA + packaged local server)

Chosen specifically for the variability of school IT environments:
- **Cross-platform**: one codebase, 3 prebuilt executables (`@yao-pkg/pkg`) — no source changes per OS.
- **Fully offline**: all logic, data, and UI run locally; no internet needed during class.
- **Mobile-friendly**: installable as a PWA ("Add to Home Screen") on Android/iOS, no app store.
- **Zero-install for teachers**: run a single executable, no admin permissions, no Node.js/npm required.
- **Lightweight**: packaged binary ≈30 MB, suitable for low-resource school computers.
- **Persistent question bank**: SQLite (`spacerace.db`) survives between sessions — teacher doesn't re-enter questions each class.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite |
| PWA / Offline | vite-plugin-pwa, Service Worker (cache-first) |
| Routing | react-router-dom |
| Backend | Node.js, Express |
| Database | SQLite via better-sqlite3 |
| Packaging | @yao-pkg/pkg (NOT `vercel/pkg` — abandoned, incompatible with modern Node) |
| Dev tooling | concurrently, nodemon |

## Repository Structure

```
TCU-658-Space-Race/
├── client/                        React + Vite PWA frontend
│   ├── public/                    favicon, icons (PWA icons + sounds go here)
│   └── src/
│       ├── api/                   gameApi.js, questionsApi.js — fetch wrappers for backend
│       ├── components/            RaceTrack, Spaceship, QuestionDisplay, Scoreboard, TurnIndicator
│       ├── hooks/                 useGameState.js — polls /api/game/state
│       ├── pages/                 GameScreen.jsx, AdminPanel.jsx
│       ├── App.jsx, main.jsx
│       └── App.css, index.css
├── server/                        Node + Express backend
│   ├── db/                        database.js (better-sqlite3 init), schema.js (table defs)
│   ├── routes/                    questions.js (CRUD), game.js (start/state/turn/restart)
│   └── server.js                  Express entry point, serves built client + API
├── package.json                   root: npm run dev / build (concurrently, pkg)
└── README.md                      full user-facing docs (API reference, DB schema, deployment)
```

### Current state

Scaffolding is in place: project structure, configs (Vite+PWA, package.json scripts), DB schema, Express routes, and React component/page files all exist but most are minimal stubs (6–25 lines). The README documents the *intended* final API/DB shape — implementation should follow it as the source of truth for endpoint contracts (`/api/questions`, `/api/game/*`) and the `questions`/`game_state` table schemas.

## Database Schema (target)

```sql
CREATE TABLE questions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  text          TEXT    NOT NULL,
  correct_answer TEXT   NOT NULL,
  distractors   TEXT,                        -- JSON array as string
  point_value   INTEGER NOT NULL DEFAULT 1,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE game_state (
  id            INTEGER PRIMARY KEY DEFAULT 1,
  active        INTEGER NOT NULL DEFAULT 0,   -- 0 = not started, 1 = active, 2 = paused
  current_team  INTEGER NOT NULL DEFAULT 1,   -- 1-4
  positions     TEXT    NOT NULL DEFAULT '[0,0,0,0]',
  finish_line   INTEGER NOT NULL DEFAULT 10,
  team_names    TEXT    NOT NULL DEFAULT '["Team 1","Team 2","Team 3","Team 4"]',
  used_questions TEXT   NOT NULL DEFAULT '[]',
  winner        INTEGER,                      -- NULL or team number 1-4
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## API Reference (target)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/questions` | Get all questions |
| POST | `/api/questions` | Add a question |
| PUT | `/api/questions/:id` | Update a question |
| DELETE | `/api/questions/:id` | Delete a question |
| POST | `/api/game/start` | Start game with current config |
| GET | `/api/game/state` | Get current game state |
| POST | `/api/game/turn` | Submit `{ correct: boolean }` for current turn |
| POST | `/api/game/restart` | Reset positions/winner, keep question bank |
| GET | `/api/health` | Health check |

## Conventions

- Code and comments in English (UI copy is also English — it's the language being taught).
- No authentication — this is a single local instance, trusted teacher device.
- Keep the teacher (Admin Panel) and student-facing (Game Screen) views decoupled — Game Screen polls `/api/game/state` and should work even if opened on a separate device on the same local network.
