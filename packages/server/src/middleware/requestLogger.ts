import type { IncomingMessage, ServerResponse } from 'http'
import pino from 'pino'
import type { DestinationStream } from 'pino'
import { pinoHttp } from 'pino-http'

function correlationIdOf(res: ServerResponse): string | undefined {
  return (res as ServerResponse & { locals?: Record<string, unknown> }).locals?.[
    'correlationId'
  ] as string | undefined
}

// One JSON line per request: method, path (no query string), status_code, duration_ms and
// correlation_id. Must run after the correlationId middleware. req.log is a child logger that
// carries the same correlation_id, so handlers can log with it.
export function createRequestLogger(destination?: DestinationStream) {
  const logger = pino({ name: 'http' }, destination)

  return pinoHttp({
    logger,
    genReqId: (_req: IncomingMessage, res: ServerResponse) => correlationIdOf(res) ?? '',
    customProps: (_req: IncomingMessage, res: ServerResponse) => ({
      correlation_id: correlationIdOf(res),
    }),
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return 'error'
      if (res.statusCode >= 400) return 'warn'
      return 'info'
    },
    // Drop the default req/res objects (headers include credentials); the fields we want are
    // added explicitly below.
    serializers: { req: () => undefined, res: () => undefined },
    customSuccessMessage: () => 'request completed',
    customErrorMessage: () => 'request completed',
    customSuccessObject: (req, res, val: { responseTime: number }) => ({
      method: req.method,
      path: (req as IncomingMessage & { originalUrl?: string }).originalUrl?.split('?')[0],
      status_code: res.statusCode,
      duration_ms: val.responseTime,
    }),
    customErrorObject: (req, res, _err, val: { responseTime: number }) => ({
      method: req.method,
      path: (req as IncomingMessage & { originalUrl?: string }).originalUrl?.split('?')[0],
      status_code: res.statusCode,
      duration_ms: val.responseTime,
    }),
  })
}
