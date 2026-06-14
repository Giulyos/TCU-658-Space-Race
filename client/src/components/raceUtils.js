// Shared, non-component helpers for the race track. Kept in a plain module so
// the component files only export components (required for React fast refresh).

export const TEAM_COLORS = ['#21d4fd', '#ff3ca6', '#ffd23f', '#6dff8f']

export const teamColor = (team) => TEAM_COLORS[(team - 1) % TEAM_COLORS.length]

// Maps a board position (0..finishLine) to a clamped left-offset percentage.
export const positionPercent = (pos, finishLine) => {
  if (finishLine <= 0) return 0
  return Math.min(100, Math.max(0, (pos / finishLine) * 100))
}
