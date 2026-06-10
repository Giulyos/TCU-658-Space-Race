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
