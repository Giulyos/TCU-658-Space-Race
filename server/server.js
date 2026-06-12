import { createApp } from './app.js'
import { initializeSchema } from './db/schema.js'

const PORT = 3001

// Create the database tables (and singleton game row) before serving.
initializeSchema()

const app = createApp({ serveStatic: process.env.NODE_ENV === 'production' })

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
