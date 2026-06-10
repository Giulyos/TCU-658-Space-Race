// Canonical constants for the Space Race game engine.
//
// This module is framework-agnostic — no Express, no SQLite — so it can be
// shared unchanged by the terminal CLI, the REST API, and unit tests.

// Game status. Mirrors the `active` column of the game_state table.
// A *finished* game is represented by `winner` being non-null; the schema only
// defines these three active states, so there is intentionally no FINISHED here.
export const STATUS = Object.freeze({
  NOT_STARTED: 0,
  ACTIVE: 1,
  PAUSED: 2,
})

// Defaults applied when no configuration is supplied.
export const DEFAULT_TEAM_COUNT = 4
export const DEFAULT_FINISH_LINE = 10

// Supported range for teacher-configurable settings (used by validation later).
export const MIN_TEAMS = 2
export const MAX_TEAMS = 4
export const MIN_FINISH_LINE = 1

// Generates sequential default team names: ["Team 1", "Team 2", ...].
export const defaultTeamNames = (count = DEFAULT_TEAM_COUNT) =>
  Array.from({ length: count }, (_, i) => `Team ${i + 1}`)
