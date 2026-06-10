import { STATUS } from './constants.js'

// The game engine is a set of pure functions: each takes a state object (plus
// any inputs) and returns a NEW state, never mutating its argument. This keeps
// the rules framework-agnostic and trivially testable, and lets the same engine
// power the terminal CLI, the REST API, and the persistence layer.

/**
 * Starts (or restarts) a game from the given configured state.
 *
 * Resets all ships to the starting line, hands the turn to team 1, marks the
 * game active, and clears any prior winner / used-question history. The team
 * configuration (teamNames, positions length) and finishLine are preserved.
 *
 * @param {object} state Current game state (e.g. from createInitialState).
 * @returns {object} A new active game state.
 */
export const startGame = (state) => ({
  ...state,
  active: STATUS.ACTIVE,
  currentTeam: 1,
  positions: state.positions.map(() => 0),
  winner: null,
  usedQuestions: [],
})

/**
 * Selects a random question from the bank that has not been used this session.
 *
 * Questions are never repeated within a session: the chosen question's id is
 * appended to usedQuestions in the returned state. When every question has
 * already been used (the bank is exhausted), the question is `null` and the
 * state is returned unchanged.
 *
 * The random source is injectable so callers (and tests) can make selection
 * deterministic; it defaults to Math.random.
 *
 * @param {object} state Current game state.
 * @param {Array<{id: number}>} bank The teacher's question bank.
 * @param {() => number} [rng] Returns a float in [0, 1); defaults to Math.random.
 * @returns {{ state: object, question: object|null }}
 */
export const pickQuestion = (state, bank, rng = Math.random) => {
  const available = bank.filter((q) => !state.usedQuestions.includes(q.id))
  if (available.length === 0) {
    return { state, question: null }
  }

  const question = available[Math.floor(rng() * available.length)]
  return {
    state: { ...state, usedQuestions: [...state.usedQuestions, question.id] },
    question,
  }
}

/**
 * Resolves the current team's turn and hands play to the next team.
 *
 * On a correct answer the current team's ship advances by the question's point
 * value; on an incorrect answer no ship moves. Either way the turn rotates to
 * the next team, wrapping from the last team back to team 1. Winner detection
 * is handled separately (see checkWinner).
 *
 * @param {object} state Current game state.
 * @param {{ correct: boolean, pointValue?: number }} result
 *   Turn outcome; pointValue is the active question's value (defaults to 1).
 * @returns {object} A new state with the advance (if any) and rotated turn.
 */
export const resolveTurn = (state, { correct, pointValue = 1 }) => {
  // Once a team has won, the game is over and no further turns are accepted.
  if (state.winner !== null) return state

  const teamIndex = state.currentTeam - 1
  const teamCount = state.positions.length
  const positions = state.positions.map((pos, i) =>
    i === teamIndex && correct ? pos + pointValue : pos,
  )
  const nextTeam = (state.currentTeam % teamCount) + 1
  return { ...state, positions, currentTeam: nextTeam }
}

/**
 * Detects whether a team has reached the finish line and records the winner.
 *
 * A team wins as soon as its position reaches or passes finishLine (an exact
 * hit and an overshoot both count). The winner is the team's 1-based number.
 * If a winner is already recorded, or no team has reached the line, the state
 * is returned unchanged. Typically called right after resolveTurn.
 *
 * @param {object} state Current game state.
 * @returns {object} The state, with `winner` set if a team has finished.
 */
export const checkWinner = (state) => {
  if (state.winner !== null) return state

  const index = state.positions.findIndex((pos) => pos >= state.finishLine)
  if (index === -1) return state

  return { ...state, winner: index + 1 }
}

/**
 * Pauses an active game. No-op unless the game is currently active.
 * @param {object} state
 * @returns {object}
 */
export const pause = (state) =>
  state.active === STATUS.ACTIVE ? { ...state, active: STATUS.PAUSED } : state

/**
 * Resumes a paused game. No-op unless the game is currently paused.
 * @param {object} state
 * @returns {object}
 */
export const resume = (state) =>
  state.active === STATUS.PAUSED ? { ...state, active: STATUS.ACTIVE } : state

/**
 * Restarts the game: clears positions, winner, used questions and turn, and
 * begins a fresh active match. The team configuration and finish line are
 * preserved, and the question bank (which lives outside the engine state) is
 * untouched. Equivalent to starting a new game with the same settings.
 *
 * @param {object} state
 * @returns {object} A new active game state.
 */
export const restart = (state) => startGame(state)
