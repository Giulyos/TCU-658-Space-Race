// Persistence demo (Milestone 2) — presenter edition.
//
// Proves the headline value of M2: the question bank and game state are stored
// in a real on-disk SQLite database and survive between sessions. We write some
// data, CLOSE the database connection (simulating the teacher closing the app),
// then OPEN a brand-new connection to the same file and show the data is still
// there.
//
// The demo pauses between each step and waits for you to press Enter, so you can
// explain what is happening at your own pace.
//
// Run with:  npm run demo:db      (or: node server/db/persistence-demo.mjs)

import Database from 'better-sqlite3'
import { rmSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { initializeSchema } from './schema.js'
import { createQuestionsRepo } from './questionsRepo.js'
import { createGameStateRepo } from './gameStateRepo.js'
import { startGame, resolveTurn } from '../game/engine.js'

const DB_FILE = new URL('./persistence-demo.db', import.meta.url).pathname
rmSync(DB_FILE, { force: true }) // start clean each run

const rl = createInterface({ input, output })
// Pull one line per pause via the async iterator, which reliably yields a line
// per Enter for both interactive (TTY) and piped input.
const lines = rl[Symbol.asyncIterator]()
const line = (s = '') => output.write(s + '\n')
const step = async (title) => {
  output.write('\n↵  Press Enter to continue...')
  await lines.next()
  line('──────────────────────────────────────────────')
  line(`▶  ${title}`)
  line('──────────────────────────────────────────────')
}

line('\n🚀  SPACE RACE — Persistence Demo (Milestone 2)  🚀')
line('We will store data, close the database, reopen it, and check the data survived.')

// ── Step 1: open a fresh database ──────────────────────────────────────────
await step('STEP 1 — Open a brand-new, empty database')
let db = new Database(DB_FILE)
initializeSchema(db)
let questions = createQuestionsRepo(db)
let game = createGameStateRepo(db)
line(`Database created at: ${DB_FILE}`)
line(`Questions in the bank: ${questions.getAll().length}  (empty, as expected)`)

// ── Step 2: add questions ──────────────────────────────────────────────────
await step('STEP 2 — Teacher adds questions to the bank')
questions.create({ text: 'Past tense of "go"?', correct_answer: 'went', point_value: 1 })
questions.create({ text: 'Plural of "child"?', correct_answer: 'children', point_value: 2 })
line(`Added ${questions.getAll().length} questions:`)
for (const q of questions.getAll()) {
  line(`  #${q.id}  "${q.text}"  → ${q.correct_answer}  (worth ${q.point_value})`)
}

// ── Step 3: start a game and play a turn ───────────────────────────────────
await step('STEP 3 — Start a game and play one turn')
let state = startGame(game.load())
state = resolveTurn(state, { correct: true, pointValue: 2 }) // Team 1 advances 2
game.save(state)
line('Team 1 answered correctly and advanced 2 spaces.')
line(`Team positions now: [${game.load().positions}]`)

// ── Step 4: close the database ─────────────────────────────────────────────
await step('STEP 4 — Close the database (the teacher closes the app)')
db.close()
line('Database connection closed. The app is, in effect, shut down.')

// ── Step 5: reopen the SAME file in a fresh connection ─────────────────────
await step('STEP 5 — Reopen the app later (new connection, same file)')
db = new Database(DB_FILE)
questions = createQuestionsRepo(db)
game = createGameStateRepo(db)
line('Opened a fresh connection to the same database file.')

// ── Step 6: verify everything survived ─────────────────────────────────────
await step('STEP 6 — Check: is everything still there?')
line('Question bank after reopening:')
for (const q of questions.getAll()) {
  line(`  #${q.id}  "${q.text}"  → ${q.correct_answer}  (worth ${q.point_value})`)
}
line(`Game positions after reopening: [${game.load().positions}]`)

line('\n✅  The questions and the game state were still there — nothing was re-entered.')
line('    This is what lets a teacher keep their question bank between classes.\n')

db.close()
rmSync(DB_FILE, { force: true }) // clean up the demo db
rl.close()
