// Shared, non-component helper for team colours. Kept in a plain module so the
// component files only export components (required for React fast refresh).

export const TEAM_COLORS = ['#21d4fd', '#ff3ca6', '#ffd23f', '#6dff8f']

export const teamColor = (team) => TEAM_COLORS[(team - 1) % TEAM_COLORS.length]
