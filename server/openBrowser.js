import { spawn } from 'child_process'

// Opens a URL in the user's default browser. Used when the packaged executable
// starts, so a teacher just double-clicks and the game appears. Best-effort: any
// failure (headless box, locked-down OS, missing opener) is swallowed so it can
// never crash startup — the URL is also printed to the console as a fallback.
//
// Exposed with an injectable spawn so it can be unit-tested without launching a
// real browser.
export const openBrowser = (url, spawnFn = spawn) => {
  try {
    let command
    let args
    if (process.platform === 'darwin') {
      command = 'open'
      args = [url]
    } else if (process.platform === 'win32') {
      // `start` is a cmd builtin; the empty "" is the window title argument.
      command = 'cmd'
      args = ['/c', 'start', '', url]
    } else {
      command = 'xdg-open'
      args = [url]
    }
    const child = spawnFn(command, args, { stdio: 'ignore', detached: true })
    child.on?.('error', () => {})
    child.unref?.()
    return true
  } catch {
    return false
  }
}
