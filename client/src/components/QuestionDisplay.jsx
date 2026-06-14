// Shows the active question. When the question has distractors, the correct
// answer and distractors are shown together as multiple-choice options (the
// teacher still judges the spoken answer). The option order is derived from the
// question id, so it stays stable across the 1s state polls instead of
// reshuffling on every refresh.

const hash = (s) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}

// Stable ordering of [correct, ...distractors], keyed by the question id.
const orderedOptions = (question) =>
  [question.correct_answer, ...(question.distractors ?? [])]
    .map((opt) => ({ opt, k: hash(`${opt}:${question.id}`) }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.opt)

function QuestionDisplay({ question }) {
  if (!question) return null
  const options = question.distractors?.length ? orderedOptions(question) : null

  return (
    <section className="question-display nes-container is-dark">
      <p className="question-text">{question.text}</p>
      {options && (
        <ul className="question-options">
          {options.map((opt, i) => (
            <li key={i}>
              <span className="option-key">{String.fromCharCode(65 + i)}</span> {opt}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default QuestionDisplay
