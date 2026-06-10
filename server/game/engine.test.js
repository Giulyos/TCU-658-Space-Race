import { describe, it, expect } from 'vitest'
import { startGame, pickQuestion } from './engine.js'
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
