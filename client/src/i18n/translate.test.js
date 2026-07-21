import { describe, it, expect, beforeEach } from 'vitest'
import { translate, getLang, setLangPref, LANG_KEY, DEFAULT_LANG } from './translate.js'

beforeEach(() => localStorage.clear())

describe('translate', () => {
  it('returns the string for each language', () => {
    expect(translate('en', 'home.play')).toBe('Play')
    expect(translate('es', 'home.play')).toBe('Jugar')
  })

  it('interpolates {vars}', () => {
    expect(translate('en', 'wizard.teamNameLabel', { n: 2 })).toBe('Team 2 name')
    expect(translate('es', 'wizard.teamNameLabel', { n: 2 })).toBe('Nombre del equipo 2')
  })

  it('selects singular/plural by count', () => {
    expect(translate('en', 'question.points', { count: 1 })).toBe('1 point')
    expect(translate('en', 'question.points', { count: 3 })).toBe('3 points')
    expect(translate('es', 'question.points', { count: 1 })).toBe('1 punto')
    expect(translate('es', 'question.points', { count: 3 })).toBe('3 puntos')
  })

  it('falls back es -> en -> key for missing entries', () => {
    // a key present in en only would fall back to en for es; a totally unknown
    // key returns itself
    expect(translate('es', 'this.key.does.not.exist')).toBe('this.key.does.not.exist')
  })
})

describe('language preference', () => {
  it('defaults to English and round-trips through localStorage', () => {
    expect(getLang()).toBe(DEFAULT_LANG)
    setLangPref('es')
    expect(localStorage.getItem(LANG_KEY)).toBe('es')
    expect(getLang()).toBe('es')
  })

  it('ignores unsupported languages', () => {
    setLangPref('fr')
    expect(getLang()).toBe('en') // 'fr' not stored as-is; coerced to default
  })
})
