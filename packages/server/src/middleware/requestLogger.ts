import type { Request, Response, NextFunction, RequestHandler } from 'express'
import pino from 'pino'
import type { DestinationStream, Logger } from 'pino'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      log: Logger
    }
  }
}

// Must run after the correlationId middleware. Emits one flat JSON line per request:
// method, path, status, duration_ms, correlation_id. `req.log` is a child logger bound to the
// same correlation_id, so log lines written from route handlers can be tied to the request.
export function createRequestLogger(destination?: DestinationStream): RequestHandler {
  const logger = pino({ name: 'http' }, destination)

  return (req: Request, res: Response, next: NextFunction): void => {
    const start = process.hrtime.bigint()
    const correlationId = (res.locals['correlationId'] as string | undefined) ?? crypto.randomUUID()
    req.log = logger.child({ correlation_id: correlationId })

    let logged = false
    const log = (aborted: boolean): void => {
      if (logged) return
      logged = true
      const status = res.statusCode
      const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info'
      req.log[level](
        {
          method: req.method,
          // Path only: the query string may carry sensitive values
          path: req.originalUrl.split('?')[0],
          status,
          duration_ms: Number(process.hrtime.bigint() - start) / 1e6,
          ...(aborted && { aborted: true }),
        },
        aborted ? 'request aborted' : 'request completed'
      )
    }

    res.on('finish', () => log(false))
    // Client disconnected before the response finished
    res.on('close', () => log(true))
    next()
  }
}
