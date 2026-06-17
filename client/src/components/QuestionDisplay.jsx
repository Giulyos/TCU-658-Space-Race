import { useState } from 'react'
import { submitTurn } from '../api/gameApi.js'
import { play } from '../sound/sounds.js'
import { teamColor } from './raceUtils.js'

// Jeopardy-style question popup: the active question appears as a centered card
// over the board, with the teacher's Correct / Incorrect buttons right on it
// (they appear and disappear with the popup). Teacher-judged, so only the
// question text is shown — no answer, no options. The header shows whose turn it
// is and how many points the question is worth. Visible only during active play
// (not before start, while paused, or after a winner).
function QuestionDisplay({ question, state, refresh }) {
  const [error, setError] = useState(null)
  const inPlay = state?.active === 1 && state?.winner == null
  if (!question || !inPlay) return null

  const team = state.currentTeam
  const teamName = state.teamNames?.[team - 1] ?? `Team ${team}`
  const points = question.point_value ?? 1

  // Mark the turn, then refresh shared state (which clears the question and
  // closes this popup). Errors are shown on the card.
  const mark = async (correct) => {
    setError(null)
    // Fired from the teacher's click (a user gesture), so playback is allowed.
    // The win sound is handled separately by the banner.
    play(correct ? 'correct' : 'incorrect')
    try {
      await submitTurn(correct)
      await refresh?.()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="question-overlay">
      <div className="question-card nes-container is-dark" role="dialog" aria-label="Current question">
        <p className="question-label">
          <span className="question-team" style={{ color: teamColor(team) }}>{teamName}</span>
          {` — ${points} ${points === 1 ? 'point' : 'points'}`}
        </p>
        <p className="question-text">{question.text}</p>
        {error && <p role="alert">{error}</p>}
        <div className="question-actions">
          <button type="button" className="nes-btn is-success" onClick={() => mark(true)}>
            Correct
          </button>
          <button type="button" className="nes-btn is-error" onClick={() => mark(false)}>
            Incorrect
          </button>
        </div>
      </div>
    </div>
  )
}

export default QuestionDisplay
