// Planet appearance variants (body colour, surface "spot" colour, and which grid
// cells are surface detail). Kept in a plain module so component files only
// export components (required for React fast refresh). Shared by PixelPlanet
// (rendering) and the Board (counting variants for seed-based selection).
//
// IMPORTANT: none of these body colours may match a team/ship colour
// (raceUtils TEAM_COLORS). Keeping the palettes disjoint guarantees a team's
// ship never blends with its home planet or the finish planet. A test enforces
// this (planetVariants.test.js).

export const PLANET_VARIANTS = [
  { body: '#ff8c42', detail: '#b85c1a', spots: [[3, 2], [4, 6], [6, 3]] },
  { body: '#e84a4a', detail: '#9e2b2b', spots: [[2, 4], [5, 5], [6, 2], [3, 6]] },
  { body: '#c77dff', detail: '#6f2dbd', spots: [[3, 5], [5, 2], [7, 5]] },
  { body: '#b9a7ff', detail: '#6a55c0', spots: [[2, 3], [4, 4], [6, 6], [5, 2]] },
  { body: '#8aa0c0', detail: '#4a5a78', spots: [[3, 3], [4, 6], [6, 4]] },
]

export const PLANET_COUNT = PLANET_VARIANTS.length
