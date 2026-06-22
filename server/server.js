import { createApp } from './app.js'
import { initializeSchema } from './db/schema.js'
import { seedExampleGame } from './db/seed.js'
import { openBrowser } from './openBrowser.js'

const PORT = 3001

// The packaged executable runs from a pkg snapshot. In that mode (and in any
// NODE_ENV=production run) the server serves the built client; the packaged
// executable additionally opens the teacher's browser so a double-click is all
// it takes.
const isPackaged = typeof process.pkg !== 'undefined'
const production = process.env.NODE_ENV === 'production' || isPackaged

// Create the database tables (and singleton game row) before serving, then seed
// a built-in example game so a fresh install always has one ready to play.
initializeSchema()
seedExampleGame()

const app = createApp({ serveStatic: production })

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`
  console.log(`Space Race is running. Open ${url}`)
  console.log('Keep this window open while you play. Close it to stop the game.')
  if (isPackaged) openBrowser(url)
})
