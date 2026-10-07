import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
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
