// A small retro, 8-bit pixel-art spaceship drawn as SVG rects (fully offline —
// no image assets). Tinted per team; 'o' cells are the cockpit window. Centered
// on (cx, cy) within the board's 0..100 viewBox.

const SHIP = [
  '...X...',
  '..XXX..',
  '..XoX..',
  '.XXXXX.',
  '.XXXXX.',
  'XXXXXXX',
  'X.XXX.X',
  '..X.X..',
]
const COLS = SHIP[0].length
const ROWS = SHIP.length

function PixelShip({ cx, cy, size = 9, color }) {
  const cell = size / COLS
  const x0 = cx - size / 2
  const y0 = cy - (cell * ROWS) / 2

  const rects = []
  SHIP.forEach((row, r) => {
    ;[...row].forEach((ch, c) => {
      if (ch === '.') return
      rects.push(
        <rect
          key={`${r}-${c}`}
          x={x0 + c * cell}
          y={y0 + r * cell}
          width={cell}
          height={cell}
          fill={ch === 'o' ? '#06122e' : color}
        />,
      )
    })
  })

  return <g className="pixel-ship">{rects}</g>
}

export default PixelShip
