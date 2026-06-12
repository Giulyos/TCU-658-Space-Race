import { useCallback, useEffect, useState } from 'react'
import {
  getQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
} from '../api/questionsApi.js'

// Teacher's question-bank manager: lists questions and provides a form to add,
// edit, and delete them, wired to the /api/questions endpoints.

const EMPTY_FORM = { text: '', correct_answer: '', distractors: '', point_value: 1 }

// distractors is edited as a comma-separated string; convert to/from an array.
const parseDistractors = (s) =>
  s.split(',').map((d) => d.trim()).filter(Boolean)

function QuestionBank() {
  const [questions, setQuestions] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      setQuestions(await getQuestions())
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    const payload = {
      text: form.text,
      correct_answer: form.correct_answer,
      distractors: parseDistractors(form.distractors),
      point_value: Number(form.point_value),
    }
    try {
      if (editingId === null) {
        await addQuestion(payload)
      } else {
        await updateQuestion(editingId, payload)
      }
      resetForm()
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEdit = (q) => {
    setEditingId(q.id)
    setForm({
      text: q.text,
      correct_answer: q.correct_answer,
      distractors: (q.distractors ?? []).join(', '),
      point_value: q.point_value,
    })
  }

  const handleDelete = async (id) => {
    setError(null)
    try {
      await deleteQuestion(id)
      if (editingId === id) resetForm()
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section>
      <h2>Question Bank</h2>

      {error && <p role="alert">{error}</p>}

      <form onSubmit={handleSubmit}>
        <label htmlFor="q-text">Question</label>
        <input
          id="q-text"
          value={form.text}
          onChange={(e) => setForm({ ...form, text: e.target.value })}
        />

        <label htmlFor="q-answer">Correct answer</label>
        <input
          id="q-answer"
          value={form.correct_answer}
          onChange={(e) => setForm({ ...form, correct_answer: e.target.value })}
        />

        <label htmlFor="q-distractors">Distractors (comma-separated)</label>
        <input
          id="q-distractors"
          value={form.distractors}
          onChange={(e) => setForm({ ...form, distractors: e.target.value })}
        />

        <label htmlFor="q-points">Point value</label>
        <input
          id="q-points"
          type="number"
          min="1"
          value={form.point_value}
          onChange={(e) => setForm({ ...form, point_value: e.target.value })}
        />

        <button type="submit">{editingId === null ? 'Add question' : 'Save changes'}</button>
        {editingId !== null && (
          <button type="button" onClick={resetForm}>
            Cancel
          </button>
        )}
      </form>

      {questions.length === 0 ? (
        <p>No questions yet. Add one above.</p>
      ) : (
        <ul>
          {questions.map((q) => (
            <li key={q.id}>
              <span>
                {q.text} — <strong>{q.correct_answer}</strong> ({q.point_value} pt)
              </span>
              <button type="button" onClick={() => handleEdit(q)} aria-label={`Edit question ${q.id}`}>
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(q.id)}
                aria-label={`Delete question ${q.id}`}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default QuestionBank
