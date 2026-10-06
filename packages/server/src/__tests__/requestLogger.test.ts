import { describe, it, expect } from 'vitest'
import express from 'express'
import request from 'supertest'
import { correlationId } from '../middleware/correlationId.js'
import { createRequestLogger } from '../middleware/requestLogger.js'

function buildApp() {
  const lines: Record<string, unknown>[] = []
  const destination = { write: (chunk: string) => void lines.push(JSON.parse(chunk)) }

  const app = express()
  app.use(correlationId)
  app.use(createRequestLogger(destination))
  app.get('/ok', (req, res) => {
    req.log.info('inside handler')
    res.json({ ok: true })
  })
  app.get('/missing', (_req, res) => {
    res.status(404).json({})
  })
  return { app, lines }
}

describe('request logger', () => {
  it('logs method, path, status, duration and correlation id as flat JSON', async () => {
    const { app, lines } = buildApp()

    const res = await request(app).get('/ok?token=secret').set('x-correlation-id', 'abc-123')

    expect(res.headers['x-correlation-id']).toBe('abc-123')
    const line = lines.find((l) => l['msg'] === 'request completed')
    expect(line).toMatchObject({
      method: 'GET',
      path: '/ok',
      status: 200,
      correlation_id: 'abc-123',
    })
    expect(typeof line?.['duration_ms']).toBe('number')
    expect(JSON.stringify(line)).not.toContain('secret')
  })

  it('binds the correlation id to logs written from handlers', async () => {
    const { app, lines } = buildApp()

    await request(app).get('/ok').set('x-correlation-id', 'abc-123')

    const line = lines.find((l) => l['msg'] === 'inside handler')
    expect(line).toMatchObject({ correlation_id: 'abc-123' })
  })

  it('uses the generated correlation id when none is supplied, and warns on 4xx', async () => {
    const { app, lines } = buildApp()

    const res = await request(app).get('/missing')

    const line = lines.find((l) => l['msg'] === 'request completed')
    expect(line).toMatchObject({ status: 404, level: 40 })
    expect(line?.['correlation_id']).toBe(res.headers['x-correlation-id'])
  })
})
