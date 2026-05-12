import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

import gameRouter from './routes/game.js'
import questionsRouter from './routes/questions.js'
import { initializeSchema } from './db/schema.js'

const app = express()
const PORT = 3001
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

initializeSchema()

app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/questions', questionsRouter)
app.use('/api/game', gameRouter)

if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.resolve(__dirname, '../client/dist')
  app.use(express.static(clientDistPath))

  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
