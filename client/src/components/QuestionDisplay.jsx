// Shows the active question text. The game is teacher-judged (no answer choices
// are shown on the projected screen). The Jeopardy-style popup styling comes in
// #51.
function QuestionDisplay({ question }) {
  if (!question) return null

  return (
    <section className="question-display nes-container is-dark">
      <p className="question-text">{question.text}</p>
    </section>
  )
}

export default QuestionDisplay
