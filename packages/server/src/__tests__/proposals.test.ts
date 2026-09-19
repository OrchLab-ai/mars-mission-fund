import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { createApp } from '../app.js'
import type { Pool } from 'pg'

const TEST_JWT_SECRET = 'test-jwt-secret-for-proposal-tests'

const mockQuery = vi.fn()
const mockClientQuery = vi.fn()
const mockRelease = vi.fn()
const mockClient = { query: mockClientQuery, release: mockRelease }
const mockConnect = vi.fn().mockResolvedValue(mockClient)
const mockPool = { query: mockQuery, connect: mockConnect } as unknown as Pool
const app = createApp(mockPool)

const TEST_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const TEST_MILESTONE_UUID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901'
const CREATOR_UUID = '22222222-2222-2222-2222-222222222222'
const BACKER_UUID = 'b1b2b3b4-e5f6-7890-abcd-ef1234567890'
const ADMIN_UUID = 'ad000000-e5f6-7890-abcd-ef1234567890'
const OTHER_CREATOR_UUID = 'oc000000-e5f6-7890-abcd-ef1234567890'

function makeCreatorToken(id = CREATOR_UUID): string {
  return jwt.sign({ id, role: 'Creator' }, TEST_JWT_SECRET)
}
function makeBackerToken(): string {
  return jwt.sign({ id: BACKER_UUID, role: 'Backer' }, TEST_JWT_SECRET)
}
function makeAdminToken(): string {
  return jwt.sign({ id: ADMIN_UUID, role: 'Administrator' }, TEST_JWT_SECRET)
}
function makeToken(role: string): string {
  return jwt.sign({ id: TEST_UUID, role }, TEST_JWT_SECRET)
}

const mockProposalSummary = {
  id: TEST_UUID,
  title: 'Mars Habitat Project',
  summary: 'Building a habitat on Mars',
  status: 'Live',
  category: 'Habitats & Construction',
  heroImageUrl: null,
  goalAmount: 500000,
  raisedAmount: 125000,
  contributorCount: 42,
  deadline: null,
  createdAt: new Date('2024-01-15T10:00:00.000Z'),
  createdBy: CREATOR_UUID,
}

const mockProposalRow = {
  ...mockProposalSummary,
  slug: 'mars-habitat-project',
  description: 'Detailed description of the Mars Habitat Project',
  alignmentStatement: 'Aligned with Mars colonization goals',
  tags: ['habitat', 'mars', 'construction'],
  maxFundingCapUsd: 1000000,
  launchedAt: new Date('2024-01-20T00:00:00.000Z'),
  updatedAt: new Date('2024-01-20T10:00:00.000Z'),
  risk_disclosures: ['habitat pressure loss'],
}

// ProposalRow shapes for new endpoint tests
const mockApprovedProposalRow = {
  id: TEST_UUID,
  status: 'Approved',
  creatorId: CREATOR_UUID,
  currentAmountUsd: 0,
  minFundingTargetUsd: 100000,
  maxFundingCapUsd: 500000,
  contributorCount: 0,
  deadline: null,
  cancellationRequestedAt: null,
  launchedAt: null,
}

const mockLiveProposalRow = {
  id: TEST_UUID,
  status: 'Live',
  creatorId: CREATOR_UUID,
  currentAmountUsd: 50000,
  minFundingTargetUsd: 100000,
  maxFundingCapUsd: 500000,
  contributorCount: 5,
  deadline: null,
  cancellationRequestedAt: null,
  launchedAt: new Date('2026-01-01T00:00:00.000Z'),
}

const mockLiveProposalNoContributors = {
  ...mockLiveProposalRow,
  contributorCount: 0,
}

const mockLiveProposalCancellationRequested = {
  ...mockLiveProposalRow,
  cancellationRequestedAt: new Date('2026-02-01T00:00:00.000Z'),
}

const mockLiveProposalPastDeadlineUnderfunded = {
  ...mockLiveProposalRow,
  deadline: new Date('2026-01-01T00:00:00.000Z'), // past date
  currentAmountUsd: 10000, // underfunded
}

const mockLiveProposalPastDeadlineFunded = {
  ...mockLiveProposalRow,
  deadline: new Date('2026-01-01T00:00:00.000Z'), // past date
  currentAmountUsd: 200000, // above min target
}

const mockLaunchResult = {
  id: TEST_UUID,
  status: 'Live',
  launchedAt: new Date('2026-03-11T00:00:00.000Z'),
}

const mockPostUpdateResult = {
  id: 'upd00000-e5f6-7890-abcd-ef1234567890',
  body: 'Great progress on the habitat!',
  postedAt: new Date('2026-03-11T12:00:00.000Z'),
}

const mockContributeResult = {
  currentAmountUsd: 60000,
  contributorCount: 6,
  status: 'Live',
}

const mockContributeResultFunded = {
  currentAmountUsd: 100000,
  contributorCount: 6,
  status: 'Funded',
}

const mockMilestonePending = {
  id: TEST_MILESTONE_UUID,
  title: 'Phase 1',
  description: 'First phase',
  targetDate: null,
  fundingPercentage: 50,
  verificationCriteria: null,
  status: 'Pending',
  sortOrder: 1,
}

/** Mock pool.query to return an empty proposal row (getProposalById → null). */
function mockGetProposalNotFound(): void {
  mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })
}

/**
 * Mock the 5 pool.query calls that getProposalById makes:
 * proposal row, milestones, stretch goals, team members, updates.
 */
function mockGetProposalWithStatus(status: string, milestones: unknown[] = []): void {
  mockQuery.mockResolvedValueOnce({ rows: [{ ...mockProposalRow, status }], rowCount: 1 })
  mockQuery.mockResolvedValueOnce({ rows: milestones, rowCount: milestones.length })
  mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })
  mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })
  mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })
}

describe('Proposal Routes', () => {
  beforeEach(() => {
    mockQuery.mockReset()
    mockClientQuery.mockReset()
    mockRelease.mockReset()
    mockConnect.mockReset()
    mockConnect.mockResolvedValue(mockClient)
    vi.stubEnv('JWT_SECRET', TEST_JWT_SECRET)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('GET /v1/proposals', () => {
    it('returns 200 with data array when proposals exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockProposalSummary], rowCount: 1 })

      const res = await request(app).get('/v1/proposals')

      expect(res.status).toBe(200)
      expect(res.headers['content-type']).toMatch(/application\/json/)
      expect(res.body).toHaveProperty('data')
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].createdBy).toBe(CREATOR_UUID)
      expect(res.headers['x-correlation-id']).toBeDefined()
    })

    it('returns 200 with filtered proposals when status query param is valid', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockProposalSummary], rowCount: 1 })

      const res = await request(app).get('/v1/proposals?status=Live')

      expect(res.status).toBe(200)
      expect(res.headers['content-type']).toMatch(/application\/json/)
      expect(res.body).toHaveProperty('data')
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    it('returns 400 with INVALID_QUERY_PARAMS error when status is invalid', async () => {
      const res = await request(app).get('/v1/proposals?status=INVALID')

      expect(res.status).toBe(400)
      expect(res.headers['content-type']).toMatch(/application\/json/)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error.code).toBe('INVALID_QUERY_PARAMS')
      expect(res.body.error).toHaveProperty('correlation_id')
      expect(res.body.error).toHaveProperty('message')
    })

    it('returns 200 with matching proposals when search param is provided', async () => {
      const matchingProposal = { ...mockProposalSummary, title: 'Mars Propulsion Lab' }
      mockQuery.mockResolvedValueOnce({ rows: [matchingProposal], rowCount: 1 })

      const res = await request(app).get('/v1/proposals?search=Propulsion')

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].title).toBe('Mars Propulsion Lab')
    })

    it('returns 200 with proposals filtered by single category', async () => {
      const propulsionProposal = { ...mockProposalSummary, category: 'Propulsion' }
      mockQuery.mockResolvedValueOnce({ rows: [propulsionProposal], rowCount: 1 })

      const res = await request(app).get('/v1/proposals?categories=Propulsion')

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].category).toBe('Propulsion')
    })

    it('returns 200 with proposals filtered by multiple categories', async () => {
      const propulsionProposal = { ...mockProposalSummary, category: 'Propulsion' }
      const roboticsProposal = {
        ...mockProposalSummary,
        id: 'b2b2b2b2-e5f6-7890-abcd-ef1234567890',
        category: 'Robotics & Automation',
      }
      mockQuery.mockResolvedValueOnce({ rows: [propulsionProposal, roboticsProposal], rowCount: 2 })

      const res = await request(app).get(
        '/v1/proposals?categories=Propulsion,Robotics+%26+Automation'
      )

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(2)
    })

    it('returns 200 with intersection when both search and categories are provided', async () => {
      const matchingProposal = { ...mockProposalSummary, category: 'Propulsion' }
      mockQuery.mockResolvedValueOnce({ rows: [matchingProposal], rowCount: 1 })

      const res = await request(app).get('/v1/proposals?search=Mars&categories=Propulsion')

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
    })

    it('returns 200 with empty array when filters match no proposals', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const res = await request(app).get('/v1/proposals?search=nonexistentterm12345')

      expect(res.status).toBe(200)
      expect(res.body.data).toEqual([])
    })
  })

  describe('GET /v1/proposals/:id', () => {
    it('returns 200 with proposal data when found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockProposalRow], rowCount: 1 })
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // milestones
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // stretch goals
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // team members
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // updates

      const res = await request(app).get(`/v1/proposals/${TEST_UUID}`)

      expect(res.status).toBe(200)
      expect(res.headers['content-type']).toMatch(/application\/json/)
      expect(res.body).toHaveProperty('data')
      expect(res.body.data.id).toBe(TEST_UUID)
      expect(res.body.data.createdBy).toBe(CREATOR_UUID)
      expect(res.headers['x-correlation-id']).toBeDefined()
    })

    it('returns 404 with PROPOSAL_NOT_FOUND when proposal does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const res = await request(app).get(`/v1/proposals/${TEST_UUID}`)

      expect(res.status).toBe(404)
      expect(res.headers['content-type']).toMatch(/application\/json/)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error.code).toBe('PROPOSAL_NOT_FOUND')
      expect(res.body.error).toHaveProperty('correlation_id')
    })

    it('returns 400 with INVALID_PROPOSAL_ID when ID is not a UUID', async () => {
      const res = await request(app).get('/v1/proposals/not-a-uuid')

      expect(res.status).toBe(400)
      expect(res.headers['content-type']).toMatch(/application\/json/)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error.code).toBe('INVALID_PROPOSAL_ID')
      expect(res.body.error).toHaveProperty('correlation_id')
    })
  })

  describe('POST /v1/proposals/:id/launch', () => {
    it('returns 200 with launched proposal data on success', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockApprovedProposalRow], rowCount: 1 })
      mockQuery.mockResolvedValueOnce({ rows: [mockLaunchResult], rowCount: 1 })

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/launch`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('id', TEST_UUID)
      expect(res.body.data).toHaveProperty('status', 'Live')
      expect(res.body.data).toHaveProperty('launchedAt')
    })

    it('returns 200 when proposal has null creatorId (unassigned)', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockApprovedProposalRow, creatorId: null }],
        rowCount: 1,
      })
      mockQuery.mockResolvedValueOnce({ rows: [mockLaunchResult], rowCount: 1 })

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/launch`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(200)
    })

    it('returns 401 when no token is provided', async () => {
      const res = await request(app).post(`/v1/proposals/${TEST_UUID}/launch`)

      expect(res.status).toBe(401)
    })

    it('returns 403 when role is not Creator', async () => {
      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/launch`)
        .set('Authorization', `Bearer ${makeBackerToken()}`)

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 403 when Creator does not own the proposal', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockApprovedProposalRow, creatorId: OTHER_CREATOR_UUID }],
        rowCount: 1,
      })

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/launch`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 409 INVALID_PROPOSAL_STATE when proposal is not Approved', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockLiveProposalRow], rowCount: 1 })

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/launch`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('INVALID_PROPOSAL_STATE')
    })

    it('returns 500 on DB error during launch', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockApprovedProposalRow], rowCount: 1 })
      mockQuery.mockRejectedValueOnce(new Error('DB error'))

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/launch`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(500)
    })
  })

  describe('POST /v1/proposals/:id/updates', () => {
    it('returns 201 with posted update data on success', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockLiveProposalRow], rowCount: 1 })
      mockQuery.mockResolvedValueOnce({ rows: [mockPostUpdateResult], rowCount: 1 })

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/updates`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)
        .send({ body: 'Great progress on the habitat!' })

      expect(res.status).toBe(201)
      expect(res.body.data).toHaveProperty('id')
      expect(res.body.data).toHaveProperty('body', 'Great progress on the habitat!')
      expect(res.body.data).toHaveProperty('postedAt')
    })

    it('returns 201 when proposal is in Funded state', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockLiveProposalRow, status: 'Funded' }],
        rowCount: 1,
      })
      mockQuery.mockResolvedValueOnce({ rows: [mockPostUpdateResult], rowCount: 1 })

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/updates`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)
        .send({ body: 'Proposal funded! Here is an update.' })

      expect(res.status).toBe(201)
    })

    it('returns 401 when no token is provided', async () => {
      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/updates`)
        .send({ body: 'Some update' })

      expect(res.status).toBe(401)
    })

    it('returns 403 when role is not Creator', async () => {
      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/updates`)
        .set('Authorization', `Bearer ${makeBackerToken()}`)
        .send({ body: 'Some update' })

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 403 when Creator does not own the proposal', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockLiveProposalRow, creatorId: OTHER_CREATOR_UUID }],
        rowCount: 1,
      })

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/updates`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)
        .send({ body: 'Some update' })

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 400 when body is missing', async () => {
      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/updates`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)
        .send({})

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('INVALID_REQUEST_BODY')
    })

    it('returns 400 when body is empty string', async () => {
      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/updates`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)
        .send({ body: '' })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('INVALID_REQUEST_BODY')
    })

    it('returns 409 INVALID_PROPOSAL_STATE when proposal is Approved', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockApprovedProposalRow], rowCount: 1 })

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/updates`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)
        .send({ body: 'Some update' })

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('INVALID_PROPOSAL_STATE')
    })

    it('returns 500 on DB error during update insert', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockLiveProposalRow], rowCount: 1 })
      mockQuery.mockRejectedValueOnce(new Error('DB error'))

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/updates`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)
        .send({ body: 'Some update' })

      expect(res.status).toBe(500)
    })
  })

  describe('POST /v1/proposals/:id/contribute', () => {
    it('returns 200 with updated funding data on success', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockLiveProposalRow], rowCount: 1 })
      mockQuery.mockResolvedValueOnce({ rows: [mockContributeResult], rowCount: 1 })

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/contribute`)
        .set('Authorization', `Bearer ${makeBackerToken()}`)
        .send({ amountUsd: 10000 })

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('currentAmountUsd')
      expect(res.body.data).toHaveProperty('contributorCount')
      expect(res.body.data).toHaveProperty('status', 'Live')
    })

    it('returns 200 and transitions status to Funded when min target is met', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockLiveProposalRow], rowCount: 1 })
      mockQuery.mockResolvedValueOnce({ rows: [mockContributeResultFunded], rowCount: 1 })

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/contribute`)
        .set('Authorization', `Bearer ${makeBackerToken()}`)
        .send({ amountUsd: 50000 })

      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('Funded')
    })

    it('returns 200 for contributions to already-Funded proposals', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockLiveProposalRow, status: 'Funded', currentAmountUsd: 100000 }],
        rowCount: 1,
      })
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockContributeResult, currentAmountUsd: 110000, status: 'Funded' }],
        rowCount: 1,
      })

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/contribute`)
        .set('Authorization', `Bearer ${makeBackerToken()}`)
        .send({ amountUsd: 10000 })

      expect(res.status).toBe(200)
    })

    it('returns 401 when no token is provided', async () => {
      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/contribute`)
        .send({ amountUsd: 10000 })

      expect(res.status).toBe(401)
    })

    it('returns 400 when amountUsd is missing', async () => {
      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/contribute`)
        .set('Authorization', `Bearer ${makeBackerToken()}`)
        .send({})

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('INVALID_REQUEST_BODY')
    })

    it('returns 400 when amountUsd is not a positive integer', async () => {
      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/contribute`)
        .set('Authorization', `Bearer ${makeBackerToken()}`)
        .send({ amountUsd: -100 })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('INVALID_REQUEST_BODY')
    })

    it('returns 409 PROPOSAL_DEADLINE_PASSED when deadline has passed and proposal is underfunded', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [mockLiveProposalPastDeadlineUnderfunded],
        rowCount: 1,
      })
      // enforceDeadline query
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockLiveProposalPastDeadlineUnderfunded, status: 'Failed' }],
        rowCount: 1,
      })

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/contribute`)
        .set('Authorization', `Bearer ${makeBackerToken()}`)
        .send({ amountUsd: 10000 })

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('PROPOSAL_DEADLINE_PASSED')
    })

    it('returns 409 INVALID_PROPOSAL_STATE for non-Live/non-Funded proposal', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockApprovedProposalRow], rowCount: 1 })

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/contribute`)
        .set('Authorization', `Bearer ${makeBackerToken()}`)
        .send({ amountUsd: 10000 })

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('INVALID_PROPOSAL_STATE')
    })

    it('returns 422 FUNDING_CAP_EXCEEDED when contribution exceeds max cap', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockLiveProposalRow, currentAmountUsd: 490000, maxFundingCapUsd: 500000 }],
        rowCount: 1,
      })

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/contribute`)
        .set('Authorization', `Bearer ${makeBackerToken()}`)
        .send({ amountUsd: 20000 })

      expect(res.status).toBe(422)
      expect(res.body.error.code).toBe('FUNDING_CAP_EXCEEDED')
    })

    it('returns 500 on DB error during contribution', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockLiveProposalRow], rowCount: 1 })
      mockQuery.mockRejectedValueOnce(new Error('DB error'))

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/contribute`)
        .set('Authorization', `Bearer ${makeBackerToken()}`)
        .send({ amountUsd: 10000 })

      expect(res.status).toBe(500)
    })
  })

  describe('POST /v1/proposals/:id/cancel', () => {
    it('returns 200 with Cancelled status when no contributors (Branch A)', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockLiveProposalNoContributors], rowCount: 1 })
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockLiveProposalNoContributors, status: 'Cancelled' }],
        rowCount: 1,
      })

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/cancel`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('status', 'Cancelled')
    })

    it('returns 202 requesting admin approval when contributors exist (Branch B)', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockLiveProposalRow], rowCount: 1 })
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockLiveProposalRow, cancellationRequestedAt: new Date() }],
        rowCount: 1,
      })

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/cancel`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(202)
      expect(res.body.data).toHaveProperty('message')
    })

    it('returns 401 when no token is provided', async () => {
      const res = await request(app).post(`/v1/proposals/${TEST_UUID}/cancel`)

      expect(res.status).toBe(401)
    })

    it('returns 403 when role is not Creator or Administrator', async () => {
      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/cancel`)
        .set('Authorization', `Bearer ${makeBackerToken()}`)

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 403 when Creator does not own the proposal', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockLiveProposalRow, creatorId: OTHER_CREATOR_UUID }],
        rowCount: 1,
      })

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/cancel`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 409 INVALID_PROPOSAL_STATE when proposal is not Live', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockApprovedProposalRow], rowCount: 1 })

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/cancel`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('INVALID_PROPOSAL_STATE')
    })

    it('returns 409 CANCELLATION_ALREADY_REQUESTED when cancellation is pending', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [mockLiveProposalCancellationRequested],
        rowCount: 1,
      })

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/cancel`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('CANCELLATION_ALREADY_REQUESTED')
    })

    it('returns 500 on DB error during cancel', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockLiveProposalNoContributors], rowCount: 1 })
      mockQuery.mockRejectedValueOnce(new Error('DB error'))

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/cancel`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(500)
    })
  })

  describe('POST /v1/proposals/:id/approve-cancel', () => {
    it('returns 200 with Cancelled status on success', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [mockLiveProposalCancellationRequested],
        rowCount: 1,
      })
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            ...mockLiveProposalCancellationRequested,
            status: 'Cancelled',
            cancellationRequestedAt: null,
          },
        ],
        rowCount: 1,
      })

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/approve-cancel`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('status', 'Cancelled')
    })

    it('returns 401 when no token is provided', async () => {
      const res = await request(app).post(`/v1/proposals/${TEST_UUID}/approve-cancel`)

      expect(res.status).toBe(401)
    })

    it('returns 403 when role is not Administrator', async () => {
      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/approve-cancel`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 409 NO_PENDING_CANCELLATION when no cancellation is requested', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockLiveProposalRow], rowCount: 1 })

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/approve-cancel`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('NO_PENDING_CANCELLATION')
    })

    it('returns 409 NO_PENDING_CANCELLATION when proposal is not Live', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockApprovedProposalRow, cancellationRequestedAt: new Date() }],
        rowCount: 1,
      })

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/approve-cancel`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('NO_PENDING_CANCELLATION')
    })

    it('returns 500 on DB error during approveCancellation', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [mockLiveProposalCancellationRequested],
        rowCount: 1,
      })
      mockQuery.mockRejectedValueOnce(new Error('DB error'))

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/approve-cancel`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)

      expect(res.status).toBe(500)
    })
  })

  describe('POST /v1/proposals/:id/enforce-deadline', () => {
    it('returns 200 with Failed status when proposal is underfunded (Branch A)', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [mockLiveProposalPastDeadlineUnderfunded],
        rowCount: 1,
      })
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockLiveProposalPastDeadlineUnderfunded, status: 'Failed' }],
        rowCount: 1,
      })

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/enforce-deadline`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('status', 'Failed')
    })

    it('returns 200 with no enforcement when proposal is funded (Branch B)', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [mockLiveProposalPastDeadlineFunded],
        rowCount: 1,
      })

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/enforce-deadline`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('message', 'No enforcement needed.')
    })

    it('returns 401 when no token is provided', async () => {
      const res = await request(app).post(`/v1/proposals/${TEST_UUID}/enforce-deadline`)

      expect(res.status).toBe(401)
    })

    it('returns 403 when role is not Administrator', async () => {
      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/enforce-deadline`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 409 INVALID_PROPOSAL_STATE when proposal is not Live', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockApprovedProposalRow], rowCount: 1 })

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/enforce-deadline`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('INVALID_PROPOSAL_STATE')
    })

    it('returns 409 DEADLINE_NOT_PASSED when deadline is null', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockLiveProposalRow], rowCount: 1 })

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/enforce-deadline`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('DEADLINE_NOT_PASSED')
    })

    it('returns 409 DEADLINE_NOT_PASSED when deadline is in the future', async () => {
      const futureDeadline = new Date(Date.now() + 86400000) // tomorrow
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockLiveProposalRow, deadline: futureDeadline }],
        rowCount: 1,
      })

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/enforce-deadline`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('DEADLINE_NOT_PASSED')
    })

    it('returns 500 on DB error during enforceDeadline', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [mockLiveProposalPastDeadlineUnderfunded],
        rowCount: 1,
      })
      mockQuery.mockRejectedValueOnce(new Error('DB error'))

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/enforce-deadline`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)

      expect(res.status).toBe(500)
    })
  })

  describe('POST /v1/proposals/:id/settle', () => {
    it('returns 200 with Settlement status on success (Administrator)', async () => {
      mockGetProposalWithStatus('Funded')
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // settleProposal
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // insertAuditLog

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/settle`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toEqual({ id: TEST_UUID, status: 'Settlement' })
    })

    it('returns 200 for SuperAdministrator role', async () => {
      mockGetProposalWithStatus('Funded')
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/settle`)
        .set('Authorization', `Bearer ${makeToken('SuperAdministrator')}`)

      expect(res.status).toBe(200)
    })

    it('returns 401 when no token provided', async () => {
      const res = await request(app).post(`/v1/proposals/${TEST_UUID}/settle`)

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    it('returns 403 for Creator role', async () => {
      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/settle`)
        .set('Authorization', `Bearer ${makeToken('Creator')}`)

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 404 when proposal not found', async () => {
      mockGetProposalNotFound()

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/settle`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)

      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('PROPOSAL_NOT_FOUND')
    })

    it('returns 409 when proposal is not in Funded status', async () => {
      mockGetProposalWithStatus('Live')

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/settle`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('INVALID_PROPOSAL_STATE')
    })
  })

  describe('POST /v1/proposals/:id/milestones/:mid/submit-evidence', () => {
    const validBody = {
      evidenceDescription: 'Phase 1 completed successfully',
      evidenceUrl: 'https://example.com/evidence',
    }

    it('returns 200 with Submitted status on success (Pending milestone)', async () => {
      mockGetProposalWithStatus('Settlement', [mockMilestonePending])
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // submitMilestoneEvidence
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // insertAuditLog

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/submit-evidence`)
        .set('Authorization', `Bearer ${makeToken('Creator')}`)
        .send(validBody)

      expect(res.status).toBe(200)
      expect(res.body.data).toEqual({ id: TEST_MILESTONE_UUID, status: 'Submitted' })
    })

    it('returns 200 on success with Returned milestone', async () => {
      mockGetProposalWithStatus('Settlement', [{ ...mockMilestonePending, status: 'Returned' }])
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/submit-evidence`)
        .set('Authorization', `Bearer ${makeToken('Creator')}`)
        .send(validBody)

      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('Submitted')
    })

    it('returns 401 when no token provided', async () => {
      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/submit-evidence`)
        .send(validBody)

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    it('returns 403 for Administrator role', async () => {
      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/submit-evidence`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)
        .send(validBody)

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 404 when proposal not found', async () => {
      mockGetProposalNotFound()

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/submit-evidence`)
        .set('Authorization', `Bearer ${makeToken('Creator')}`)
        .send(validBody)

      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('PROPOSAL_NOT_FOUND')
    })

    it('returns 409 when proposal is not in Settlement status', async () => {
      mockGetProposalWithStatus('Live')

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/submit-evidence`)
        .set('Authorization', `Bearer ${makeToken('Creator')}`)
        .send(validBody)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('INVALID_PROPOSAL_STATE')
    })

    it('returns 404 when milestone not found', async () => {
      mockGetProposalWithStatus('Settlement', [])

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/submit-evidence`)
        .set('Authorization', `Bearer ${makeToken('Creator')}`)
        .send(validBody)

      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('MILESTONE_NOT_FOUND')
    })

    it('returns 409 when milestone is not in Pending or Returned status', async () => {
      mockGetProposalWithStatus('Settlement', [{ ...mockMilestonePending, status: 'Verified' }])

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/submit-evidence`)
        .set('Authorization', `Bearer ${makeToken('Creator')}`)
        .send(validBody)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('INVALID_MILESTONE_STATE')
    })

    it('returns 422 when evidenceDescription is missing', async () => {
      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/submit-evidence`)
        .set('Authorization', `Bearer ${makeToken('Creator')}`)
        .send({ evidenceUrl: 'https://example.com' })

      expect(res.status).toBe(422)
      expect(res.body.error.code).toBe('INVALID_BODY')
    })
  })

  describe('POST /v1/proposals/:id/milestones/:mid/verify', () => {
    it('returns 200 with proposalComplete: false when other milestones remain', async () => {
      mockGetProposalWithStatus('Settlement', [{ ...mockMilestonePending, status: 'Submitted' }])
      // verifyMilestone uses pool.connect() — mock the transaction client queries
      mockClientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
      mockClientQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE milestone
      mockClientQuery.mockResolvedValueOnce({ rows: [{ unverified_count: '1' }], rowCount: 1 }) // SELECT COUNT
      mockClientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // COMMIT
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // insertAuditLog (milestone.verified)

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/verify`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toEqual({
        id: TEST_MILESTONE_UUID,
        status: 'Verified',
        proposalComplete: false,
      })
    })

    it('returns 200 with proposalComplete: true when all milestones are now verified', async () => {
      mockGetProposalWithStatus('Settlement', [{ ...mockMilestonePending, status: 'Submitted' }])
      mockClientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
      mockClientQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE milestone
      mockClientQuery.mockResolvedValueOnce({ rows: [{ unverified_count: '0' }], rowCount: 1 }) // SELECT COUNT (all done)
      mockClientQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE proposals SET status='Complete'
      mockClientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // COMMIT
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // insertAuditLog (milestone.verified)
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // insertAuditLog (proposal.completed)

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/verify`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)

      expect(res.status).toBe(200)
      expect(res.body.data.proposalComplete).toBe(true)
    })

    it('returns 200 for SuperAdministrator role', async () => {
      mockGetProposalWithStatus('Settlement', [{ ...mockMilestonePending, status: 'Submitted' }])
      mockClientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
      mockClientQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE milestone
      mockClientQuery.mockResolvedValueOnce({ rows: [{ unverified_count: '1' }], rowCount: 1 }) // SELECT COUNT
      mockClientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // COMMIT
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // insertAuditLog

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/verify`)
        .set('Authorization', `Bearer ${makeToken('SuperAdministrator')}`)

      expect(res.status).toBe(200)
    })

    it('returns 401 when no token provided', async () => {
      const res = await request(app).post(
        `/v1/proposals/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/verify`
      )

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    it('returns 403 for Creator role', async () => {
      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/verify`)
        .set('Authorization', `Bearer ${makeToken('Creator')}`)

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 404 when proposal not found', async () => {
      mockGetProposalNotFound()

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/verify`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)

      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('PROPOSAL_NOT_FOUND')
    })

    it('returns 409 when proposal is not in Settlement status', async () => {
      mockGetProposalWithStatus('Live')

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/verify`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('INVALID_PROPOSAL_STATE')
    })

    it('returns 404 when milestone not found', async () => {
      mockGetProposalWithStatus('Settlement', [])

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/verify`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)

      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('MILESTONE_NOT_FOUND')
    })

    it('returns 409 when milestone is not in Submitted status', async () => {
      mockGetProposalWithStatus('Settlement', [mockMilestonePending]) // status: 'Pending'

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/verify`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('INVALID_MILESTONE_STATE')
    })
  })

  describe('POST /v1/proposals/:id/milestones/:mid/return', () => {
    const validBody = { feedback: 'Please provide more detailed documentation' }

    it('returns 200 with Returned status on success', async () => {
      mockGetProposalWithStatus('Settlement', [{ ...mockMilestonePending, status: 'Submitted' }])
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // returnMilestone
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // insertAuditLog

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/return`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)
        .send(validBody)

      expect(res.status).toBe(200)
      expect(res.body.data).toEqual({ id: TEST_MILESTONE_UUID, status: 'Returned' })
    })

    it('returns 401 when no token provided', async () => {
      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/return`)
        .send(validBody)

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    it('returns 403 for Creator role', async () => {
      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/return`)
        .set('Authorization', `Bearer ${makeToken('Creator')}`)
        .send(validBody)

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 404 when proposal not found', async () => {
      mockGetProposalNotFound()

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/return`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)
        .send(validBody)

      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('PROPOSAL_NOT_FOUND')
    })

    it('returns 409 when proposal is not in Settlement status', async () => {
      mockGetProposalWithStatus('Live')

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/return`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)
        .send(validBody)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('INVALID_PROPOSAL_STATE')
    })

    it('returns 404 when milestone not found', async () => {
      mockGetProposalWithStatus('Settlement', [])

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/return`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)
        .send(validBody)

      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('MILESTONE_NOT_FOUND')
    })

    it('returns 409 when milestone is not in Submitted status', async () => {
      mockGetProposalWithStatus('Settlement', [mockMilestonePending]) // Pending, not Submitted

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/return`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)
        .send(validBody)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('INVALID_MILESTONE_STATE')
    })

    it('returns 422 when feedback is missing', async () => {
      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/return`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)
        .send({})

      expect(res.status).toBe(422)
      expect(res.body.error.code).toBe('INVALID_BODY')
    })
  })

  describe('POST /v1/proposals/:id/cancel (settlement)', () => {
    it('returns 200 with Cancelled status on success (Administrator)', async () => {
      mockGetProposalWithStatus('Settlement')
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // cancelSettlement
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // insertAuditLog

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/cancel`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toEqual({ id: TEST_UUID, status: 'Cancelled' })
    })

    it('returns 200 for SuperAdministrator role', async () => {
      mockGetProposalWithStatus('Settlement')
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/cancel`)
        .set('Authorization', `Bearer ${makeToken('SuperAdministrator')}`)

      expect(res.status).toBe(200)
    })

    it('returns 401 when no token provided (settlement cancel)', async () => {
      const res = await request(app).post(`/v1/proposals/${TEST_UUID}/cancel`)

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    it('returns 403 for Backer role (settlement cancel)', async () => {
      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/cancel`)
        .set('Authorization', `Bearer ${makeToken('Backer')}`)

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 404 when proposal not found (settlement cancel)', async () => {
      mockGetProposalNotFound()

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/cancel`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)

      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('PROPOSAL_NOT_FOUND')
    })

    it('returns 409 when proposal is not in Settlement status (settlement cancel)', async () => {
      mockGetProposalWithStatus('Funded')

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/cancel`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('INVALID_PROPOSAL_STATE')
    })
  })
})

const TEST_CREATOR_ID = CREATOR_UUID

// Returns a valid proposal row for submitProposal's SELECT query (snake_case columns)
function makeSubmitProposalRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const futureDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  return {
    id: TEST_UUID,
    creator_id: TEST_CREATOR_ID,
    status: 'Draft',
    title: 'Mars Habitat Project',
    summary: 'Building a habitat on Mars',
    description: 'Detailed description of the project',
    alignment_statement: 'Aligned with Mars colonization goals',
    min_funding_target_usd: 2_000_000,
    max_funding_cap_usd: 5_000_000,
    deadline: futureDeadline,
    risk_disclosures: ['Risk of mission failure'],
    ...overrides,
  }
}

// Sets up the 5 pool.query calls that getProposalById makes
function mockGetProposalById(): void {
  mockQuery.mockResolvedValueOnce({ rows: [mockProposalRow], rowCount: 1 }) // proposal
  mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // milestones
  mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // stretch goals
  mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // team members
  mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // updates
}

describe('Proposal Write Endpoints', () => {
  beforeEach(() => {
    mockQuery.mockReset()
    vi.stubEnv('JWT_SECRET', TEST_JWT_SECRET)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('POST /v1/proposals', () => {
    it('returns 201 with proposal data on success', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: TEST_UUID }], rowCount: 1 }) // INSERT proposal
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // INSERT audit event
      mockGetProposalById()

      const res = await request(app)
        .post('/v1/proposals')
        .set('Authorization', `Bearer ${makeCreatorToken()}`)
        .send({ title: 'Mars Habitat Project', category: 'Habitats & Construction' })

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('data')
      expect(res.body.data.id).toBe(TEST_UUID)
    })

    it('returns 400 INVALID_REQUEST_BODY when body is invalid', async () => {
      const res = await request(app)
        .post('/v1/proposals')
        .set('Authorization', `Bearer ${makeCreatorToken()}`)
        .send({ title: '' }) // title fails min(1), category missing

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('INVALID_REQUEST_BODY')
    })

    it('returns 401 UNAUTHORIZED when no token provided', async () => {
      const res = await request(app)
        .post('/v1/proposals')
        .send({ title: 'Test', category: 'Propulsion' })

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    it('returns 403 FORBIDDEN when caller is not Creator role', async () => {
      const res = await request(app)
        .post('/v1/proposals')
        .set('Authorization', `Bearer ${makeBackerToken()}`)
        .send({ title: 'Test', category: 'Propulsion' })

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })
  })

  describe('PUT /v1/proposals/:id', () => {
    it('returns 200 with updated proposal on success', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: TEST_UUID, creator_id: TEST_CREATOR_ID, status: 'Draft' }],
        rowCount: 1,
      }) // SELECT check
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE
      mockGetProposalById()

      const res = await request(app)
        .put(`/v1/proposals/${TEST_UUID}`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)
        .send({ title: 'Updated Title' })

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(res.body.data.id).toBe(TEST_UUID)
    })

    it('returns 400 INVALID_PROPOSAL_ID when id is not a UUID', async () => {
      const res = await request(app)
        .put('/v1/proposals/not-a-uuid')
        .set('Authorization', `Bearer ${makeCreatorToken()}`)
        .send({ title: 'Updated Title' })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('INVALID_PROPOSAL_ID')
    })

    it('returns 404 PROPOSAL_NOT_FOUND when proposal does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // SELECT check → not found

      const res = await request(app)
        .put(`/v1/proposals/${TEST_UUID}`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)
        .send({ title: 'Updated Title' })

      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('PROPOSAL_NOT_FOUND')
    })

    it('returns 403 FORBIDDEN when caller is not the proposal creator', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: TEST_UUID, creator_id: 'other-creator-id', status: 'Draft' }],
        rowCount: 1,
      })

      const res = await request(app)
        .put(`/v1/proposals/${TEST_UUID}`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)
        .send({ title: 'Updated Title' })

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 409 PROPOSAL_NOT_EDITABLE when proposal is not in Draft state', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: TEST_UUID, creator_id: TEST_CREATOR_ID, status: 'Live' }],
        rowCount: 1,
      })

      const res = await request(app)
        .put(`/v1/proposals/${TEST_UUID}`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)
        .send({ title: 'Updated Title' })

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('PROPOSAL_NOT_EDITABLE')
    })
  })

  describe('DELETE /v1/proposals/:id', () => {
    it('returns 204 with no body on success', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: TEST_UUID, creator_id: TEST_CREATOR_ID, status: 'Draft' }],
        rowCount: 1,
      }) // SELECT check
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // DELETE

      const res = await request(app)
        .delete(`/v1/proposals/${TEST_UUID}`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(204)
      expect(res.body).toEqual({})
    })

    it('returns 403 FORBIDDEN when caller is not the proposal creator', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: TEST_UUID, creator_id: 'other-creator-id', status: 'Draft' }],
        rowCount: 1,
      })

      const res = await request(app)
        .delete(`/v1/proposals/${TEST_UUID}`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 409 PROPOSAL_NOT_EDITABLE when proposal is not in Draft state', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: TEST_UUID, creator_id: TEST_CREATOR_ID, status: 'Submitted' }],
        rowCount: 1,
      })

      const res = await request(app)
        .delete(`/v1/proposals/${TEST_UUID}`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('PROPOSAL_NOT_EDITABLE')
    })
  })

  describe('POST /v1/proposals/:id/submit', () => {
    it('returns 200 with submitted proposal when all validations pass', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [makeSubmitProposalRow()], rowCount: 1 }) // SELECT proposal
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '1' }], rowCount: 1 }) // team COUNT
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '2', total_pct: '100' }], rowCount: 1 }) // milestones COUNT+SUM
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE status
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // INSERT audit event
      mockGetProposalById()

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/submit`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(res.body.data.id).toBe(TEST_UUID)
    })

    it('returns 422 SUBMISSION_VALIDATION_FAILED when milestone percentages do not sum to 100 (AC-CAMP-003)', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [makeSubmitProposalRow()], rowCount: 1 })
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '1' }], rowCount: 1 }) // team OK
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '2', total_pct: '90' }], rowCount: 1 }) // milestones sum ≠ 100

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/submit`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(422)
      expect(res.body.error.code).toBe('SUBMISSION_VALIDATION_FAILED')
      expect(Array.isArray(res.body.error.details)).toBe(true)
      expect(res.body.error.details).toContain('milestone funding percentages must sum to 100')
    })

    it('returns 422 SUBMISSION_VALIDATION_FAILED when required fields are missing (AC-CAMP-001)', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          makeSubmitProposalRow({
            title: '',
            summary: '',
            description: '',
            alignment_statement: '',
            min_funding_target_usd: 0,
            max_funding_cap_usd: 0,
            deadline: null,
            risk_disclosures: [],
          }),
        ],
        rowCount: 1,
      })
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }], rowCount: 1 }) // team missing
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '1', total_pct: '50' }], rowCount: 1 }) // milestones < 2

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/submit`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(422)
      expect(res.body.error.code).toBe('SUBMISSION_VALIDATION_FAILED')
      expect(Array.isArray(res.body.error.details)).toBe(true)
      expect(res.body.error.details.length).toBeGreaterThan(0)
    })

    it('returns 409 PROPOSAL_NOT_EDITABLE when proposal is not in Draft state', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [makeSubmitProposalRow({ status: 'Submitted' })],
        rowCount: 1,
      })

      const res = await request(app)
        .post(`/v1/proposals/${TEST_UUID}/submit`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('PROPOSAL_NOT_EDITABLE')
    })
  })

  describe('GET /v1/proposals?createdBy=me', () => {
    it('returns 200 with filtered proposals when valid token provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockProposalSummary], rowCount: 1 })

      const res = await request(app)
        .get('/v1/proposals?createdBy=me')
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data).toHaveLength(1)
    })

    it('returns 401 UNAUTHORIZED when no token provided', async () => {
      const res = await request(app).get('/v1/proposals?createdBy=me')

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })
  })
})
