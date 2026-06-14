// Jeopardy-style question popup: the active question appears as a large centered
// card overlaid on the board. Teacher-judged, so only the question text is shown
// (no answer, no options). Visible only during active play (not before start,
// while paused, or after a winner).
function QuestionDisplay({ question, state }) {
  const inPlay = state?.active === 1 && state?.winner == null
  if (!question || !inPlay) return null

  return (
    <div className="question-overlay">
      <div className="question-card nes-container is-dark" role="dialog" aria-label="Current question">
        <p className="question-label">Question</p>
        <p className="question-text">{question.text}</p>
      </div>
    </div>
  )
}

export default QuestionDisplay
