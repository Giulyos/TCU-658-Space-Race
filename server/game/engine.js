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
