import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import GameSettings from './GameSettings.jsx'
import * as api from '../api/gameApi.js'

vi.mock('../api/gameApi.js')

beforeEach(() => {
  vi.clearAllMocks()
  api.updateSettings.mockResolvedValue({ state: {} })
})

describe('GameSettings', () => {
  it('renders one name field per team by default (4)', () => {
    render(<GameSettings />)
    expect(screen.getByLabelText('Team 1 name')).toBeInTheDocument()
    expect(screen.getByLabelText('Team 4 name')).toBeInTheDocument()
  })

  it('adjusts the number of name fields when team count changes', () => {
    render(<GameSettings />)
    fireEvent.change(screen.getByLabelText('Number of teams'), { target: { value: '2' } })
    expect(screen.getByLabelText('Team 1 name')).toBeInTheDocument()
    expect(screen.queryByLabelText('Team 3 name')).not.toBeInTheDocument()
  })

  it('submits finish line and team names', async () => {
    render(<GameSettings />)
    fireEvent.change(screen.getByLabelText('Spaces to win'), { target: { value: '15' } })
    fireEvent.change(screen.getByLabelText('Number of teams'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('Team 1 name'), { target: { value: 'Red' } })
    fireEvent.change(screen.getByLabelText('Team 2 name'), { target: { value: 'Blue' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }))

    await waitFor(() =>
      expect(api.updateSettings).toHaveBeenCalledWith({
        finishLine: 15,
        teamNames: ['Red', 'Blue'],
      }),
    )
    expect(await screen.findByRole('status')).toHaveTextContent(/saved/i)
  })

  it('shows an error when saving fails', async () => {
    api.updateSettings.mockRejectedValue(new Error('finishLine must be an integer >= 1'))
    render(<GameSettings />)
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/finishLine/)
  })
})
