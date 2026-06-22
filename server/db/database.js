import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

// Named moduleDir (not __dirname) so it doesn't collide with the CJS __dirname
// the pkg packager injects when bundling this ESM file.
const moduleDir = path.dirname(fileURLToPath(import.meta.url))

// When packaged with pkg the app runs from a read-only snapshot, so the database
// can't live inside it. Put spacerace.db next to the executable (a writable
// location the teacher can see and back up). In dev it stays in the server dir.
const isPackaged = typeof process.pkg !== 'undefined'
const baseDir = isPackaged ? path.dirname(process.execPath) : path.resolve(moduleDir, '..')
const databasePath = path.join(baseDir, 'space-race.db')

const db = new Database(databasePath)

export default db
