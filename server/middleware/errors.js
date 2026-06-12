// Centralized error handling for the API. Routes signal failures by throwing
// (or passing to next) an HttpError; everything converges on one consistent
// JSON error shape: { error: <message> }.

// An error carrying an HTTP status code. Routes throw this for expected
// failures (validation, not-found, conflicts).
export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message)
    this.name = 'HttpError'
    this.statusCode = statusCode
  }
}

// Convenience for the most common case.
export const badRequest = (message) => new HttpError(400, message)
export const notFound = (message) => new HttpError(404, message)

// Terminal middleware for requests that matched no route -> 404.
export const notFoundHandler = (req, _res, next) => {
  next(new HttpError(404, `Not found: ${req.method} ${req.originalUrl}`))
}

// Error-handling middleware (must keep the 4-arg signature so Express treats it
// as an error handler). Client errors (4xx) return their message; anything else
// is treated as an unexpected server error and the detail is not leaked.
export const errorHandler = (err, _req, res, _next) => {
  // body-parser sets err.status (e.g. 400 for malformed JSON).
  const status = err.statusCode ?? err.status ?? 500

  if (status >= 500) {
    console.error(err)
    return res.status(500).json({ error: 'Internal server error' })
  }

  res.status(status).json({ error: err.message })
}
