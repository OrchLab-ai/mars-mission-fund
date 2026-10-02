import { describe, it, expect } from 'vitest'
import express from 'express'
import request from 'supertest'
import { correlationId } from '../middleware/correlationId.js'
import { createRequestLogger } from '../middleware/requestLogger.js'

function makeApp() {
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
  app.get('/boom', (_req, res) => {
    res.status(500).json({})
  })
  return { app, lines }
}

describe('request logger', () => {
  it('logs method, path, status_code, duration_ms and correlation_id as JSON', async () => {
    const { app, lines } = makeApp()

    const res = await request(app).get('/ok?token=secret').set('x-correlation-id', 'corr-123')

    expect(res.status).toBe(200)
    const line = lines.find((l) => l['msg'] === 'request completed')
    expect(line).toMatchObject({
      method: 'GET',
      path: '/ok',
      status_code: 200,
      correlation_id: 'corr-123',
    })
    expect(typeof line?.['duration_ms']).toBe('number')
    expect(line?.['duration_ms']).toBeGreaterThanOrEqual(0)
    expect(JSON.stringify(line)).not.toContain('secret')
    expect(line).not.toHaveProperty('req')
    expect(line).not.toHaveProperty('res')
  })

  it('generates a correlation ID that matches the response header', async () => {
    const { app, lines } = makeApp()

    const res = await request(app).get('/ok')

    const line = lines.find((l) => l['msg'] === 'request completed')
    expect(line?.['correlation_id']).toBe(res.headers['x-correlation-id'])
  })

  it('carries the correlation ID on logs written from a handler', async () => {
    const { app, lines } = makeApp()

    await request(app).get('/ok').set('x-correlation-id', 'corr-456')

    const line = lines.find((l) => l['msg'] === 'inside handler')
    expect(line?.['correlation_id']).toBe('corr-456')
  })

  it('uses warn for 4xx and error for 5xx', async () => {
    const { app, lines } = makeApp()

    await request(app).get('/missing')
    await request(app).get('/boom')

    const completed = lines.filter((l) => l['msg'] === 'request completed')
    expect(completed.map((l) => [l['status_code'], l['level']])).toEqual([
      [404, 40],
      [500, 50],
    ])
  })
})
