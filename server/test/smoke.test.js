import { describe, it, expect } from 'vitest'

// Smoke test: confirms Vitest is wired up for the server package.
// Real backend tests (engine, repositories, API) are added in later issues.
describe('server test runner', () => {
  it('runs Vitest', () => {
    expect(true).toBe(true)
  })
})
