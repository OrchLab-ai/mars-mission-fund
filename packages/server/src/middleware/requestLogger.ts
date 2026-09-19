import pino from 'pino'
import type { Request, Response, NextFunction } from 'express'

export function createRequestLogger() {
  const transport =
    process.env['NODE_ENV'] !== 'production' ? pino.transport({ target: 'pino-pretty' }) : undefined

  const logger = pino(transport)

  return function requestLogger(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now()

    res.on('finish', () => {
      logger.info(
        {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          durationMs: Date.now() - start,
          correlationId: res.locals['correlationId'],
        },
        'request completed'
      )
    })

    next()
  }
}
