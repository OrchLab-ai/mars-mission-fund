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

  res.status(status).json({
    error: {
      code: err.code ?? 'INTERNAL_SERVER_ERROR',
      message: err.message ?? 'An unexpected error occurred',
      correlation_id: correlationId,
      details: err.details ?? {},
    },
  })
}
