// HTTP playthrough demo (Milestone 3).
//
// Plays a complete game of Space Race over HTTP against the RUNNING server,
// using only the real REST API + SQLite database — no UI involved. This proves
// the whole backend works end to end before any frontend exists.
//
// 1. Start the server in one terminal:   node server/server.js
//                                  (or:   npm run dev)
// 2. Run this demo in another:           npm run demo:http
//
// The demo pauses for Enter at the major steps so it can be narrated live.

import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { renderTrack } from '../server/game/cli.js'

const BASE = process.env.BASE_URL ?? 'http://localhost:3001'

const rl = createInterface({ input, output })
const lines = rl[Symbol.asyncIterator]()
const line = (s = '') => output.write(s + '\n')
const pause = async (msg) => {
  output.write(`\n↵  ${msg} `)
  await lines.next()
}

// Thin fetch wrapper that throws a readable error on a non-2xx response.
const api = async (method, path, body) => {
  let res
  try {
    res = await fetch(BASE + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error(
      `Could not reach the server at ${BASE}. Start it first (node server/server.js or npm run dev).`,
    )
  }
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${data?.error ?? text}`)
  return data
}

const SAMPLE = [
  { text: 'Past tense of "go"?', correct_answer: 'went', point_value: 2 },
  { text: 'Plural of "child"?', correct_answer: 'children', point_value: 2 },
  { text: 'Opposite of "expensive"?', correct_answer: 'cheap', point_value: 3 },
  { text: 'Comparative of "good"?', correct_answer: 'better', point_value: 3 },
]

const main = async () => {
  line('\n🚀  SPACE RACE — HTTP Playthrough (Milestone 3)  🚀')
  line(`Talking to the real server at ${BASE} — REST API + SQLite, no UI.`)

  await pause('Press Enter to check the server is up...')
  const health = await api('GET', '/api/health')
  line(`Server health: ${JSON.stringify(health)}`)

  await pause('Press Enter to make sure the question bank is set up...')
  const existing = await api('GET', '/api/questions')
  if (existing.length === 0) {
    for (const q of SAMPLE) await api('POST', '/api/questions', q)
    line(`Seeded ${SAMPLE.length} questions into the bank.`)
  } else {
    line(`Question bank already has ${existing.length} questions — reusing them.`)
  }

  await pause('Press Enter to START the game (the server draws the first question)...')
  let { state, question } = await api('POST', '/api/game/start')
  line('\n' + renderTrack(state))
  line(`\nFirst question for ${state.teamNames[state.currentTeam - 1]}: "${question.text}"`)

  await pause('Press Enter to play the game out (each team answers correctly)...')
  let turns = 0
  while (state.winner === null) {
    turns += 1
    const answering = state.teamNames[state.currentTeam - 1]
    const worth = question ? question.point_value : 1
    ;({ state, question } = await api('POST', '/api/game/turn', { correct: true }))
    line(`\nTurn ${turns}: ${answering} answered correctly (+${worth})`)
    line(renderTrack(state))
  }

  line(`\n🏆  ${state.teamNames[state.winner - 1]} wins the Space Race!  🏆`)
  line(`(played over ${turns} turns, entirely through the HTTP API)\n`)

  rl.close()
}

main().catch((err) => {
  line(`\n❌  ${err.message}\n`)
  rl.close()
  process.exitCode = 1
})
