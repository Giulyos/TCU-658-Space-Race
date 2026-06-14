import { useState } from 'react'
import { submitTurn } from '../api/gameApi.js'

// Jeopardy-style question popup: the active question appears as a large centered
// card overlaid on the board, with the teacher's Correct / Incorrect buttons
// right on it (they appear and disappear with the popup). Teacher-judged, so
// only the question text is shown — no answer, no options. Visible only during
// active play (not before start, while paused, or after a winner).
function QuestionDisplay({ question, state, refresh }) {
  const [error, setError] = useState(null)
  const inPlay = state?.active === 1 && state?.winner == null
  if (!question || !inPlay) return null

  // Mark the turn, then refresh shared state (which clears the question and
  // closes this popup). Errors are shown on the card.
  const mark = async (correct) => {
    setError(null)
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
        <p className="question-label">Question</p>
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
