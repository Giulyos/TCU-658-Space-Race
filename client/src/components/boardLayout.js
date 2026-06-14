// Pure geometry for the Jumanji-style board, in a 16:9 viewBox (BOARD_W x
// BOARD_H). Kept free of React/DOM so ship positioning is unit-testable (jsdom
// has no layout engine).
//
// Layout per team count (finish is the shared destination):
//   2 teams: finish top-center; teams start in the two bottom corners.
//   3 teams: finish top-center; teams start bottom-left / center / right.
//   4 teams: finish in the center; teams start in the four corners.

export const BOARD_W = 160
export const BOARD_H = 90

export const layoutFor = (teamCount) => {
  switch (teamCount) {
    case 2:
      return { finish: [80, 16], starts: [[22, 74], [138, 74]] }
    case 3:
      return { finish: [80, 16], starts: [[22, 74], [80, 74], [138, 74]] }
    case 4:
    default:
      return { finish: [80, 45], starts: [[20, 16], [140, 16], [20, 74], [140, 74]] }
  }
}

// Deterministically picks a variant index (0..count-1) for a board "slot" from
// the per-game map seed. Same seed+slot always yields the same variant (stable
// across polls); a new seed each game yields a different map.
export const planetVariant = (seed, slot, count) => {
  const h = (((seed ?? 0) >>> 0) + (slot + 1) * 0x9e3779b1) >>> 0
  return h % count
}

// Builds a winding (zig-zagging) polyline from start to finish: interior
// waypoints are offset alternately to either side of the straight line, giving
// the path its "twists and turns". Endpoints are exactly start and finish.
export const makeWindingPath = (start, finish, twists = 4, amplitude = 11) => {
  const [sx, sy] = start
  const [fx, fy] = finish
  const dx = fx - sx
  const dy = fy - sy
  const len = Math.hypot(dx, dy) || 1
  const px = -dy / len // unit perpendicular
  const py = dx / len

  const pts = []
  for (let i = 0; i <= twists; i++) {
    const t = i / twists
    const bx = sx + dx * t
    const by = sy + dy * t
    const off = i === 0 || i === twists ? 0 : i % 2 === 0 ? amplitude : -amplitude
    pts.push([bx + px * off, by + py * off])
  }
  return pts
}

// Returns n+1 points evenly spaced by arc length along the polyline (index 0 at
// the start, index n at the finish). Used both to draw the board spaces and to
// place a ship on the space matching its score.
export const sampleAlong = (waypoints, n) => {
  const segLen = []
  let total = 0
  for (let i = 1; i < waypoints.length; i++) {
    const d = Math.hypot(
      waypoints[i][0] - waypoints[i - 1][0],
      waypoints[i][1] - waypoints[i - 1][1],
    )
    segLen.push(d)
    total += d
  }

  const pointAt = (target) => {
    if (target <= 0 || total === 0) return waypoints[0]
    let acc = 0
    for (let i = 0; i < segLen.length; i++) {
      if (acc + segLen[i] >= target) {
        const t = (target - acc) / segLen[i]
        return [
          waypoints[i][0] + (waypoints[i + 1][0] - waypoints[i][0]) * t,
          waypoints[i][1] + (waypoints[i + 1][1] - waypoints[i][1]) * t,
        ]
      }
      acc += segLen[i]
    }
    return waypoints[waypoints.length - 1]
  }

  const out = []
  for (let k = 0; k <= n; k++) out.push(pointAt(total * (k / Math.max(n, 1))))
  return out
}
