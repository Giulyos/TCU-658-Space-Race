// Smoke-tests a packaged Space Race executable: launches it, waits for the local
// server to come up, and checks the API and the served app. Cross-platform (used
// by the CI build matrix and runnable locally):
//
//   node scripts/smoke-exe.mjs <path-to-executable>
//
// Exits 0 on success, 1 on failure.
import { spawn } from 'node:child_process'
import { resolve } from 'node:path'

const binPath = process.argv[2]
if (!binPath) {
  console.error('usage: node scripts/smoke-exe.mjs <path-to-executable>')
  process.exit(1)
}

const PORT = 3001
const base = `http://localhost:${PORT}`
const TIMEOUT_MS = 30000

// Don't pop a browser open on a headless CI runner.
const child = spawn(resolve(binPath), [], {
  stdio: 'inherit',
  env: { ...process.env, SPACE_RACE_NO_BROWSER: '1' },
})

let finished = false
const finish = (code, message) => {
  if (finished) return
  finished = true
  console.log(message)
  try {
    child.kill()
  } catch {
    /* already gone */
  }
  process.exit(code)
}

child.on('error', (err) => finish(1, `FAIL: could not launch the executable — ${err.message}`))
child.on('exit', (code) => {
  if (!finished) finish(1, `FAIL: the executable exited early (code ${code})`)
})

const deadline = Date.now() + TIMEOUT_MS
const poll = async () => {
  try {
    const health = await fetch(`${base}/api/health`).then((r) => r.json())
    if (health.status === 'ok') {
      const game = await fetch(`${base}/game`).then((r) => r.text())
      const games = await fetch(`${base}/api/games`).then((r) => r.json())
      const servesApp = /<title>Space Race<\/title>/.test(game)
      const seeded = Array.isArray(games) && games.length >= 1
      if (servesApp && seeded) {
        return finish(0, `PASS: health ok, /game served, ${games.length} game(s) seeded`)
      }
      return finish(1, `FAIL: servesApp=${servesApp} seeded=${seeded}`)
    }
  } catch {
    /* server not up yet */
  }
  if (Date.now() > deadline) return finish(1, 'FAIL: server did not become healthy within 30s')
  setTimeout(poll, 1000)
}
setTimeout(poll, 1500)
