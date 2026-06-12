// Shared fetch helper for the API clients.
//
// All requests go to same-origin `/api/*`. In development the Vite dev server
// proxies `/api` to the Express backend (see vite.config.js); in production the
// packaged server serves the built client and the API from the same origin —
// so no base URL is ever hard-coded (which also keeps the app fully offline).

const BASE = '/api'

// Performs a request and returns the parsed JSON body. Throws an Error whose
// message is the server's { error } text (or a status fallback) on a non-2xx
// response. Returns null for empty (204) responses.
export const request = async (method, path, body) => {
  const res = await fetch(BASE + path, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) return null

  let data = null
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!res.ok) {
    throw new Error(data?.error ?? `Request failed (${res.status})`)
  }
  return data
}
