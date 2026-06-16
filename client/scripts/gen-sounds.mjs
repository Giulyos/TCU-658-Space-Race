// Generates the game's retro sound effects as small mono WAV files into
// client/public/sounds/. Run once (or to regenerate): `node scripts/gen-sounds.mjs`.
//
// Why synthesize instead of download: the platform must be fully offline with no
// external assets, and 8-bit square-wave blips are tiny and reproducible. The
// WAVs are committed so the build needs no audio tooling; this script just lets
// us recreate them deterministically.

import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const SAMPLE_RATE = 22050 // plenty for short blips; keeps files small
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sounds')

// note name -> frequency (Hz) for the octaves we use
const FREQ = {
  C3: 130.81, G3: 196.0,
  C4: 261.63, E4: 329.63, G4: 392.0,
  C5: 523.25, E5: 659.25, G5: 783.99, C6: 1046.5,
}

// Renders a sequence of square-wave notes into a Float32 buffer in [-1, 1].
// Each note gets a short linear attack/release envelope so there are no clicks.
const render = (notes) => {
  const total = notes.reduce((n, [, ms]) => n + Math.round((ms / 1000) * SAMPLE_RATE), 0)
  const buf = new Float32Array(total)
  let offset = 0
  for (const [name, ms, gain = 0.25] of notes) {
    const len = Math.round((ms / 1000) * SAMPLE_RATE)
    const freq = FREQ[name] ?? 0
    const period = freq > 0 ? SAMPLE_RATE / freq : 0
    const edge = Math.min(Math.floor(len * 0.15), 220) // attack/release samples
    for (let i = 0; i < len; i++) {
      let s = 0
      if (freq > 0) s = Math.sin((2 * Math.PI * i) / period) >= 0 ? 1 : -1 // square wave
      let env = 1
      if (i < edge) env = i / edge
      else if (i > len - edge) env = (len - i) / edge
      buf[offset + i] = s * gain * env
    }
    offset += len
  }
  return buf
}

// Wraps a Float32 PCM buffer as a 16-bit mono WAV file.
const toWav = (samples) => {
  const dataLen = samples.length * 2
  const buf = Buffer.alloc(44 + dataLen)
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + dataLen, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16) // PCM chunk size
  buf.writeUInt16LE(1, 20) // PCM format
  buf.writeUInt16LE(1, 22) // mono
  buf.writeUInt32LE(SAMPLE_RATE, 24)
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28) // byte rate
  buf.writeUInt16LE(2, 32) // block align
  buf.writeUInt16LE(16, 34) // bits per sample
  buf.write('data', 36)
  buf.writeUInt32LE(dataLen, 40)
  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]))
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2)
  }
  return buf
}

const SOUNDS = {
  // bright ascending arpeggio — "you got it"
  correct: [['C5', 90], ['E5', 90], ['G5', 130]],
  // low descending buzz — "nope"
  incorrect: [['G3', 140], ['C3', 200]],
  // short fanfare — "we have a winner"
  win: [['C5', 110], ['E5', 110], ['G5', 110], ['C6', 130], ['G5', 90], ['C6', 320]],
}

mkdirSync(OUT_DIR, { recursive: true })
for (const [name, notes] of Object.entries(SOUNDS)) {
  const wav = toWav(render(notes))
  writeFileSync(join(OUT_DIR, `${name}.wav`), wav)
  console.log(`wrote ${name}.wav (${wav.length} bytes)`)
}
