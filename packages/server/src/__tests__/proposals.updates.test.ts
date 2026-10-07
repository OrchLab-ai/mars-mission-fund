import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { createApp } from '../app.js'
import type { Pool } from 'pg'

const mockQuery = vi.fn()
const mockPool = { query: mockQuery, connect: vi.fn() } as unknown as Pool
const app = createApp(mockPool)

const PROPOSAL_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const AUTHOR_UUID = '22222222-2222-2222-2222-222222222222'
const UPDATE_ID_LOW = '00000000-0003-0000-0000-000000000001'
const UPDATE_ID_HIGH = '00000000-0003-0000-0000-000000000002'
const AUTHOR_EMAIL = 'creator@example.com'

function proposalState(status: string) {
  return {
    rows: [
      {
        id: PROPOSAL_UUID,
        status,
        creatorId: AUTHOR_UUID,
        currentAmountUsd: 0,
        minFundingTargetUsd: 100000,
        maxFundingCapUsd: 500000,
        contributorCount: 0,
        deadline: null,
        cancellationRequestedAt: null,
        launchedAt: null,
      },
    ],
    rowCount: 1,
  }
}

function updateRow(overrides: Record<string, unknown> = {}) {
  return {
    id: UPDATE_ID_LOW,
    title: 'Prototype build is underway',
    body: 'Line one\nLine two',
    authorId: AUTHOR_UUID,
    authorName: 'Demo Creator',
    createdAt: new Date('2026-09-20T10:00:00.000Z'),
    ...overrides,
  }
}

describe('GET /v1/proposals/:id/updates', () => {
  beforeEach(() => {
    mockQuery.mockReset()
  })

  it('returns 200 with items shaped as MissionUpdate and no proposalId', async () => {
    mockQuery
      .mockResolvedValueOnce(proposalState('Live'))
      .mockResolvedValueOnce({ rows: [updateRow()], rowCount: 1 })

    const res = await request(app).get(`/v1/proposals/${PROPOSAL_UUID}/updates`)

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(Object.keys(res.body.data[0]).sort()).toEqual([
      'authorId',
      'authorName',
      'body',
      'createdAt',
      'id',
      'title',
    ])
    expect(res.body.data[0]).toMatchObject({
      id: UPDATE_ID_LOW,
      title: 'Prototype build is underway',
      body: 'Line one\nLine two',
      authorId: AUTHOR_UUID,
      authorName: 'Demo Creator',
      createdAt: '2026-09-20T10:00:00.000Z',
    })
    expect(res.body.data[0]).not.toHaveProperty('proposalId')
  })

  it('returns authorName null for a null display_name and never the email', async () => {
    mockQuery
      .mockResolvedValueOnce(proposalState('Live'))
      .mockResolvedValueOnce({ rows: [updateRow({ authorName: null })], rowCount: 1 })

    const res = await request(app).get(`/v1/proposals/${PROPOSAL_UUID}/updates`)

    expect(res.status).toBe(200)
    expect(res.body.data[0].authorName).toBeNull()
    expect(JSON.stringify(res.body)).not.toContain(AUTHOR_EMAIL)
    const listSql = mockQuery.mock.calls[1]![0] as string
    expect(listSql).not.toMatch(/email/i)
  })

  it('orders by created_at DESC, id DESC and passes the row order through', async () => {
    const sameTime = new Date('2026-10-01T14:30:00.000Z')
    mockQuery.mockResolvedValueOnce(proposalState('Live')).mockResolvedValueOnce({
      rows: [
        updateRow({ id: UPDATE_ID_HIGH, createdAt: sameTime }),
        updateRow({ id: UPDATE_ID_LOW, createdAt: sameTime }),
      ],
      rowCount: 2,
    })

    const res = await request(app).get(`/v1/proposals/${PROPOSAL_UUID}/updates`)

    // The pool is mocked, so A2 is verified by the SQL text plus pass-through of the
    // row order. The real ordering is checked against the dev database.
    const listSql = mockQuery.mock.calls[1]![0] as string
    expect(listSql).toMatch(/ORDER BY\s+u\.created_at DESC,\s+u\.id DESC/)
    expect(res.body.data.map((u: { id: string }) => u.id)).toEqual([UPDATE_ID_HIGH, UPDATE_ID_LOW])
  })

  it('returns 200 with an empty array when there are no updates', async () => {
    mockQuery
      .mockResolvedValueOnce(proposalState('Live'))
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })

    const res = await request(app).get(`/v1/proposals/${PROPOSAL_UUID}/updates`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ data: [] })
  })

  it('returns the same payload for Live and Draft proposals', async () => {
    mockQuery
      .mockResolvedValueOnce(proposalState('Live'))
      .mockResolvedValueOnce({ rows: [updateRow()], rowCount: 1 })
    const live = await request(app).get(`/v1/proposals/${PROPOSAL_UUID}/updates`)

    mockQuery
      .mockResolvedValueOnce(proposalState('Draft'))
      .mockResolvedValueOnce({ rows: [updateRow()], rowCount: 1 })
    const draft = await request(app).get(`/v1/proposals/${PROPOSAL_UUID}/updates`)

    expect(live.status).toBe(200)
    expect(draft.status).toBe(200)
    expect(draft.body).toEqual(live.body)
  })

  it('returns 404 PROPOSAL_NOT_FOUND with the standard error shape', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })

    const res = await request(app).get(`/v1/proposals/${PROPOSAL_UUID}/updates`)

    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('PROPOSAL_NOT_FOUND')
    expect(res.body.error).toHaveProperty('correlation_id')
    expect(res.body.error).not.toHaveProperty('stack')
    expect(JSON.stringify(res.body)).not.toMatch(/SELECT|proposal_updates/i)
    expect(mockQuery).toHaveBeenCalledTimes(1)
  })

  it('returns 400 INVALID_PROPOSAL_ID for a non-uuid and runs no query', async () => {
    const res = await request(app).get('/v1/proposals/not-a-uuid/updates')

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_PROPOSAL_ID')
    expect(res.body.error).toHaveProperty('correlation_id')
    expect(res.body.error).not.toHaveProperty('stack')
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it('passes parameters as an array and interpolates no id into the SQL', async () => {
    mockQuery
      .mockResolvedValueOnce(proposalState('Live'))
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })

    await request(app).get(`/v1/proposals/${PROPOSAL_UUID}/updates`)

    for (const call of mockQuery.mock.calls) {
      expect(call[0]).not.toContain(PROPOSAL_UUID)
      expect(call[1]).toEqual([PROPOSAL_UUID])
    }
  })
})

describe('POST /v1/proposals/:id/updates', () => {
  const TEST_JWT_SECRET = 'test-jwt-secret-for-proposal-tests'
  const OTHER_CREATOR_UUID = '33333333-3333-3333-3333-333333333333'
  const BACKER_UUID = '44444444-4444-4444-4444-444444444444'
  const ADMIN_UUID = '55555555-5555-5555-5555-555555555555'
  const ALL_STATUSES = [
    'Draft',
    'Submitted',
    'Under Review',
    'Approved',
    'Rejected',
    'Live',
    'Funded',
    'Settlement',
    'Complete',
    'Suspended',
    'Failed',
    'Cancelled',
  ]
  const ALLOWED = ['Live', 'Funded', 'Settlement', 'Complete']
  const url = `/v1/proposals/${PROPOSAL_UUID}/updates`

  function token(id: string, role: string): string {
    return jwt.sign({ id, role }, TEST_JWT_SECRET)
  }
  const creatorToken = () => token(AUTHOR_UUID, 'Creator')

  function post(body: unknown, auth: string | null = creatorToken(), path = url) {
    const req = request(app).post(path)
    if (auth !== null) req.set('Authorization', `Bearer ${auth}`)
    return req.send(body as object)
  }

  function mockSuccess(status = 'Live', row: Record<string, unknown> = updateRow()) {
    mockQuery
      .mockResolvedValueOnce(proposalState(status))
      .mockResolvedValueOnce({ rows: [row], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })
  }

  function auditCalls() {
    return mockQuery.mock.calls.filter((c) => String(c[0]).includes('INSERT INTO audit_events'))
  }

  beforeEach(() => {
    mockQuery.mockReset()
    vi.stubEnv('JWT_SECRET', TEST_JWT_SECRET)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 201 with the six-key item, trimmed values and kept line breaks', async () => {
    mockSuccess('Live', updateRow({ title: 'Hello', body: 'a\nb' }))

    const res = await post({ title: '  Hello  ', body: '  a\nb \n' })

    expect(res.status).toBe(201)
    expect(Object.keys(res.body.data).sort()).toEqual([
      'authorId',
      'authorName',
      'body',
      'createdAt',
      'id',
      'title',
    ])
    const insertCall = mockQuery.mock.calls[1]!
    expect(insertCall[0]).toContain('INSERT INTO proposal_updates')
    expect(insertCall[1]).toEqual([PROPOSAL_UUID, AUTHOR_UUID, 'Hello', 'a\nb'])
  })

  it('returns 401 with no token', async () => {
    const res = await post({ title: 't', body: 'b' }, null)
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it.each([
    ['Backer', BACKER_UUID],
    ['Administrator', ADMIN_UUID],
  ])('returns 403 FORBIDDEN for a %s', async (role, id) => {
    const res = await post({ title: 't', body: 'b' }, token(id, role))
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it.each(['Live', 'Draft'])('returns 403 for a non-owner on a %s proposal', async (status) => {
    mockQuery.mockResolvedValueOnce(proposalState(status))

    const res = await post({ title: 't', body: 'b' }, token(OTHER_CREATOR_UUID, 'Creator'))

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
    expect(mockQuery).toHaveBeenCalledTimes(1)
    expect(auditCalls()).toHaveLength(0)
  })

  it('returns 403 for a creator who matches only created_by', async () => {
    const state = proposalState('Live')
    state.rows[0]!.creatorId = OTHER_CREATOR_UUID
    ;(state.rows[0] as Record<string, unknown>)['createdBy'] = AUTHOR_UUID
    mockQuery.mockResolvedValueOnce(state)

    const res = await post({ title: 't', body: 'b' })

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  it('returns 403 with no error when creatorId is null', async () => {
    const state = proposalState('Complete')
    ;(state.rows[0] as Record<string, unknown>)['creatorId'] = null
    mockQuery.mockResolvedValueOnce(state)

    const res = await post({ title: 't', body: 'b' })

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
    expect(mockQuery).toHaveBeenCalledTimes(1)
  })

  it.each(ALL_STATUSES)('handles status %s for the owner', async (status) => {
    if (ALLOWED.includes(status)) {
      mockSuccess(status)
      const res = await post({ title: 't', body: 'b' })
      expect(res.status).toBe(201)
    } else {
      mockQuery.mockResolvedValueOnce(proposalState(status))
      const res = await post({ title: 't', body: 'b' })
      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('INVALID_PROPOSAL_STATE')
      expect(res.body.error.details).toEqual({ currentStatus: status })
      expect(auditCalls()).toHaveLength(0)
    }
  })

  it.each([
    ['missing title', { body: 'b' }],
    ['empty title', { title: '', body: 'b' }],
    ['whitespace title', { title: '   ', body: 'b' }],
    ['missing body', { title: 't' }],
    ['empty body', { title: 't', body: '' }],
    ['whitespace body', { title: 't', body: ' \n ' }],
    ['121-char title', { title: 'x'.repeat(121), body: 'b' }],
    ['5001-char body', { title: 't', body: 'x'.repeat(5001) }],
  ])('returns 400 INVALID_REQUEST_BODY for %s and runs no query', async (_name, body) => {
    const res = await post(body)
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_REQUEST_BODY')
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it('accepts a 120-char title and a 5000-char body', async () => {
    mockSuccess()
    const res = await post({ title: 'x'.repeat(120), body: 'y'.repeat(5000) })
    expect(res.status).toBe(201)
  })

  it('returns 400 INVALID_PROPOSAL_ID for a non-uuid and runs no query', async () => {
    const res = await post({ title: 't', body: 'b' }, creatorToken(), '/v1/proposals/nope/updates')
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_PROPOSAL_ID')
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it('returns 404 PROPOSAL_NOT_FOUND before ownership and status checks', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })
    const res = await post({ title: 't', body: 'b' })
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('PROPOSAL_NOT_FOUND')
    expect(mockQuery).toHaveBeenCalledTimes(1)
  })

  describe('audit', () => {
    it('writes exactly one audit event after the insert, without title or body', async () => {
      mockSuccess('Live', updateRow({ id: UPDATE_ID_HIGH }))

      const res = await post({ title: 'Secret title', body: 'Secret body text' })

      expect(res.status).toBe(201)
      expect(mockQuery).toHaveBeenCalledTimes(3)
      const audits = auditCalls()
      expect(audits).toHaveLength(1)
      expect(mockQuery.mock.calls[2]).toBe(audits[0])
      const params = audits[0]![1] as unknown[]
      // correlation_id, service, message, event_type, actor_id, actor_type, action,
      // resource_type, resource_id, outcome, previous_state, new_state, rationale
      expect(params[0]).toEqual(expect.any(String))
      expect(params[4]).toBe(AUTHOR_UUID)
      expect(params[5]).toBe('user')
      expect(params[6]).toBe('proposal.mission_update_posted')
      expect(params[7]).toBe('proposal_update')
      expect(params[8]).toBe(UPDATE_ID_HIGH)
      expect(params[9]).toBe('success')
      expect(JSON.parse(params[11] as string)).toEqual({
        proposalId: PROPOSAL_UUID,
        bodyLength: 'Secret body text'.length,
      })
      const joined = JSON.stringify(params)
      expect(joined).not.toContain('Secret title')
      expect(joined).not.toContain('Secret body text')
    })

    it('still returns 201 when the audit insert rejects', async () => {
      mockQuery
        .mockResolvedValueOnce(proposalState('Live'))
        .mockResolvedValueOnce({ rows: [updateRow()], rowCount: 1 })
        .mockRejectedValueOnce(new Error('audit down'))

      const res = await post({ title: 't', body: 'b' })

      expect(res.status).toBe(201)
    })
  })

  it('returns a clean 500 with no SQL or stack for an unexpected insert error', async () => {
    mockQuery
      .mockResolvedValueOnce(proposalState('Live'))
      .mockRejectedValueOnce(new Error('relation "proposal_updates" does not exist'))

    const res = await post({ title: 't', body: 'b' })

    expect(res.status).toBe(500)
    expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR')
    expect(res.body.error).toHaveProperty('correlation_id')
    expect(res.body.error).not.toHaveProperty('stack')
    expect(JSON.stringify(res.body)).not.toMatch(/proposal_updates|INSERT|SELECT/i)
    for (const call of mockQuery.mock.calls) {
      expect(Array.isArray(call[1])).toBe(true)
      expect(call[0]).not.toContain(PROPOSAL_UUID)
    }
    expect(auditCalls()).toHaveLength(0)
  })
})
