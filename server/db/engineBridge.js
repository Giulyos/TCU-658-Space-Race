import defaultGameStateRepo from './gameStateRepo.js'

// Bridges the pure game engine and persistence. The engine functions in
// server/game/engine.js are pure (state -> new state) and import nothing from
// the database; this helper is the one place that loads the current state,
// applies an engine function, and saves the result. Routes call through here so
// the engine itself stays free of any IO.
//
// Exposed as a factory so tests can bind it to an in-memory-backed repo; a
// default instance bound to the shared repo is exported for the app.

export const createEngineBridge = (repo = defaultGameStateRepo) => {
  // Returns the current persisted game state (engine shape).
  const getState = () => repo.load()

  // Loads the current state, applies a pure engine function
  // `engineFn(state, ...args)`, persists the resulting state, and returns it.
  const applyAndPersist = (engineFn, ...args) => {
    const next = engineFn(repo.load(), ...args)
    return repo.save(next)
  }

  return { getState, applyAndPersist }
}

export default createEngineBridge()
