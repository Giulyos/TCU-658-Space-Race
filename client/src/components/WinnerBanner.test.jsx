import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import WinnerBanner from './WinnerBanner.jsx'

const base = { winner: 2, teamNames: ['Red', 'Blue', 'Green', 'Gold'] }

describe('WinnerBanner', () => {
  it('renders the winning team name when shown', () => {
    const { getByText, container } = render(<WinnerBanner state={base} show />)
    expect(getByText('Blue')).toBeInTheDocument()
    expect(container.querySelector('.winner-banner')).toBeInTheDocument()
  })

  it('is hidden while the ship is still arriving (show=false)', () => {
    const { container } = render(<WinnerBanner state={base} show={false} />)
    expect(container.querySelector('.winner-banner')).toBeNull()
  })

  it('renders nothing when there is no winner', () => {
    const { container } = render(<WinnerBanner state={{ ...base, winner: null }} show />)
    expect(container).toBeEmptyDOMElement()
  })
})
