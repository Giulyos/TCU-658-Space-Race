// Planet appearance variants (body colour, surface "spot" colour, and which
// grid cells are surface detail). Kept in a plain module so component files only
// export components (required for React fast refresh). Shared by PixelPlanet
// (rendering) and the Board (counting variants for seed-based selection).

export const PLANET_VARIANTS = [
  { body: '#21d4fd', detail: '#0e6e8c', spots: [[3, 2], [4, 6], [6, 3]] },
  { body: '#ff3ca6', detail: '#a01f66', spots: [[2, 4], [5, 5], [6, 2], [3, 6]] },
  { body: '#6dff8f', detail: '#2e9e4a', spots: [[3, 5], [5, 2], [7, 5]] },
  { body: '#ffd23f', detail: '#b98a1a', spots: [[2, 3], [4, 4], [6, 6], [5, 2]] },
  { body: '#c77dff', detail: '#6f2dbd', spots: [[3, 3], [4, 6], [6, 4]] },
]

export const PLANET_COUNT = PLANET_VARIANTS.length
