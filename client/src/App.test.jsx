import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App.jsx'

// Smoke test: confirms the client test harness works and <App /> mounts.
// The default route "/" is the launcher, which offers the Teacher and Projector
// entries into the one app.
describe('App', () => {
  it('renders the launcher at the default route', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /space race/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /teacher/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /projector/i })).toBeInTheDocument()
  })
})
