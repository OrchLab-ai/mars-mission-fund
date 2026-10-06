import pino from 'pino'
import { pool } from './db/pool.js'
import { createApp } from './app.js'

const logger = pino({ name: 'server' })
const PORT = process.env['PORT'] ?? '3001'

const app = createApp(pool)

const server = app.listen(Number(PORT), () => {
  logger.info({ port: PORT }, 'Server listening')
})

function shutdown() {
  logger.info('Shutting down…')
  server.close(() => {
    pool.end().then(() => {
      logger.info('Pool closed')
      process.exit(0)
    })
  })
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
