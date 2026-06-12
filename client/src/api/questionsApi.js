import { request } from './http.js'

// Question-bank API client. Mirrors the /api/questions endpoints.

export const getQuestions = () => request('GET', '/questions')

export const addQuestion = (question) => request('POST', '/questions', question)

export const updateQuestion = (id, fields) => request('PUT', `/questions/${id}`, fields)

export const deleteQuestion = (id) => request('DELETE', `/questions/${id}`)
