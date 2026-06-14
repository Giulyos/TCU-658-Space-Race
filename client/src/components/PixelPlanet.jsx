import { PLANET_VARIANTS } from './planetVariants.js'

// An 8-bit pixel-art planet drawn as SVG rects (fully offline, same style as the
// pixel ships). Several colour/surface variants give each game a different map;
// the variant is chosen from the per-game map seed by the board. Centered on
// (cx, cy) within the board's 0..100 viewBox.

const DISC = [
  '..XXXXX..',
  '.XXXXXXX.',
  'XXXXXXXXX',
  'XXXXXXXXX',
  'XXXXXXXXX',
  'XXXXXXXXX',
  'XXXXXXXXX',
  '.XXXXXXX.',
  '..XXXXX..',
]

const COLS = DISC[0].length
const ROWS = DISC.length

function PixelPlanet({ cx, cy, size = 16, variant = 0 }) {
  const v = PLANET_VARIANTS[((variant % PLANET_VARIANTS.length) + PLANET_VARIANTS.length) % PLANET_VARIANTS.length]
  const cell = size / COLS
  const x0 = cx - size / 2
  const y0 = cy - (cell * ROWS) / 2
  const spots = new Set(v.spots.map(([r, c]) => `${r},${c}`))

  const rects = []
  DISC.forEach((row, r) => {
    ;[...row].forEach((ch, c) => {
      if (ch !== 'X') return
      rects.push(
        <rect
          key={`${r}-${c}`}
          x={x0 + c * cell}
          y={y0 + r * cell}
          width={cell}
          height={cell}
          fill={spots.has(`${r},${c}`) ? v.detail : v.body}
        />,
      )
    })
  })

  return <g className="pixel-planet">{rects}</g>
}

export default PixelPlanet
