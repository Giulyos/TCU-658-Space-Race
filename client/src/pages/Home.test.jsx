import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Home from './Home.jsx'
import { I18nProvider } from '../i18n/I18nProvider.jsx'
import { LANG_KEY } from '../i18n/translate.js'

beforeEach(() => localStorage.clear())

describe('Home title screen', () => {
  it('always shows a Play button leading to the Admin Panel', () => {
    render(<Home />)
    const btn = screen.getByRole('link', { name: 'Play' })
    expect(btn).toHaveAttribute('href', '/admin')
    // The title screen never auto-routes to the board.
    expect(screen.queryByRole('link', { name: /resume/i })).not.toBeInTheDocument()
  })

  it('shows the game title', () => {
    render(<Home />)
    expect(screen.getByRole('heading', { name: /space race/i })).toBeInTheDocument()
  })

  it('defaults to English and switches the whole menu to Spanish via the toggle', () => {
    render(
      <I18nProvider>
        <Home />
      </I18nProvider>,
    )
    // starts English
    expect(screen.getByRole('link', { name: 'Play' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Español' }))

    // menu is now Spanish, choice persisted, <html lang> updated
    expect(screen.getByRole('link', { name: 'Jugar' })).toBeInTheDocument()
    expect(localStorage.getItem(LANG_KEY)).toBe('es')
    expect(document.documentElement.lang).toBe('es')

    // switch back
    fireEvent.click(screen.getByRole('button', { name: 'English' }))
    expect(screen.getByRole('link', { name: 'Play' })).toBeInTheDocument()
    expect(localStorage.getItem(LANG_KEY)).toBe('en')
  })
})
