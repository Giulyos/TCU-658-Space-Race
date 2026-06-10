import {
  STATUS,
  DEFAULT_FINISH_LINE,
  DEFAULT_TEAM_COUNT,
  defaultTeamNames,
} from './constants.js'

/**
 * Creates a fresh, not-started game state.
 *
 * This is the single source of truth for the state shape used throughout the
 * engine, the persistence layer, and the API. It mirrors the game_state table:
 *
 *   active        0 = not started, 1 = active, 2 = paused
 *   currentTeam   1-based index of the team whose turn it is
 *   positions     space each team's ship occupies (index 0 = team 1)
 *   finishLine    spaces required to win
 *   teamNames     display names; length defines the number of teams
 *   usedQuestions ids of questions already shown this session (no repeats)
 *   winner        null until a team wins, then that team's 1-based number
 *
 * @param {object} [config]
 * @param {number}   [config.teamCount]  Number of teams (ignored if teamNames is given).
 * @param {string[]} [config.teamNames]  Team names; its length determines the team count.
 * @param {number}   [config.finishLine] Spaces required to win.
 * @returns {{
 *   active: number, currentTeam: number, positions: number[], finishLine: number,
 *   teamNames: string[], usedQuestions: number[], winner: number|null
 * }}
 */
export const createInitialState = (config = {}) => {
  const teamNames =
    config.teamNames ?? defaultTeamNames(config.teamCount ?? DEFAULT_TEAM_COUNT)
  const teamCount = teamNames.length
  const finishLine = config.finishLine ?? DEFAULT_FINISH_LINE

  return {
    active: STATUS.NOT_STARTED,
    currentTeam: 1,
    positions: Array.from({ length: teamCount }, () => 0),
    finishLine,
    teamNames: [...teamNames],
    usedQuestions: [],
    winner: null,
  }
}
