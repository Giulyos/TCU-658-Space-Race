import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App.jsx'

// Smoke test: confirms the client test harness works and <App /> mounts.
// Routes default to the Game Screen, so its heading should be present.
describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /game screen/i })).toBeInTheDocument()
  })
})
