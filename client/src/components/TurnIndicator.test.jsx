import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import TurnIndicator from './TurnIndicator.jsx'
import { I18nProvider } from '../i18n/I18nProvider.jsx'
import { LANG_KEY } from '../i18n/translate.js'

const state = { active: 1, winner: null, currentTeam: 1, teamNames: ['Red', 'Blue'] }
const turnText = (container) => container.querySelector('.turn-indicator').textContent

beforeEach(() => localStorage.clear())

describe('TurnIndicator i18n (possessive word order)', () => {
  it('renders the English possessive with the team name highlighted', () => {
    const { container } = render(
      <I18nProvider>
        <TurnIndicator state={state} />
      </I18nProvider>,
    )
    expect(turnText(container)).toBe('Red’s turn')
    // the team name stays in its own coloured span
    expect(container.querySelector('.turn-team').textContent).toBe('Red')
  })

  it('renders the Spanish word order (name moves after "Turno de")', () => {
    localStorage.setItem(LANG_KEY, 'es')
    const { container } = render(
      <I18nProvider>
        <TurnIndicator state={state} />
      </I18nProvider>,
    )
    expect(turnText(container)).toBe('Turno de Red')
    expect(container.querySelector('.turn-team').textContent).toBe('Red')
  })

  it('shows a paused notice in Spanish', () => {
    localStorage.setItem(LANG_KEY, 'es')
    const { container } = render(
      <I18nProvider>
        <TurnIndicator state={{ ...state, active: 2 }} />
      </I18nProvider>,
    )
    expect(turnText(container)).toContain('En pausa')
  })
})
