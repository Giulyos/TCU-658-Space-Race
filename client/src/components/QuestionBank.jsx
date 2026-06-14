import { useCallback, useEffect, useState } from 'react'
import { getQuestions, addQuestion, updateQuestion, deleteQuestion } from '../api/questionsApi.js'
import { getGameQuestions, addGameQuestion } from '../api/gamesApi.js'

// Teacher's question-bank manager: a paginated table of questions plus a form to
// add, edit, and delete them. When a `gameId` prop is given, the bank is scoped
// to that game (used inside the setup wizard); otherwise it operates on all
// questions. Updates and deletes are by question id either way.

const EMPTY_FORM = { text: '', correct_answer: '', point_value: 1 }
const PAGE_SIZE = 10

function QuestionBank({ gameId = null }) {
  const [questions, setQuestions] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    try {
      setQuestions(await (gameId != null ? getGameQuestions(gameId) : getQuestions()))
    } catch (err) {
      setError(err.message)
    }
  }, [gameId])

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
      point_value: Number(form.point_value),
    }
    try {
      if (editingId === null) {
        await (gameId != null ? addGameQuestion(gameId, payload) : addQuestion(payload))
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

  // Derive paging values each render. Clamping `page` here (rather than in an
  // effect) keeps it correct after deletes shrink the list, with no extra render.
  const totalPages = Math.max(1, Math.ceil(questions.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visible = questions.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <section className="nes-container with-title">
      <p className="title">Question Bank</p>

      {error && <p role="alert">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="nes-field">
          <label htmlFor="q-text">Question</label>
          <input
            id="q-text"
            className="nes-input"
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
          />
        </div>

        <div className="nes-field">
          <label htmlFor="q-answer">Correct answer</label>
          <input
            id="q-answer"
            className="nes-input"
            value={form.correct_answer}
            onChange={(e) => setForm({ ...form, correct_answer: e.target.value })}
          />
        </div>

        <div className="nes-field">
          <label htmlFor="q-points">Point value</label>
          <input
            id="q-points"
            type="number"
            min="1"
            className="nes-input"
            value={form.point_value}
            onChange={(e) => setForm({ ...form, point_value: e.target.value })}
          />
        </div>

        <button type="submit" className="nes-btn is-primary">
          {editingId === null ? 'Add question' : 'Save changes'}
        </button>
        {editingId !== null && (
          <button type="button" className="nes-btn" onClick={resetForm}>
            Cancel
          </button>
        )}
      </form>

      {questions.length === 0 ? (
        <p>No questions yet. Add one above.</p>
      ) : (
        <>
          <div className="nes-table-responsive">
            <table className="nes-table is-bordered is-dark">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Question</th>
                  <th>Answer</th>
                  <th>Pts</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((q) => (
                  <tr key={q.id}>
                    <td>{q.id}</td>
                    <td>{q.text}</td>
                    <td>{q.correct_answer}</td>
                    <td>{q.point_value}</td>
                    <td>
                      <button
                        type="button"
                        className="nes-btn is-warning"
                        onClick={() => handleEdit(q)}
                        aria-label={`Edit question ${q.id}`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="nes-btn is-error"
                        onClick={() => handleDelete(q.id)}
                        aria-label={`Delete question ${q.id}`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button
              type="button"
              className="nes-btn"
              onClick={() => setPage(safePage - 1)}
              disabled={safePage <= 1}
            >
              Prev
            </button>
            <span>
              Page {safePage} / {totalPages}
            </span>
            <button
              type="button"
              className="nes-btn"
              onClick={() => setPage(safePage + 1)}
              disabled={safePage >= totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  )
}

export default QuestionBank
