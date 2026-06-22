# 🚀 Space Race

An interactive classroom quiz game for English language teaching. Four teams compete by answering questions — each correct answer launches their spaceship forward on the race track. First team to reach the finish line wins.

Built as a **Progressive Web App (PWA)** with a local Express + SQLite backend, packaged into a single executable file that works completely offline — no internet, no installation, no admin permissions required.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running in Development](#running-in-development)
- [Status & Roadmap](#status--roadmap)
- [Using the Application](#using-the-application)
  - [For the Teacher](#for-the-teacher)
  - [For Students — How to Play](#for-students--how-to-play)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Deployment — Distributing the Executable](#deployment--distributing-the-executable)
- [Offline Support](#offline-support)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Space Race was developed as part of **TCU-658** at the **Escuela de Lenguas Modernas, Universidad de Costa Rica**, in collaboration with CTP de Guácimo. It is designed for use in English language classrooms at the secondary level and is fully adaptable to any topic, level, or unit from the MEP Technical English program.

The teacher sets up a game (teams + questions) before class, projects the board on the classroom screen, reveals one question at a time with **Next Question**, and marks each spoken answer **Correct** or **Incorrect**. Students discuss answers as a team and a representative communicates the answer. No student device is needed — the entire game is teacher-operated.

---

## Features

### Gameplay
- 🛸 2–4 teams, each starting on its own 8-bit home planet, racing along a winding board to a shared finish planet
- ❓ Questions drawn randomly from the game's question bank (no repeats per session), revealed one at a time when the teacher presses **Next Question**
- ⚖️ Configurable point values per question (each correct answer advances the ship by that many spaces, 1 or more)
- 🏁 Configurable finish line — 3 to 10 spaces to win
- 🗺️ Randomized map look each game (planet variants), with routes spaced so ships never overlap
- 🏆 Winner detection when a team reaches the finish

### Admin Panel
- 🗂️ A **library of saved games** — each game has its own teams, settings, and question bank
- 🧭 A step-by-step **setup wizard** to create or edit a game (teams & rules, then the question bank)
- ➕ Add, edit, and delete questions (text, correct answer, point value)
- ▶️ **Play** a game (and **Restart** it); the in-game controls live on the projected Game Screen
- 🎁 A built-in **example game** is preloaded so you can try it immediately

### Game Screen (projected)
- 🖥️ Full-screen board with the teacher's controls anchored on it (Next Question, Pause, Mute)
- ❓ A Jeopardy-style popup shows the question, with **Correct** / **Incorrect** on the popup itself
- ⏸️ Pausing grays out the whole board

### Technical
- 📱 Responsive layout — works on projectors, desktops, tablets, and phones
- 🌐 Progressive Web App — installable to home screen on Android and iOS
- 📴 Fully offline — no internet required after first load
- 💾 Persistent — saved games and questions are stored between sessions in local SQLite
- 📦 *Planned:* single executable per platform (~30 MB) — no Node.js or npm required to run

> ⚠️ **Status:** the one-click executable is **not built yet** (see [Roadmap](#status--roadmap)). For now the app is run from source with Node.js — suitable for developers, not yet for a non-technical teacher. The teacher-ready packaged build is the next major milestone.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite |
| PWA / Offline | vite-plugin-pwa, Service Worker |
| Routing | react-router-dom |
| Backend | Node.js, Express |
| Database | SQLite via better-sqlite3 |
| Packaging | @yao-pkg/pkg |
| Dev tooling | concurrently, nodemon |

---

## Project Structure

```
space-race/
├── client/                        ← React + Vite PWA frontend
│   ├── src/
│   │   ├── api/                   ← fetch wrappers (gamesApi, gameApi, questionsApi)
│   │   ├── components/
│   │   │   ├── GameLibrary.jsx    ← list of saved games (admin home)
│   │   │   ├── GameWizard.jsx     ← create/edit a game (teams + questions)
│   │   │   ├── QuestionBank.jsx   ← paginated add/edit/delete questions
│   │   │   ├── Board.jsx          ← the winding game board (SVG)
│   │   │   ├── PixelShip.jsx      ← 8-bit team spaceship
│   │   │   ├── PixelPlanet.jsx    ← 8-bit start/finish planet
│   │   │   ├── QuestionDisplay.jsx← question popup (Correct/Incorrect)
│   │   │   ├── GameControls.jsx   ← Next Question / Pause / Mute (on the board)
│   │   │   └── TurnIndicator.jsx  ← "Team X's turn"
│   │   ├── hooks/useGameState.js  ← polls /api/game/state
│   │   ├── pages/                 ← AdminPanel.jsx, GameScreen.jsx
│   │   └── main.jsx, App.jsx
│   └── vite.config.js             ← Vite + PWA plugin + API proxy
│
├── server/                        ← Node.js + Express backend
│   ├── db/                        ← schema, repositories, seed (example game)
│   ├── game/                      ← pure engine, state, sample questions, CLI
│   ├── routes/                    ← games.js, questions.js, game.js
│   ├── middleware/                ← central error handling
│   ├── app.js, server.js
│   └── package.json
│
├── scripts/play-http.mjs          ← HTTP playthrough demo
├── package.json                   ← root scripts (dev, play, demo:*, test, lint)
└── README.md
```

---

## Getting Started

### Prerequisites

Make sure you have the following installed on your machine **for development**:

- [Node.js](https://nodejs.org/) v20.19 or higher
- npm v9 or higher (comes with Node.js)
- A code editor — [VS Code](https://code.visualstudio.com/) is recommended

> Once the packaged executable is built, end users (teachers) will **not** need Node.js — they'll run the compiled executable directly. **That build does not exist yet** (see [Status & Roadmap](#status--roadmap)); for now the app runs from source as below.

### Installation

Clone the repository and install all dependencies:

```bash
git clone https://github.com/Giulyos/TCU-658-Space-Race.git
cd space-race

# Install root dev dependencies (concurrently)
npm install

# Install client and server dependencies
npm run install:all
```

### Running in Development

Start both the frontend dev server and the backend simultaneously:

```bash
npm run dev
```

This runs:
- **Frontend** at `http://localhost:5173` (Vite dev server with hot reload)
- **Backend** at `http://localhost:3001` (Express with nodemon)

The Vite dev server proxies all `/api` requests to the Express backend automatically — no CORS issues during development.

Open `http://localhost:5173/admin` for the Admin Panel and `http://localhost:5173/game` for the Game Screen.

To run them separately:

```bash
# Frontend only
cd client && npm run dev

# Backend only
cd server && npm run dev
```

### Running the Demo (terminal game)

You can play a complete game of Space Race directly in the terminal — no
database, server, or browser required:

```bash
npm run play
```

This runs the full game logic (the same pure engine used by the backend and UI)
in an interactive console: it shows the race track, draws a random question for
the team whose turn it is, and asks you to mark the answer **y** (correct), **n**
(incorrect), or **q** (quit). Ships advance by each question's point value, turns
rotate between the four teams, and a winner is declared when one reaches the
finish line. It's a quick way to see and verify the game mechanics on their own.

### Playing a Game over HTTP (API demo)

You can also play a full game against the **running server**, exercising the
real REST API and SQLite database with no UI involved:

```bash
# 1. In one terminal, start the server:
node server/server.js        # (or: npm run dev)

# 2. In another terminal, run the demo:
npm run demo:http
```

The demo checks the server health, seeds the question bank (only if empty),
starts a game, then plays it out turn by turn over HTTP — printing the race
track after each turn — until a team wins. It pauses for Enter at the major
steps so it can be narrated. This demonstrates that the entire backend works
end to end before any frontend is built.

## Status & Roadmap

The game is fully playable **from source** today: create games, manage questions,
and run a complete match on the projected board.

| Area | Status |
|---|---|
| Game engine, REST API, database (with a preloaded example game) | ✅ Done |
| Admin Panel — game library + setup wizard | ✅ Done |
| Game Screen — board, question popup, in-game controls, pause | ✅ Done |
| Smooth advance animation + on-screen winner banner | ⏳ Planned |
| Sound effects | ⏳ Planned |
| **Single double-click executable + offline PWA packaging** | ⏳ Planned (**needed before a non-technical teacher can run it without a terminal**) |

### Building for Production

Build the React frontend and then package the server + frontend into a standalone
executable with `@yao-pkg/pkg`:

```bash
npm run build
```

This runs:
1. `vite build` inside `client/` → static files in `client/dist/`
2. `@yao-pkg/pkg` from `server/` → an executable in `dist/` that bundles the
   Express server, the built frontend, the SQLite native module, and the seed
   questions. On launch the executable starts the local server, opens the
   teacher's browser, and writes `space-race.db` **next to the executable**.

To build only for the machine you're on (faster, used while testing):

```bash
npm --prefix client run build
npm --prefix server run build:pkg:host    # → dist/space-race
```

**Important — Node version & native module.** The bundled SQLite engine
(`better-sqlite3`) is a compiled native module, so its ABI must match the pkg
runtime. Build with **Node 22** (the line `better-sqlite3` ships prebuilds for and
that the `node22` pkg base uses). With a different Node version the executable
fails to load the database.

**Cross-platform builds.** Because the native module is platform-specific, a
single machine can only produce a *working* binary for **its own OS/arch** — the
bundled `.node` is the host's. The Windows / macOS / Linux binaries are therefore
built on their own OS (a CI matrix), each with Node 22, so every binary ships the
matching native module. (Set up in the packaging milestone, issue #43.)

---

## Using the Application

There are two screens, both opened in a normal web browser:

- **Admin Panel** (`/admin`) — the teacher's control room: pick or create a game, then play it.
- **Game Screen** (`/game`) — projected for the class: the board and the in-game controls.

> **Opening the app today (from source):** start it with `npm run dev`, then open
> **`http://localhost:5173/admin`** (teacher) and **`http://localhost:5173/game`** (projected).
> Once the packaged executable exists, the teacher will instead just double-click `SpaceRace`
> and it will open the browser automatically — no terminal needed.

### For the Teacher

#### 1. Open the Admin Panel and pick a game

Go to **`/admin`**. You'll see **My Games** — a library of saved games. A built-in
**example game** ("Example Game — English Basics") is already there to try.

- To use it as-is, click **Play** on it.
- To make your own, click **+ New Game** (see step 2).
- To change a game's teams, settings, or questions, click **Edit** on it.

#### 2. Create or edit a game (the setup wizard)

The wizard has two steps:

- **Step 1 — Teams & rules:** the game name, **spaces to win (3–10)**, the number of
  teams (2–4), and each team's name. Click **Next: Questions**.
- **Step 2 — Question bank:** add each question with its **text**, the **correct answer**,
  and a **point value** (how many spaces a correct answer advances the ship). Edit or delete
  any question. Click **Done** when finished — it returns to the library.

> Questions are answered **verbally** in class, so you only enter the question and the
> correct answer — there are no multiple-choice options shown to students.

#### 3. Play

1. On **`/admin`**, click **Play** on the game you want — this loads it and starts a match.
2. Project the **Game Screen** (`/game`) on the classroom display. It shows the board with
   each team's spaceship on its home planet.
3. On the Game Screen, press **Next Question** — the question pops up over the board for the
   team whose turn it is.
4. The team discusses and gives their answer out loud.
5. On the question popup, press **Correct** or **Incorrect**:
   - **Correct:** the popup closes and that team's spaceship advances by the question's point value.
   - **Incorrect:** the popup closes and the ship stays put.
6. Press **Next Question** again for the next team. Repeat until a team reaches the finish
   planet and wins.

#### In-game controls (on the Game Screen)

- **Next Question** (bottom) — reveal the next question for the current team.
- **Correct / Incorrect** (on the question popup) — mark the team's answer.
- **Pause** (top-right) — grays out the board; press **Resume** to continue.
- **Mute** (top-right) — toggle sound effects (shown when no question is up).

#### Restart

To play the same game again from the start (keeping its questions), go back to the
Admin Panel and press **Restart**.

> Saved games and their questions persist between sessions — you don't need to re-enter
> them each class.

---

### For Students — How to Play

**Objective:** Be the first team to reach the finish planet!

**Setup:**
- The teacher divides the class into 2–4 teams.
- Each team has a spaceship that starts on its own planet.
- The teacher projects the game on the screen.

**Gameplay:**
1. A question appears on screen for the team whose turn it is.
2. Your team discusses and agrees on **one** answer.
3. A representative says the answer out loud to the teacher.
4. If correct → your spaceship advances toward the center.
5. If incorrect → your spaceship stays put.
6. Turns pass between teams until one ship reaches the finish planet.

**Rules:**
- Only one answer per turn — agree before answering.
- The teacher has the final say on correctness.
- Do not interrupt other teams' turns.
- Be respectful at all times.

**Example:**

> **Question:** *What is the past tense of the verb GO?*
>
> **Team answers:** *"The past tense of GO is WENT."*
>
> **Teacher marks:** ✅ Correct — the spaceship advances!

---

## API Reference

All endpoints are local (`localhost:3001`) and require no authentication.

### Games (saved sessions)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/games` | List saved games |
| `POST` | `/api/games` | Create a game (name, finishLine 3–10, teamNames 2–4) |
| `GET` | `/api/games/:id` | Get one game |
| `PUT` | `/api/games/:id` | Update a game |
| `DELETE` | `/api/games/:id` | Delete a game (and its questions) |
| `POST` | `/api/games/:id/activate` | Load a game for play |
| `GET` | `/api/games/:gameId/questions` | List that game's questions |
| `POST` | `/api/games/:gameId/questions` | Add a question to that game |

### Questions

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/questions` | Get all questions |
| `POST` | `/api/questions` | Add a question |
| `PUT` | `/api/questions/:id` | Update a question |
| `DELETE` | `/api/questions/:id` | Delete a question |

**Question object:**
```json
{
  "id": 1,
  "game_id": 1,
  "text": "What is the past tense of GO?",
  "correct_answer": "WENT",
  "point_value": 1
}
```

### Game (play)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/game/start` | Start a match (board shown, no question yet) |
| `POST` | `/api/game/next` | Reveal the next question for the current team |
| `POST` | `/api/game/turn` | Mark the current question correct/incorrect |
| `POST` | `/api/game/pause` / `/api/game/resume` | Pause / resume |
| `POST` | `/api/game/restart` | Reset the match (keeps the game's questions) |
| `PUT` | `/api/game/settings` | Set finish line / team names |
| `GET` | `/api/game/state` | Get current game state |

**Turn request body:**
```json
{ "correct": true }
```

**Game state response:**
```json
{
  "state": {
    "active": 1,
    "currentTeam": 2,
    "positions": [3, 1, 0, 2],
    "finishLine": 10,
    "teamNames": ["Team 1", "Team 2", "Team 3", "Team 4"],
    "currentQuestion": 5,
    "mapSeed": 123456,
    "winner": null
  },
  "question": { "id": 5, "text": "...", "correct_answer": "...", "point_value": 2 }
}
```

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server health check |

---

## Database Schema

The SQLite database is stored as `space-race.db` next to the server (in development,
`server/space-race.db`; once packaged, beside the executable).

```sql
-- Saved games (each has its own teams, finish line, and question bank)
CREATE TABLE games (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  finish_line INTEGER NOT NULL DEFAULT 10,   -- 3–10
  team_names  TEXT    NOT NULL DEFAULT '["Team 1","Team 2","Team 3","Team 4"]',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Question bank (each question belongs to a game)
CREATE TABLE questions (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id        INTEGER REFERENCES games(id),
  text           TEXT    NOT NULL,
  correct_answer TEXT    NOT NULL,
  point_value    INTEGER NOT NULL DEFAULT 1,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- The single live game state (one row)
CREATE TABLE game_state (
  id               INTEGER PRIMARY KEY DEFAULT 1,
  game_id          INTEGER,                       -- the game loaded for play
  active           INTEGER NOT NULL DEFAULT 0,    -- 0 = not started, 1 = active, 2 = paused
  current_team     INTEGER NOT NULL DEFAULT 1,    -- 1–4
  positions        TEXT    NOT NULL DEFAULT '[0,0,0,0]',
  finish_line      INTEGER NOT NULL DEFAULT 10,
  team_names       TEXT    NOT NULL DEFAULT '["Team 1","Team 2","Team 3","Team 4"]',
  used_questions   TEXT    NOT NULL DEFAULT '[]',
  current_question INTEGER,                        -- id of the question on screen, or NULL
  map_seed         INTEGER,                        -- per-game board visual seed
  winner           INTEGER,                        -- NULL or team number 1–4
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Deployment — Distributing the Executable

After running `npm run build`, the three executables in `dist/` are self-contained. To distribute them:

1. Upload them to the [GitHub Releases](https://github.com/Giulyos/TCU-658-Space-Race/releases) page
2. Teachers download the file for their OS — that's it

The executable includes:
- The Node.js runtime
- The Express server
- All npm dependencies
- The compiled React frontend (HTML/CSS/JS)
- The PWA manifest and service worker

The only file created at runtime (not included) is `spacerace.db`, which is generated automatically in the same folder as the executable on first run.

> ⚠️ **macOS note:** On first run, macOS may block the executable with a security warning. Right-click → Open → Open anyway to allow it. This is expected behavior for unsigned binaries.

> ⚠️ **pkg version note:** This project uses `@yao-pkg/pkg` — a maintained fork of the original `vercel/pkg` which was abandoned in 2023. Do not use `vercel/pkg` as it does not support modern Node.js versions.

---

## Offline Support

The PWA is configured with `vite-plugin-pwa` to cache all static assets (HTML, CSS, JS, images, sounds) during the first load. After that, the app works with zero internet connectivity.

The service worker (Workbox via `vite-plugin-pwa`) **precaches the entire app shell** — HTML, JS, CSS, the bundled Press Start 2P font, the PWA icons, and the sound effects (`*.wav`) — using a **cache-first** strategy, meaning:
- On subsequent visits, every asset is served from cache instantly, with **no network request** for any part of the UI
- Client routes (`/admin`, `/game`) fall back to the cached `index.html`, so a page reload works offline (only `/api/*` is left to the local server)
- When connectivity is available, the service worker checks for updates in the background and applies them automatically (`registerType: 'autoUpdate'`)

Since all data (questions, game state) lives in the local SQLite database, there is no data dependency on any external server at any point.

### Verifying offline support

The service worker only runs against a **production build** (not the dev server), so test the built app:

```bash
# 1. Build the client (generates the service worker + precache manifest)
npm --prefix client run build

# 2. Serve the built app
npm --prefix client run preview      # http://localhost:4173
```

Then in the browser:

1. Open the app and load it once (this lets the service worker install and precache the shell).
2. Open **DevTools → Application → Service Workers** and confirm the worker is **activated and running**.
3. Tick **Offline** (DevTools → Network → "Offline", or Application → Service Workers → "Offline").
4. **Reload the page.** The app shell must still load — title, board, styling, fonts, sounds all present — with no "no internet" error. (`/api` calls will fail while fully offline with no server; the point is that the *app itself* loads with the network disabled.)
5. Navigate to `/admin` and `/game` and reload each — both should load from cache (SPA fallback).

This was verified by automation against the production preview with the network disabled: the shell loads, and the precached sounds and icons serve from cache (HTTP 200) with no page errors.

---

## Contributing

This project was developed for educational use at CTP de Guácimo as part of TCU-658. Contributions that improve classroom usability, accessibility, or compatibility are welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "Add: brief description"`
4. Push to your branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please keep commits small and focused. Use clear commit messages in the format `Add:`, `Fix:`, `Update:`, or `Remove:`.

### Testing & quality gates

Tests and linting can be run for both packages at once from the repository root:

```bash
npm test       # runs the server and client test suites (Vitest)
npm run lint   # runs ESLint on the server and client packages
```

A **husky** pre-commit hook runs **lint-staged**, which automatically lints and tests
the package(s) that have staged changes. Commits that introduce lint errors or failing
tests are **blocked** — this enforces the project rule that no code is committed with
failing tests or lint errors. Hooks are installed automatically on `npm install` (via the
`prepare` script); no manual setup is required.

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

*Developed as part of TCU-658 — Escuela de Lenguas Modernas, Universidad de Costa Rica.*
*Educational material for the MEP Technical English program.*