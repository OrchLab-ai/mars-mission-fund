import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { createApp } from '../app.js'
import type { Pool } from 'pg'

const TEST_JWT_SECRET = 'test-jwt-secret-for-update-tests'

const mockQuery = vi.fn()
const mockPool = { query: mockQuery } as unknown as Pool
const app = createApp(mockPool)

const PROPOSAL_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const UPDATE_UUID = 'c3d4e5f6-a7b8-9012-cdef-123456789012'
const CREATOR_UUID = '22222222-2222-2222-2222-222222222222'
const OTHER_CREATOR_UUID = '55555555-5555-5555-5555-555555555555'
const BACKER_UUID = '11111111-1111-1111-1111-111111111111'

function makeToken(id: string, role: string): string {
  return jwt.sign({ id, role }, TEST_JWT_SECRET, { expiresIn: '8h' })
}

const creatorToken = () => makeToken(CREATOR_UUID, 'Creator')

const olderUpdate = {
  id: 'd4e5f6a7-b8c9-0123-def0-234567890123',
  title: 'Engine hot-fire complete',
  body: 'The full-duration test ran clean.',
  authorName: 'Demo Creator',
  createdAt: new Date('2026-02-01T10:00:00.000Z'),
}

const newerUpdate = {
  id: UPDATE_UUID,
  title: 'Heat shield delayed',
  body: 'Line one.\nLine two.',
  authorName: 'Demo Creator',
  createdAt: new Date('2026-03-01T10:00:00.000Z'),
}

describe('Proposal updates routes', () => {
  beforeEach(() => {
    mockQuery.mockReset()
    vi.stubEnv('JWT_SECRET', TEST_JWT_SECRET)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('GET /v1/proposals/:id/updates', () => {
    it('returns 200 with the updates in the order the query returns them, without a token', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: PROPOSAL_UUID }], rowCount: 1 })
      mockQuery.mockResolvedValueOnce({ rows: [newerUpdate, olderUpdate], rowCount: 2 })

      const res = await request(app).get(`/v1/proposals/${PROPOSAL_UUID}/updates`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(2)
      expect(res.body.data[0]).toEqual({
        id: UPDATE_UUID,
        title: 'Heat shield delayed',
        body: 'Line one.\nLine two.',
        authorName: 'Demo Creator',
        createdAt: '2026-03-01T10:00:00.000Z',
      })
      expect(res.body.data[1].title).toBe('Engine hot-fire complete')
    })

    it('asks the database for newest first, scoped to the proposal, with parameters', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: PROPOSAL_UUID }], rowCount: 1 })
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      await request(app).get(`/v1/proposals/${PROPOSAL_UUID}/updates`)

      const [sql, params] = mockQuery.mock.calls[1] as [string, unknown[]]
      expect(sql).toMatch(/ORDER BY u\.created_at DESC/)
      expect(sql).toMatch(/a\.display_name AS "authorName"/)
      expect(sql).toMatch(/WHERE u\.proposal_id = \$1/)
      expect(params).toEqual([PROPOSAL_UUID])
    })

    it('returns 200 with an empty array when the proposal has no updates', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: PROPOSAL_UUID }], rowCount: 1 })
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const res = await request(app).get(`/v1/proposals/${PROPOSAL_UUID}/updates`)

      expect(res.status).toBe(200)
      expect(res.body).toEqual({ data: [] })
    })

    it('returns 404 PROPOSAL_NOT_FOUND when the proposal does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const res = await request(app).get(`/v1/proposals/${PROPOSAL_UUID}/updates`)

      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('PROPOSAL_NOT_FOUND')
      expect(mockQuery).toHaveBeenCalledTimes(1)
    })

    it('returns 400 INVALID_PROPOSAL_ID when the id is not a UUID', async () => {
      const res = await request(app).get('/v1/proposals/not-a-uuid/updates')

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('INVALID_PROPOSAL_ID')
      expect(mockQuery).not.toHaveBeenCalled()
    })
  })

  describe('POST /v1/proposals/:id/updates', () => {
    function mockCreatorOwnsProposal(): void {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: PROPOSAL_UUID, creator_id: CREATOR_UUID }],
        rowCount: 1,
      })
    }

    it('returns 201 with the created update wrapped in data', async () => {
      mockCreatorOwnsProposal()
      mockQuery.mockResolvedValueOnce({ rows: [newerUpdate], rowCount: 1 })
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // audit event

      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/updates`)
        .set('Authorization', `Bearer ${creatorToken()}`)
        .send({ title: 'Heat shield delayed', body: 'Line one.\nLine two.' })

      expect(res.status).toBe(201)
      expect(res.body.data).toEqual({
        id: UPDATE_UUID,
        title: 'Heat shield delayed',
        body: 'Line one.\nLine two.',
        authorName: 'Demo Creator',
        createdAt: '2026-03-01T10:00:00.000Z',
      })
    })

    it('writes an audit event naming the actor and the proposal', async () => {
      mockCreatorOwnsProposal()
      mockQuery.mockResolvedValueOnce({ rows: [newerUpdate], rowCount: 1 })
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

      await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/updates`)
        .set('Authorization', `Bearer ${creatorToken()}`)
        .send({ title: 'Heat shield delayed', body: 'Body' })

      expect(mockQuery).toHaveBeenCalledTimes(3)
      const [sql, params] = mockQuery.mock.calls[2] as [string, unknown[]]
      expect(sql).toMatch(/INSERT INTO audit_events/)
      expect(params).toContain('proposal.update_posted')
      expect(params).toContain(CREATOR_UUID)
      expect(params).toContain(PROPOSAL_UUID)
      expect(params).toContain('proposal')
    })

    it('still returns 201 when writing the audit event fails', async () => {
      mockCreatorOwnsProposal()
      mockQuery.mockResolvedValueOnce({ rows: [newerUpdate], rowCount: 1 })
      mockQuery.mockRejectedValueOnce(new Error('audit table unavailable'))

      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/updates`)
        .set('Authorization', `Bearer ${creatorToken()}`)
        .send({ title: 'Heat shield delayed', body: 'Body' })

      expect(res.status).toBe(201)
    })

    it('trims title and body before saving', async () => {
      mockCreatorOwnsProposal()
      mockQuery.mockResolvedValueOnce({ rows: [newerUpdate], rowCount: 1 })
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

      await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/updates`)
        .set('Authorization', `Bearer ${creatorToken()}`)
        .send({ title: '  Heat shield delayed  ', body: '\n  Line one.  \n' })

      const [, params] = mockQuery.mock.calls[1] as [string, unknown[]]
      expect(params).toEqual([PROPOSAL_UUID, CREATOR_UUID, 'Heat shield delayed', 'Line one.'])
    })

    it('passes user text as parameters, never into the SQL string', async () => {
      const hostile = `Robert'); DROP TABLE proposal_updates;--`
      mockCreatorOwnsProposal()
      mockQuery.mockResolvedValueOnce({ rows: [newerUpdate], rowCount: 1 })
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

      await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/updates`)
        .set('Authorization', `Bearer ${creatorToken()}`)
        .send({ title: hostile, body: hostile })

      const [sql, params] = mockQuery.mock.calls[1] as [string, unknown[]]
      expect(sql).not.toContain('DROP TABLE')
      expect(params).toContain(hostile)
    })

    it('accepts a title of exactly 120 characters and a body of exactly 5000', async () => {
      mockCreatorOwnsProposal()
      mockQuery.mockResolvedValueOnce({ rows: [newerUpdate], rowCount: 1 })
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/updates`)
        .set('Authorization', `Bearer ${creatorToken()}`)
        .send({ title: 'a'.repeat(120), body: 'b'.repeat(5000) })

      expect(res.status).toBe(201)
    })

    it('returns 401 UNAUTHORIZED when no token is provided', async () => {
      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/updates`)
        .send({ title: 'Title', body: 'Body' })

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
      expect(mockQuery).not.toHaveBeenCalled()
    })

    it('returns 401 UNAUTHORIZED when the token is invalid', async () => {
      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/updates`)
        .set('Authorization', 'Bearer not-a-real-token')
        .send({ title: 'Title', body: 'Body' })

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    it('returns 403 FORBIDDEN when the user is not a Creator', async () => {
      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/updates`)
        .set('Authorization', `Bearer ${makeToken(BACKER_UUID, 'Backer')}`)
        .send({ title: 'Title', body: 'Body' })

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
      expect(mockQuery).not.toHaveBeenCalled()
    })

    it('returns 403 FORBIDDEN when a Creator does not own the proposal, and saves nothing', async () => {
      mockCreatorOwnsProposal()

      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/updates`)
        .set('Authorization', `Bearer ${makeToken(OTHER_CREATOR_UUID, 'Creator')}`)
        .send({ title: 'Title', body: 'Body' })

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
      expect(mockQuery).toHaveBeenCalledTimes(1)
    })

    it('returns 403 FORBIDDEN when the proposal has no creator on record', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: PROPOSAL_UUID, creator_id: null }],
        rowCount: 1,
      })

      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/updates`)
        .set('Authorization', `Bearer ${creatorToken()}`)
        .send({ title: 'Title', body: 'Body' })

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 404 PROPOSAL_NOT_FOUND when the proposal does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/updates`)
        .set('Authorization', `Bearer ${creatorToken()}`)
        .send({ title: 'Title', body: 'Body' })

      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('PROPOSAL_NOT_FOUND')
    })

    it('returns 400 INVALID_PROPOSAL_ID when the id is not a UUID', async () => {
      const res = await request(app)
        .post('/v1/proposals/not-a-uuid/updates')
        .set('Authorization', `Bearer ${creatorToken()}`)
        .send({ title: 'Title', body: 'Body' })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('INVALID_PROPOSAL_ID')
      expect(mockQuery).not.toHaveBeenCalled()
    })

    it.each([
      ['title is missing', { body: 'Body' }],
      ['body is missing', { title: 'Title' }],
      ['title is empty', { title: '', body: 'Body' }],
      ['body is empty', { title: 'Title', body: '' }],
      ['title is only whitespace', { title: '   ', body: 'Body' }],
      ['body is only whitespace', { title: 'Title', body: ' \n\t ' }],
      ['title is longer than 120 characters', { title: 'a'.repeat(121), body: 'Body' }],
      ['body is longer than 5000 characters', { title: 'Title', body: 'b'.repeat(5001) }],
      ['title is not a string', { title: 42, body: 'Body' }],
    ])('returns 400 INVALID_REQUEST_BODY when %s', async (_name, payload) => {
      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/updates`)
        .set('Authorization', `Bearer ${creatorToken()}`)
        .send(payload)

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('INVALID_REQUEST_BODY')
      expect(mockQuery).not.toHaveBeenCalled()
    })

    it('counts a title that is over 120 characters only after trimming', async () => {
      mockCreatorOwnsProposal()
      mockQuery.mockResolvedValueOnce({ rows: [newerUpdate], rowCount: 1 })
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/updates`)
        .set('Authorization', `Bearer ${creatorToken()}`)
        .send({ title: `  ${'a'.repeat(120)}  `, body: 'Body' })

      expect(res.status).toBe(201)
    })

    it('returns 500 INTERNAL_SERVER_ERROR without leaking SQL or a stack trace', async () => {
      const dbError = new Error(
        'duplicate key value violates constraint in INSERT INTO proposal_updates (proposal_id) VALUES ($1)'
      )
      mockQuery.mockRejectedValueOnce(dbError)

      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/updates`)
        .set('Authorization', `Bearer ${creatorToken()}`)
        .send({ title: 'Title', body: 'Body' })

      expect(res.status).toBe(500)
      expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR')
      const serialised = JSON.stringify(res.body)
      expect(serialised).not.toMatch(/INSERT INTO|proposal_updates|SELECT|at .*\.ts/i)
      expect(res.body.error).not.toHaveProperty('stack')
    })

    it('returns 500 INTERNAL_SERVER_ERROR on a database error while listing, without leaking SQL', async () => {
      mockQuery.mockRejectedValueOnce(
        new Error('relation "proposal_updates" does not exist: SELECT u.id FROM proposal_updates u')
      )

      const res = await request(app).get(`/v1/proposals/${PROPOSAL_UUID}/updates`)

      expect(res.status).toBe(500)
      expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(JSON.stringify(res.body)).not.toMatch(/SELECT|proposal_updates/i)
    })
  })
})
