// Extends Vitest's `expect` with jest-dom matchers (toBeInTheDocument, etc.)
// and registers automatic DOM cleanup after each test.
import '@testing-library/jest-dom/vitest'

// Vitest's jsdom environment does not provide localStorage; a real browser
// does. Install a minimal in-memory implementation so components that persist
// preferences (e.g. mute) can be tested.
if (typeof globalThis.localStorage === 'undefined') {
  let store = {}
  globalThis.localStorage = {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value)
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
}
