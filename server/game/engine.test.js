import { describe, it, expect } from 'vitest'
import {
  startGame,
  pickQuestion,
  resolveTurn,
  checkWinner,
  pause,
  resume,
  restart,
} from './engine.js'
import { createInitialState } from './state.js'
import { STATUS } from './constants.js'

const sampleBank = [
  { id: 1, text: 'Q1', correct_answer: 'A1', point_value: 1 },
  { id: 2, text: 'Q2', correct_answer: 'A2', point_value: 2 },
  { id: 3, text: 'Q3', correct_answer: 'A3', point_value: 1 },
]

describe('startGame', () => {
  it('activates the game with team 1 on the move', () => {
    const started = startGame(createInitialState())
    expect(started.active).toBe(STATUS.ACTIVE)
    expect(started.currentTeam).toBe(1)
  })

  it('resets positions to the starting line, preserving team count', () => {
    const started = startGame(createInitialState({ teamCount: 3 }))
    expect(started.positions).toEqual([0, 0, 0])
  })

  it('clears any prior winner and used-question history', () => {
    const inProgress = {
      ...createInitialState(),
      positions: [4, 7, 2, 9],
      winner: 4,
      usedQuestions: [1, 2, 3],
      currentTeam: 3,
    }
    const started = startGame(inProgress)
    expect(started.winner).toBeNull()
    expect(started.usedQuestions).toEqual([])
    expect(started.positions).toEqual([0, 0, 0, 0])
    expect(started.currentTeam).toBe(1)
  })

  it('preserves configuration (team names and finish line)', () => {
    const config = createInitialState({ teamNames: ['Red', 'Blue'], finishLine: 15 })
    const started = startGame(config)
    expect(started.teamNames).toEqual(['Red', 'Blue'])
    expect(started.finishLine).toBe(15)
  })

  it('does not mutate the input state', () => {
    const original = createInitialState()
    const snapshot = structuredClone(original)
    startGame(original)
    expect(original).toEqual(snapshot)
  })
})

describe('pickQuestion', () => {
  it('returns a question from the bank and marks it used', () => {
    const state = startGame(createInitialState())
    const { state: next, question } = pickQuestion(state, sampleBank)
    expect(sampleBank).toContain(question)
    expect(next.usedQuestions).toContain(question.id)
  })

  it('uses the injected RNG to pick deterministically', () => {
    const state = startGame(createInitialState())
    // rng() = 0 -> floor(0 * 3) = index 0 -> first available question
    const { question } = pickQuestion(state, sampleBank, () => 0)
    expect(question.id).toBe(1)
    // rng() ~1 -> last available question
    const { question: last } = pickQuestion(state, sampleBank, () => 0.999)
    expect(last.id).toBe(3)
  })

  it('never repeats a question within a session and exhausts the bank exactly', () => {
    let state = startGame(createInitialState())
    const seen = []
    for (let i = 0; i < sampleBank.length; i++) {
      const result = pickQuestion(state, sampleBank)
      expect(result.question).not.toBeNull()
      expect(seen).not.toContain(result.question.id)
      seen.push(result.question.id)
      state = result.state
    }
    expect(seen.sort()).toEqual([1, 2, 3])
    expect(state.usedQuestions.sort()).toEqual([1, 2, 3])
  })

  it('returns null and an unchanged state when the bank is exhausted', () => {
    const state = { ...startGame(createInitialState()), usedQuestions: [1, 2, 3] }
    const result = pickQuestion(state, sampleBank)
    expect(result.question).toBeNull()
    expect(result.state).toBe(state)
  })

  it('skips questions already marked used in the incoming state', () => {
    const state = { ...startGame(createInitialState()), usedQuestions: [1, 2] }
    const { question } = pickQuestion(state, sampleBank)
    expect(question.id).toBe(3)
  })

  it('does not mutate the input state', () => {
    const state = startGame(createInitialState())
    const snapshot = structuredClone(state)
    pickQuestion(state, sampleBank, () => 0)
    expect(state).toEqual(snapshot)
  })
})

describe('resolveTurn', () => {
  it('advances the current team by the point value on a correct answer', () => {
    const state = startGame(createInitialState()) // team 1, positions [0,0,0,0]
    const next = resolveTurn(state, { correct: true, pointValue: 3 })
    expect(next.positions).toEqual([3, 0, 0, 0])
  })

  it('leaves positions unchanged on an incorrect answer', () => {
    const state = startGame(createInitialState())
    const next = resolveTurn(state, { correct: false, pointValue: 3 })
    expect(next.positions).toEqual([0, 0, 0, 0])
  })

  it('rotates the turn to the next team on both outcomes', () => {
    const state = startGame(createInitialState()) // currentTeam 1
    expect(resolveTurn(state, { correct: true, pointValue: 1 }).currentTeam).toBe(2)
    expect(resolveTurn(state, { correct: false, pointValue: 1 }).currentTeam).toBe(2)
  })

  it('wraps from the last team back to team 1', () => {
    const state = { ...startGame(createInitialState()), currentTeam: 4 }
    const next = resolveTurn(state, { correct: true, pointValue: 1 })
    expect(next.currentTeam).toBe(1)
    expect(next.positions).toEqual([0, 0, 0, 1]) // team 4 advanced
  })

  it('only moves the current team, not the others', () => {
    const state = { ...startGame(createInitialState()), currentTeam: 2, positions: [5, 3, 1, 0] }
    const next = resolveTurn(state, { correct: true, pointValue: 2 })
    expect(next.positions).toEqual([5, 5, 1, 0])
  })

  it('defaults the point value to 1 when omitted', () => {
    const state = startGame(createInitialState())
    const next = resolveTurn(state, { correct: true })
    expect(next.positions).toEqual([1, 0, 0, 0])
  })

  it('does not mutate the input state', () => {
    const state = startGame(createInitialState())
    const snapshot = structuredClone(state)
    resolveTurn(state, { correct: true, pointValue: 2 })
    expect(state).toEqual(snapshot)
  })

  it('is a no-op once a winner has been decided (no further turns)', () => {
    const state = { ...startGame(createInitialState()), winner: 2, positions: [0, 10, 0, 0] }
    const next = resolveTurn(state, { correct: true, pointValue: 5 })
    expect(next).toBe(state)
  })
})

describe('checkWinner', () => {
  it('records no winner while every team is short of the finish line', () => {
    const state = { ...startGame(createInitialState()), finishLine: 10, positions: [9, 8, 0, 5] }
    expect(checkWinner(state).winner).toBeNull()
  })

  it('declares a winner on an exact hit of the finish line', () => {
    const state = { ...startGame(createInitialState()), finishLine: 10, positions: [0, 10, 0, 0] }
    expect(checkWinner(state).winner).toBe(2)
  })

  it('declares a winner when the finish line is overshot', () => {
    const state = { ...startGame(createInitialState()), finishLine: 10, positions: [0, 0, 0, 13] }
    expect(checkWinner(state).winner).toBe(4)
  })

  it('keeps an already-decided winner unchanged', () => {
    const state = { ...startGame(createInitialState()), finishLine: 10, winner: 1, positions: [10, 11, 0, 0] }
    expect(checkWinner(state)).toBe(state)
  })

  it('composes with resolveTurn to detect a win after a move', () => {
    const state = { ...startGame(createInitialState()), finishLine: 3, currentTeam: 1, positions: [2, 0, 0, 0] }
    const afterTurn = resolveTurn(state, { correct: true, pointValue: 1 }) // team 1 -> 3
    const result = checkWinner(afterTurn)
    expect(result.winner).toBe(1)
  })

  it('does not mutate the input state', () => {
    const state = { ...startGame(createInitialState()), finishLine: 10, positions: [10, 0, 0, 0] }
    const snapshot = structuredClone(state)
    checkWinner(state)
    expect(state).toEqual(snapshot)
  })
})

describe('pause / resume', () => {
  it('pauses an active game', () => {
    const next = pause(startGame(createInitialState()))
    expect(next.active).toBe(STATUS.PAUSED)
  })

  it('does not pause a game that is not active', () => {
    const notStarted = createInitialState() // STATUS.NOT_STARTED
    expect(pause(notStarted)).toBe(notStarted)
  })

  it('resumes a paused game', () => {
    const paused = pause(startGame(createInitialState()))
    expect(resume(paused).active).toBe(STATUS.ACTIVE)
  })

  it('does not resume a game that is not paused', () => {
    const active = startGame(createInitialState())
    expect(resume(active)).toBe(active)
  })

  it('does not mutate state when pausing', () => {
    const active = startGame(createInitialState())
    const snapshot = structuredClone(active)
    pause(active)
    expect(active).toEqual(snapshot)
  })
})

describe('restart', () => {
  it('clears the board and begins a fresh active match', () => {
    const finished = {
      ...startGame(createInitialState()),
      positions: [10, 4, 7, 2],
      winner: 1,
      usedQuestions: [1, 2, 3],
      currentTeam: 3,
    }
    const next = restart(finished)
    expect(next.active).toBe(STATUS.ACTIVE)
    expect(next.currentTeam).toBe(1)
    expect(next.positions).toEqual([0, 0, 0, 0])
    expect(next.winner).toBeNull()
    expect(next.usedQuestions).toEqual([])
  })

  it('preserves team configuration and finish line', () => {
    const configured = createInitialState({ teamNames: ['Red', 'Blue'], finishLine: 15 })
    const next = restart({ ...configured, positions: [9, 14], winner: 2 })
    expect(next.teamNames).toEqual(['Red', 'Blue'])
    expect(next.finishLine).toBe(15)
    expect(next.positions).toEqual([0, 0])
  })

  it('does not mutate the input state', () => {
    const state = { ...startGame(createInitialState()), positions: [5, 0, 0, 0], winner: 1 }
    const snapshot = structuredClone(state)
    restart(state)
    expect(state).toEqual(snapshot)
  })
})
