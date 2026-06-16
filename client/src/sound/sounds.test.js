import { describe, it, expect, beforeEach, vi } from 'vitest'

// The module caches one Audio element per clip at module scope, so reset the
// module registry before each test to start from a clean cache.
let sounds
let instances

class FakeAudio {
  constructor(src) {
    this.src = src
    this.currentTime = 7 // non-zero so we can prove play() rewinds
    this.played = false
    instances.push(this)
  }
  play() {
    this.played = true
    return Promise.resolve()
  }
}

beforeEach(async () => {
  instances = []
  localStorage.clear()
  vi.stubGlobal('Audio', FakeAudio)
  vi.resetModules()
  sounds = await import('./sounds.js')
})

describe('mute preference', () => {
  it('round-trips through localStorage under MUTE_KEY', () => {
    expect(sounds.isMuted()).toBe(false)
    sounds.setMuted(true)
    expect(localStorage.getItem(sounds.MUTE_KEY)).toBe('true')
    expect(sounds.isMuted()).toBe(true)
    sounds.setMuted(false)
    expect(sounds.isMuted()).toBe(false)
  })
})

describe('play', () => {
  it('plays the requested clip from the start when unmuted', () => {
    sounds.play('correct')
    expect(instances).toHaveLength(1)
    expect(instances[0].src).toContain('/sounds/correct.wav')
    expect(instances[0].played).toBe(true)
    expect(instances[0].currentTime).toBe(0) // rewound before playing
  })

  it('does not play anything when muted', () => {
    sounds.setMuted(true)
    sounds.play('win')
    expect(instances.every((a) => !a.played)).toBe(true)
  })

  it('reuses one element per clip across repeated plays', () => {
    sounds.play('correct')
    sounds.play('correct')
    expect(instances).toHaveLength(1)
  })

  it('ignores unknown clip names', () => {
    expect(() => sounds.play('nope')).not.toThrow()
    expect(instances).toHaveLength(0)
  })

  it('never throws when play() is rejected (autoplay blocked)', async () => {
    vi.stubGlobal(
      'Audio',
      class {
        play() {
          return Promise.reject(new Error('NotAllowedError'))
        }
      },
    )
    vi.resetModules()
    const fresh = await import('./sounds.js')
    expect(() => fresh.play('correct')).not.toThrow()
  })
})
