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
  - [Building for Production](#building-for-production)
- [Using the Application](#using-the-application)
  - [For the Teacher — Admin Panel](#for-the-teacher--admin-panel)
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

The teacher loads questions into the question bank before class, projects the game on the classroom screen, and manages turns using simple Correct/Incorrect buttons. Students discuss answers as a team and a representative communicates the answer. No student device is needed — the entire game is teacher-operated.

---

## Features

### Gameplay
- 🛸 Four simultaneous teams, each with their own spaceship on the race track
- ❓ Questions drawn randomly from the teacher's question bank (no repeats per session)
- ⚖️ Configurable point values per question (each question can advance the ship 1 or more spaces)
- 🏁 Configurable finish line (teacher sets how many spaces are needed to win)
- 🎬 Visual advance animation on correct answers
- 🔊 Sound effects with mute option
- 🏆 Automatic winner detection and announcement

### Admin Panel
- ➕ Add, edit, and delete questions with correct answers and optional distractors
- 📋 Live editable question bank list
- ⚙️ Configure team names, number of spaces to win, and active question bank
- ▶️ Start, pause, and restart game controls
- ✅ One-click Correct / Incorrect buttons for turn management

### Technical
- 📱 Responsive layout — works on projectors, desktops, tablets, and phones
- 🌐 Progressive Web App — installable to home screen on Android and iOS
- 📴 Fully offline — no internet required after first load
- 💾 Persistent question bank — questions are saved between sessions in local SQLite
- 📦 Single executable per platform (~30 MB) — no Node.js or npm required to run

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
│   ├── public/
│   │   ├── icons/                 ← PWA icons (192x192, 512x512)
│   │   └── sounds/                ← Sound effects (.mp3)
│   ├── src/
│   │   ├── api/
│   │   │   ├── gameApi.js         ← API calls: start, turn, state, restart
│   │   │   └── questionsApi.js    ← API calls: CRUD for question bank
│   │   ├── components/
│   │   │   ├── RaceTrack.jsx      ← Visual race track with n spaces
│   │   │   ├── Spaceship.jsx      ← Individual team spaceship
│   │   │   ├── QuestionDisplay.jsx← Active question card
│   │   │   ├── Scoreboard.jsx     ← Team progress indicators
│   │   │   └── TurnIndicator.jsx  ← "Team X's turn" display
│   │   ├── hooks/
│   │   │   └── useGameState.js    ← Custom hook for game state polling
│   │   ├── pages/
│   │   │   ├── GameScreen.jsx     ← Main projected game view
│   │   │   └── AdminPanel.jsx     ← Teacher control panel
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js             ← Vite config with PWA plugin and API proxy
│   └── package.json
│
├── server/                        ← Node.js + Express backend
│   ├── db/
│   │   ├── database.js            ← better-sqlite3 init, exports db instance
│   │   └── schema.js              ← Table creation (questions, game_state)
│   ├── routes/
│   │   ├── questions.js           ← CRUD endpoints for question bank
│   │   └── game.js                ← Game control endpoints
│   ├── server.js                  ← Express entry point
│   └── package.json
│
├── package.json                   ← Root: concurrently dev script, build script
└── README.md
```

---

## Getting Started

### Prerequisites

Make sure you have the following installed on your machine **for development**:

- [Node.js](https://nodejs.org/) v20.19 or higher
- npm v9 or higher (comes with Node.js)
- A code editor — [VS Code](https://code.visualstudio.com/) is recommended

> End users (teachers) do **not** need Node.js. They run the compiled executable directly.

### Installation

Clone the repository and install all dependencies:

```bash
git clone https://github.com/your-username/space-race.git
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

### Building for Production

Build the React frontend and then package everything into cross-platform executables:

```bash
npm run build
```

This will:
1. Run `vite build` inside `client/` — outputs static files to `client/dist/`
2. Run `@yao-pkg/pkg` from `server/` — bundles Express + SQLite + the built frontend into three executables placed in `dist/`:

```
dist/
├── SpaceRace.exe        ← Windows
├── SpaceRace-macos      ← macOS
└── SpaceRace-linux      ← Linux
```

---

## Using the Application

### For the Teacher — Admin Panel

#### First-time setup (once per device)

Download the executable for your operating system from the [Releases](https://github.com/your-username/space-race/releases) page:

| OS | File |
|---|---|
| Windows | `SpaceRace.exe` — double-click to run |
| macOS | `SpaceRace` — open from Downloads folder |
| Linux | `SpaceRace` — run `./SpaceRace` in terminal |

The app will automatically open your browser at `http://localhost:3001`.

On mobile: tap the browser menu → **"Add to Home Screen"** to install the PWA for quick access.

#### Before class — Setting up the question bank

1. Go to the **Admin Panel** (`/admin`)
2. Under **Question Bank**, add each question:
   - Question text (in English)
   - Correct answer
   - Optional distractors (wrong answers, shown to students if using multiple choice mode)
   - Point value (how many spaces the spaceship advances on a correct answer)
3. Under **Game Settings**, configure:
   - Number of spaces needed to win (`n`)
   - Team names (Team 1–4 or custom names)
4. Click **Save Configuration**
5. Project the Game Screen (`/game`) on the classroom display

#### During the game

1. Click **Start Game** — the first question appears randomly on screen
2. The active team discusses and gives their answer
3. Click **Correct** ✅ or **Incorrect** ❌
   - Correct: the team's spaceship advances by the question's point value
   - Incorrect: the spaceship stays in place
4. The turn passes automatically to the next team with a new random question
5. The game ends when a team reaches the finish line — the winner is announced on screen

#### Additional controls

- **Pause** — freezes the game at any point
- **Restart** — resets all ships to the start (keeps the question bank)
- **Mute** — toggles sound effects

> The question bank persists between sessions. You do not need to re-enter questions each time you use the app.

---

### For Students — How to Play

**Objective:** Be the first team to reach the finish line!

**Setup:**
- The teacher divides the class into 4 teams
- Each team picks a name
- The teacher projects the game on the screen

**Gameplay:**
1. The game starts with Team 1 — a question appears on screen
2. Your team discusses and agrees on an answer
3. One representative communicates the answer to the teacher
4. If correct ✅ → your spaceship advances
5. If incorrect ❌ → your spaceship stays put, next team plays
6. Teams alternate until one spaceship reaches the finish line

**Rules:**
- Only one answer per turn — agree before answering
- The teacher has the final say on correctness
- Do not interrupt other teams' turns
- Be respectful at all times

**Example:**

> **Question:** *What is the past tense of the verb GO?*
>
> **Team answers:** *"The past tense of GO is WENT."*
>
> **Teacher marks:** ✅ Correct — spaceship advances one space!

---

## API Reference

All endpoints are local (`localhost:3001`) and require no authentication.

### Questions

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/questions` | Get all questions in the bank |
| `POST` | `/api/questions` | Add a new question |
| `PUT` | `/api/questions/:id` | Update an existing question |
| `DELETE` | `/api/questions/:id` | Delete a question |

**Question object:**
```json
{
  "id": 1,
  "text": "What is the past tense of GO?",
  "correct_answer": "WENT",
  "distractors": ["GOED", "GOING", "GONE"],
  "point_value": 1
}
```

### Game

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/game/start` | Start a new game with current config |
| `GET` | `/api/game/state` | Get current game state |
| `POST` | `/api/game/turn` | Submit result of current turn |
| `POST` | `/api/game/restart` | Reset game (keeps question bank) |

**Turn request body:**
```json
{
  "correct": true
}
```

**Game state response:**
```json
{
  "active": true,
  "current_team": 2,
  "positions": [3, 1, 0, 2],
  "finish_line": 10,
  "current_question": { ... },
  "winner": null
}
```

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server health check |

---

## Database Schema

The SQLite database is stored as `spacerace.db` in the same directory as the executable.

```sql
-- Question bank
CREATE TABLE questions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  text          TEXT    NOT NULL,
  correct_answer TEXT   NOT NULL,
  distractors   TEXT,           -- JSON array stored as string
  point_value   INTEGER NOT NULL DEFAULT 1,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Game configuration and state
CREATE TABLE game_state (
  id            INTEGER PRIMARY KEY DEFAULT 1,
  active        INTEGER NOT NULL DEFAULT 0,   -- 0 = not started, 1 = active, 2 = paused
  current_team  INTEGER NOT NULL DEFAULT 1,   -- 1–4
  positions     TEXT    NOT NULL DEFAULT '[0,0,0,0]',  -- JSON array
  finish_line   INTEGER NOT NULL DEFAULT 10,
  team_names    TEXT    NOT NULL DEFAULT '["Team 1","Team 2","Team 3","Team 4"]',
  used_questions TEXT   NOT NULL DEFAULT '[]', -- JSON array of used question IDs
  winner        INTEGER,                       -- NULL or team number 1–4
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Deployment — Distributing the Executable

After running `npm run build`, the three executables in `dist/` are self-contained. To distribute them:

1. Upload them to the [GitHub Releases](https://github.com/your-username/space-race/releases) page
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

The service worker uses a **cache-first** strategy for static assets, meaning:
- On subsequent visits, assets are served from cache instantly
- When connectivity is available, the service worker checks for updates in the background
- Teachers are notified when an update is ready and can refresh to apply it

Since all data (questions, game state) lives in the local SQLite database, there is no data dependency on any external server at any point.

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