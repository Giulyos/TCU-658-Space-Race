import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

// Regression guard for a real-browser click bug: NES.css draws decorative
// borders with absolutely-positioned ::before/::after pseudo-elements that have
// `pointer-events: auto` and can balloon over neighbouring elements (notably a
// bordered table's ::before covering the form's submit button), silently
// swallowing clicks. jsdom has no layout, so unit tests can't catch this — we
// instead assert the stylesheet neutralizes pointer events on those overlays.
// Vitest runs with cwd = client/, so resolve the stylesheet from there.
const css = readFileSync('src/index.css', 'utf8')

describe('index.css — NES.css overlay pointer-events guard', () => {
  it('disables pointer events on decorative table pseudo-elements', () => {
    // The whole selector list ending in this declaration must include the table
    // pseudos. We check the rule body contains pointer-events: none and that the
    // table ::before/::after selectors are present in the file.
    expect(css).toMatch(/\.nes-table::before/)
    expect(css).toMatch(/\.nes-table::after/)
    expect(css).toMatch(/pointer-events:\s*none/)
  })

  it('covers the button/container/input/select overlays too', () => {
    for (const sel of [
      '.nes-btn::after',
      '.nes-container::before',
      '.nes-input::after',
      '.nes-select::after',
    ]) {
      expect(css).toContain(sel)
    }
  })
})

// The Game Screen is projected to a whole classroom, so its key type must scale
// with the viewport (clamp with a vw term) rather than a fixed pixel size that
// would be illegible from the back of the room. jsdom has no layout engine and
// can't measure rendered sizes, so we guard the stylesheet: each rule's
// declaration block must use a viewport-relative clamp().
describe('index.css — projector-legible responsive type', () => {
  const ruleBody = (selector) => {
    const m = css.match(new RegExp(`${selector.replace('.', '\\.')}\\s*\\{([^}]*)\\}`))
    return m ? m[1] : ''
  }

  it.each([
    ['.turn-indicator'],
    ['.question-text'],
    ['.board-legend li'],
  ])('%s scales its font-size with the viewport (clamp + vw)', (selector) => {
    const body = ruleBody(selector)
    expect(body).toMatch(/font-size:\s*clamp\([^)]*vw[^)]*\)/)
  })
})
