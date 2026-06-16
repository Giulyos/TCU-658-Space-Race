// Generates the PWA icons as PNGs into client/public: pwa-192.png, pwa-512.png,
// and pwa-maskable-512.png. Run once (or to regenerate):
//   node scripts/gen-icons.mjs
//
// Why synthesize instead of exporting from a design tool: the platform is fully
// offline and we avoid native image deps (sharp, canvas). The icon is the same
// 8-bit pixel ship used on the board, drawn straight into an RGBA framebuffer
// and PNG-encoded with Node's built-in zlib — reproducible, dependency-free.
// The PNGs are committed so the build needs no image tooling.

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { deflateSync } from 'node:zlib'

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

// Palette (matches the arcade theme in index.css).
const BG = [11, 4, 32, 255] // --space-900
const SHIP = [33, 212, 253, 255] // --cyan
const COCKPIT = [6, 18, 46, 255]
const STAR = [255, 255, 255, 255]

// Same sprite as components/PixelShip.jsx ('o' = cockpit).
const SPRITE = [
  '...X...',
  '..XXX..',
  '..XoX..',
  '.XXXXX.',
  '.XXXXX.',
  'XXXXXXX',
  'X.XXX.X',
  '..X.X..',
]
const COLS = SPRITE[0].length
const ROWS = SPRITE.length

// A few fixed stars (fractions of the canvas) for a little starfield; skipped
// if they would land on the ship.
const STARS = [
  [0.12, 0.18], [0.85, 0.22], [0.2, 0.8], [0.9, 0.75], [0.5, 0.1], [0.08, 0.55],
]

// --- tiny PNG encoder (RGBA, 8-bit) ---
const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
const crc32 = (buf) => {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}
const toPng = (size, rgba) => {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // colour type RGBA
  // 10,11,12 = compression / filter / interlace = 0
  // raw: each scanline prefixed with filter byte 0
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// Draws the icon into an RGBA buffer. shipFraction controls how much of the
// canvas the ship spans (smaller for maskable, to stay inside the safe zone).
const drawIcon = (size, shipFraction) => {
  const buf = Buffer.alloc(size * size * 4)
  const put = (x, y, [r, g, b, a]) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 4
    buf[i] = r
    buf[i + 1] = g
    buf[i + 2] = b
    buf[i + 3] = a
  }
  const fill = (x0, y0, w, h, color) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) put(x, y, color)
  }

  fill(0, 0, size, size, BG)

  const cell = Math.floor((size * shipFraction) / COLS)
  const shipW = cell * COLS
  const shipH = cell * ROWS
  const x0 = Math.floor((size - shipW) / 2)
  const y0 = Math.floor((size - shipH) / 2)

  // stars (skip any inside the ship's bounding box)
  const star = Math.max(2, Math.round(size / 90))
  for (const [fx, fy] of STARS) {
    const sx = Math.round(fx * size)
    const sy = Math.round(fy * size)
    if (sx >= x0 && sx <= x0 + shipW && sy >= y0 && sy <= y0 + shipH) continue
    fill(sx, sy, star, star, STAR)
  }

  SPRITE.forEach((row, r) => {
    ;[...row].forEach((ch, c) => {
      if (ch === '.') return
      fill(x0 + c * cell, y0 + r * cell, cell, cell, ch === 'o' ? COCKPIT : SHIP)
    })
  })
  return buf
}

const ICONS = [
  ['pwa-192.png', 192, 0.62],
  ['pwa-512.png', 512, 0.62],
  // maskable: ship within the ~80% safe zone so a circular mask never clips it
  ['pwa-maskable-512.png', 512, 0.5],
]

for (const [name, size, frac] of ICONS) {
  const png = toPng(size, drawIcon(size, frac))
  writeFileSync(join(OUT_DIR, name), png)
  console.log(`wrote ${name} (${size}x${size}, ${png.length} bytes)`)
}
