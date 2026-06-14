import { describe, it, expect } from 'vitest'
import { PLANET_VARIANTS } from './planetVariants.js'
import { TEAM_COLORS } from './raceUtils.js'

// Requirement: a team's ship must never be the same colour as its start planet
// or the finish planet. We guarantee this by keeping the planet palette disjoint
// from the team/ship palette, so no ship ever matches any planet colour.
describe('planet vs team palettes', () => {
  it('no planet body colour matches a team/ship colour', () => {
    const ships = new Set(TEAM_COLORS.map((c) => c.toLowerCase()))
    for (const v of PLANET_VARIANTS) {
      expect(ships.has(v.body.toLowerCase())).toBe(false)
    }
  })
})
