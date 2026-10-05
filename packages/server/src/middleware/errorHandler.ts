import type { Request, Response, NextFunction } from 'express'

interface AppError extends Error {
  status?: number
  code?: string
  details?: Record<string, unknown>
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const status = err.status ?? 500
  const correlationId = res.locals['correlationId'] as string | undefined

  // Unexpected errors (database failures and the like) can carry SQL or table names in their
  // message. Keep the real error in the server log and send the client a generic one.
  if (status >= 500) {
    req.log?.error({ err }, 'Unhandled error')
  }

  res.status(status).json({
    error: {
      code: err.code ?? 'INTERNAL_SERVER_ERROR',
      message: status >= 500 ? 'An unexpected error occurred' : err.message,
      correlation_id: correlationId,
      details: err.details ?? {},
    },
  })
}
