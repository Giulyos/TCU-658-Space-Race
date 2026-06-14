import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import QuestionBank from './QuestionBank.jsx'
import * as api from '../api/questionsApi.js'

vi.mock('../api/questionsApi.js')

const Q1 = { id: 1, text: 'Past tense of go?', correct_answer: 'went', point_value: 1 }

beforeEach(() => {
  vi.clearAllMocks()
  api.getQuestions.mockResolvedValue([Q1])
  api.addQuestion.mockResolvedValue({ id: 2 })
  api.updateQuestion.mockResolvedValue({ id: 1 })
  api.deleteQuestion.mockResolvedValue(null)
})

describe('QuestionBank', () => {
  it('lists existing questions loaded from the API', async () => {
    render(<QuestionBank />)
    expect(await screen.findByText(/Past tense of go\?/)).toBeInTheDocument()
  })

  it('adds a question from the form', async () => {
    render(<QuestionBank />)
    await screen.findByText(/Past tense of go\?/)

    fireEvent.change(screen.getByLabelText('Question'), { target: { value: 'Plural of child?' } })
    fireEvent.change(screen.getByLabelText('Correct answer'), { target: { value: 'children' } })
    fireEvent.change(screen.getByLabelText('Point value'), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add question' }))

    await waitFor(() =>
      expect(api.addQuestion).toHaveBeenCalledWith({
        text: 'Plural of child?',
        correct_answer: 'children',
        point_value: 2,
      }),
    )
    expect(api.getQuestions).toHaveBeenCalledTimes(2) // initial + reload
  })

  it('populates the form when editing and calls update on save', async () => {
    render(<QuestionBank />)
    await screen.findByText(/Past tense of go\?/)

    fireEvent.click(screen.getByRole('button', { name: 'Edit question 1' }))
    expect(screen.getByLabelText('Question')).toHaveValue('Past tense of go?')
    expect(screen.getByLabelText('Correct answer')).toHaveValue('went')

    fireEvent.change(screen.getByLabelText('Point value'), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() =>
      expect(api.updateQuestion).toHaveBeenCalledWith(1, expect.objectContaining({ point_value: 3 })),
    )
  })

  it('deletes a question', async () => {
    render(<QuestionBank />)
    await screen.findByText(/Past tense of go\?/)

    fireEvent.click(screen.getByRole('button', { name: 'Delete question 1' }))
    await waitFor(() => expect(api.deleteQuestion).toHaveBeenCalledWith(1))
  })

  it('shows an error when adding fails', async () => {
    api.addQuestion.mockRejectedValue(new Error('text is required'))
    render(<QuestionBank />)
    await screen.findByText(/Past tense of go\?/)

    fireEvent.click(screen.getByRole('button', { name: 'Add question' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('text is required')
  })

  describe('pagination', () => {
    // 23 questions -> 3 pages of 10/10/3.
    const many = Array.from({ length: 23 }, (_, i) => ({
      id: i + 1,
      text: `Question ${i + 1}`,
      correct_answer: `A${i + 1}`,
      point_value: 1,
    }))

    beforeEach(() => {
      api.getQuestions.mockResolvedValue(many)
    })

    it('shows only 10 questions on the first page', async () => {
      render(<QuestionBank />)
      expect(await screen.findByText('Question 1')).toBeInTheDocument()
      expect(screen.getByText('Question 10')).toBeInTheDocument()
      expect(screen.queryByText('Question 11')).not.toBeInTheDocument()
      expect(screen.getByText('Page 1 / 3')).toBeInTheDocument()
    })

    it('navigates to the next page', async () => {
      render(<QuestionBank />)
      await screen.findByText('Question 1')

      fireEvent.click(screen.getByRole('button', { name: 'Next' }))
      expect(screen.getByText('Question 11')).toBeInTheDocument()
      expect(screen.queryByText('Question 1')).not.toBeInTheDocument()
      expect(screen.getByText('Page 2 / 3')).toBeInTheDocument()
    })

    it('disables Prev on the first page and Next on the last', async () => {
      render(<QuestionBank />)
      await screen.findByText('Question 1')

      expect(screen.getByRole('button', { name: 'Prev' })).toBeDisabled()
      fireEvent.click(screen.getByRole('button', { name: 'Next' })) // page 2
      fireEvent.click(screen.getByRole('button', { name: 'Next' })) // page 3 (last)
      expect(screen.getByText('Page 3 / 3')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    })
  })
})
