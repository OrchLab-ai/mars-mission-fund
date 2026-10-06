import pino from 'pino'
import { pinoHttp } from 'pino-http'

export function createRequestLogger() {
  const transport =
    process.env['NODE_ENV'] !== 'production' ? pino.transport({ target: 'pino-pretty' }) : undefined

  const logger = pino(transport)

  return pinoHttp({ logger })
}
