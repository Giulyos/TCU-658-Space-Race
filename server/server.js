import { createApp } from './app.js'
import { initializeSchema } from './db/schema.js'
import { seedExampleGame } from './db/seed.js'

const PORT = 3001

// Create the database tables (and singleton game row) before serving, then seed
// a built-in example game so a fresh install always has one ready to play.
initializeSchema()
seedExampleGame()

const app = createApp({ serveStatic: process.env.NODE_ENV === 'production' })

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
