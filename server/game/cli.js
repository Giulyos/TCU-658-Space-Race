import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output, argv } from 'node:process'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

import { createInitialState } from './state.js'
import {
  startGame,
  pickQuestion,
  resolveTurn,
  checkWinner,
} from './engine.js'

// Terminal-playable Space Race.
//
// This is the milestone demo: it runs a complete game in the console using the
// exact same pure engine (server/game/engine.js) that will later power the REST
// API and React UI — proving the full game logic before any backend or frontend
// exists. The teacher reads the question aloud, the team answers verbally, and
// the operator marks it correct/incorrect; ships advance and a winner is
// declared, just like the real game.

const FINISH_LINE = 10

const bank = JSON.parse(
  readFileSync(new URL('./sample-questions.json', import.meta.url)),
)

/**
 * Renders the race track as a multi-line string: one lane per team, the ship at
 * its current space, the finish flag at the end, and an arrow marking whose turn
 * it is. Pure and side-effect-free so it can be unit tested.
 *
 * @param {object} state
 * @returns {string}
 */
export const renderTrack = (state) =>
  state.teamNames
    .map((name, i) => {
      const pos = state.positions[i]
      const shipCell = Math.min(pos, state.finishLine - 1)
      const lane = Array.from({ length: state.finishLine }, (_, c) =>
        c === shipCell ? '🚀' : '·',
      ).join('')
      const turnMarker = state.currentTeam === i + 1 ? '→' : ' '
      return `${turnMarker} ${name.padEnd(8)} |${lane}|🏁  ${pos}/${state.finishLine}`
    })
    .join('\n')

/**
 * Picks the next question, reshuffling (clearing the used list) when the bank is
 * exhausted so a demo game can always finish even with a small question set.
 *
 * @param {object} state
 * @returns {{ state: object, question: object }}
 */
const nextQuestion = (state) => {
  let pick = pickQuestion(state, bank)
  if (!pick.question) {
    pick = pickQuestion({ ...state, usedQuestions: [] }, bank)
  }
  return pick
}

// Prints the track and the active question, then the answer prompt.
const promptTurn = (state, question) => {
  const teamName = state.teamNames[state.currentTeam - 1]
  output.write('\n' + renderTrack(state) + '\n\n')
  output.write(`${teamName}'s turn — worth ${question.point_value} space(s)\n`)
  output.write(`Q: ${question.text}\n`)
  output.write(`(correct answer: ${question.correct_answer})\n`)
  output.write('Correct? (y/n/q): ')
}

const main = async () => {
  const rl = createInterface({ input, output })

  output.write('\n🚀  SPACE RACE — terminal demo  🚀\n')
  output.write('Mark each answer correct (y) or incorrect (n). Type q to quit.\n')

  let state = startGame(createInitialState({ finishLine: FINISH_LINE }))
  let { state: picked, question } = nextQuestion(state)
  state = picked
  promptTurn(state, question)

  // The async iterator reliably yields one line per turn for both interactive
  // (TTY) and piped input, unlike repeated rl.question() calls.
  for await (const line of rl) {
    const answer = line.trim().toLowerCase()
    if (answer === 'q') {
      output.write('\nGame ended early. Bye!\n')
      break
    }

    const correct = answer.startsWith('y')
    state = checkWinner(
      resolveTurn(state, { correct, pointValue: question.point_value }),
    )

    if (state.winner !== null) {
      output.write('\n' + renderTrack(state) + '\n')
      output.write(
        `\n🏆  ${state.teamNames[state.winner - 1]} wins the Space Race!  🏆\n\n`,
      )
      break
    }

    ;({ state, question } = nextQuestion(state))
    promptTurn(state, question)
  }

  rl.close()
}

// Only launch the interactive game when run directly (e.g. `npm run play`),
// not when this module is imported (e.g. by tests importing renderTrack).
if (import.meta.url === pathToFileURL(argv[1]).href) {
  main()
}
