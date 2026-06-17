import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App.jsx'

// Smoke test: confirms the client test harness works and <App /> mounts.
// The default route "/" is the title screen, whose Play button leads into the
// Admin Panel.
describe('App', () => {
  it('renders the title screen at the default route', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /space race/i })).toBeInTheDocument()
    // Play by default (getState is unmocked here and resolves to no in-progress
    // game / rejects), linking to the Admin Panel.
    expect(screen.getByRole('link', { name: /play|resume/i })).toHaveAttribute('href', '/admin')
  })
})
