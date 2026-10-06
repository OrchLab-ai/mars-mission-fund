import pg from 'pg'
import pino from 'pino'

const { Pool } = pg
const logger = pino({ name: 'pool' })

export const pool = new Pool({
  connectionString: process.env['DATABASE_URL'],
})

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected error on idle client')
})

export default pool
