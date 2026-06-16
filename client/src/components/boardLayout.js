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

// Planet radii in board units (must match the sizes drawn in Board.jsx). Used to
// keep board spaces from being hidden under planets and to land routes on the
// finish planet's rim.
export const START_R = 8
export const FINISH_R = 14

export const layoutFor = (teamCount) => {
  switch (teamCount) {
    case 2:
      return { finish: [80, 20], starts: [[20, 72], [140, 72]] }
    case 3:
      return { finish: [80, 18], starts: [[18, 72], [80, 76], [142, 72]] }
    case 4:
    default:
      return { finish: [80, 45], starts: [[18, 16], [142, 16], [18, 74], [142, 74]] }
  }
}

// A distinct point on the finish planet's rim for each team, fanned around the
// side facing that team's start. Routing teams to different rim points (instead
// of the single centre) keeps ships near the finish from stacking on top of each
// other.
export const finishApproach = (finish, start) => {
  const [fx, fy] = finish
  // Land on the point of the finish planet's rim facing this team's start, so a
  // team approaches from its own side and ships fan around the planet rather
  // than stacking on a single point. Starts are spread out, so the rim points
  // are too.
  const angle = Math.atan2(start[1] - fy, start[0] - fx)
  return [fx + Math.cos(angle) * FINISH_R, fy + Math.sin(angle) * FINISH_R]
}

// Whether a point lies under any planet (a start planet or the finish), so such
// board spaces can be skipped when drawing.
export const isUnderPlanet = (p, starts, finish) => {
  if (Math.hypot(p[0] - finish[0], p[1] - finish[1]) < FINISH_R - 1) return true
  return starts.some((s) => Math.hypot(p[0] - s[0], p[1] - s[1]) < START_R + 1)
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
export const makeWindingPath = (start, finish, twists = 4, amplitude = 7) => {
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

// Returns the point at a given fraction (0..1) of the polyline's total arc
// length. Used to place a ship anywhere along its road — at an integer board
// space (fraction = pos/finishLine) or at a fractional position mid-glide while
// the advance animation interpolates between spaces.
export const pointAtFraction = (waypoints, f) => {
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

  const target = total * Math.min(Math.max(f, 0), 1)
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

// Returns n+1 points evenly spaced by arc length along the polyline (index 0 at
// the start, index n at the finish). Used both to draw the board spaces and to
// place a ship on the space matching its score. A ship at integer position `pos`
// (pointAtFraction at pos/n) lands exactly on space `pos` here.
export const sampleAlong = (waypoints, n) => {
  const out = []
  for (let k = 0; k <= n; k++) out.push(pointAtFraction(waypoints, k / Math.max(n, 1)))
  return out
}
