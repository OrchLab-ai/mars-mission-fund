import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { createApp } from '../app.js'
import type { Pool } from 'pg'

const TEST_JWT_SECRET = 'test-jwt-secret-for-campaign-tests'

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

const mockCampaignSummary = {
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

const mockCampaignRow = {
  ...mockCampaignSummary,
  slug: 'mars-habitat-project',
  description: 'Detailed description of the Mars Habitat Project',
  alignmentStatement: 'Aligned with Mars colonization goals',
  tags: ['habitat', 'mars', 'construction'],
  maxFundingCapUsd: 1000000,
  launchedAt: new Date('2024-01-20T00:00:00.000Z'),
  updatedAt: new Date('2024-01-20T10:00:00.000Z'),
  risk_disclosures: ['habitat pressure loss'],
}

// CampaignRow shapes for new endpoint tests
const mockApprovedCampaignRow = {
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

const mockLiveCampaignRow = {
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

const mockLiveCampaignNoContributors = {
  ...mockLiveCampaignRow,
  contributorCount: 0,
}

const mockLiveCampaignCancellationRequested = {
  ...mockLiveCampaignRow,
  cancellationRequestedAt: new Date('2026-02-01T00:00:00.000Z'),
}

const mockLiveCampaignPastDeadlineUnderfunded = {
  ...mockLiveCampaignRow,
  deadline: new Date('2026-01-01T00:00:00.000Z'), // past date
  currentAmountUsd: 10000, // underfunded
}

const mockLiveCampaignPastDeadlineFunded = {
  ...mockLiveCampaignRow,
  deadline: new Date('2026-01-01T00:00:00.000Z'), // past date
  currentAmountUsd: 200000, // above min target
}

const mockLaunchResult = {
  id: TEST_UUID,
  status: 'Live',
  launchedAt: new Date('2026-03-11T00:00:00.000Z'),
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

/** Mock pool.query to return an empty campaign row (getCampaignById → null). */
function mockGetCampaignNotFound(): void {
  mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })
}

/**
 * Mock the 4 pool.query calls that getCampaignById makes:
 * campaign row, milestones, stretch goals, team members.
 */
function mockGetCampaignWithStatus(status: string, milestones: unknown[] = []): void {
  mockQuery.mockResolvedValueOnce({ rows: [{ ...mockCampaignRow, status }], rowCount: 1 })
  mockQuery.mockResolvedValueOnce({ rows: milestones, rowCount: milestones.length })
  mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })
  mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })
}

describe('Campaign Routes', () => {
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

  describe('GET /v1/campaigns', () => {
    it('returns 200 with data array when campaigns exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockCampaignSummary], rowCount: 1 })

      const res = await request(app).get('/v1/campaigns')

      expect(res.status).toBe(200)
      expect(res.headers['content-type']).toMatch(/application\/json/)
      expect(res.body).toHaveProperty('data')
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].createdBy).toBe(CREATOR_UUID)
      expect(res.headers['x-correlation-id']).toBeDefined()
    })

    it('returns 200 with filtered campaigns when status query param is valid', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockCampaignSummary], rowCount: 1 })

      const res = await request(app).get('/v1/campaigns?status=Live')

      expect(res.status).toBe(200)
      expect(res.headers['content-type']).toMatch(/application\/json/)
      expect(res.body).toHaveProperty('data')
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    it('returns 400 with INVALID_QUERY_PARAMS error when status is invalid', async () => {
      const res = await request(app).get('/v1/campaigns?status=INVALID')

      expect(res.status).toBe(400)
      expect(res.headers['content-type']).toMatch(/application\/json/)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error.code).toBe('INVALID_QUERY_PARAMS')
      expect(res.body.error).toHaveProperty('correlation_id')
      expect(res.body.error).toHaveProperty('message')
    })

    it('returns 200 with matching campaigns when search param is provided', async () => {
      const matchingCampaign = { ...mockCampaignSummary, title: 'Mars Propulsion Lab' }
      mockQuery.mockResolvedValueOnce({ rows: [matchingCampaign], rowCount: 1 })

      const res = await request(app).get('/v1/campaigns?search=Propulsion')

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].title).toBe('Mars Propulsion Lab')
    })

    it('returns 200 with campaigns filtered by single category', async () => {
      const propulsionCampaign = { ...mockCampaignSummary, category: 'Propulsion' }
      mockQuery.mockResolvedValueOnce({ rows: [propulsionCampaign], rowCount: 1 })

      const res = await request(app).get('/v1/campaigns?categories=Propulsion')

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].category).toBe('Propulsion')
    })

    it('returns 200 with campaigns filtered by multiple categories', async () => {
      const propulsionCampaign = { ...mockCampaignSummary, category: 'Propulsion' }
      const roboticsCampaign = {
        ...mockCampaignSummary,
        id: 'b2b2b2b2-e5f6-7890-abcd-ef1234567890',
        category: 'Robotics & Automation',
      }
      mockQuery.mockResolvedValueOnce({ rows: [propulsionCampaign, roboticsCampaign], rowCount: 2 })

      const res = await request(app).get(
        '/v1/campaigns?categories=Propulsion,Robotics+%26+Automation'
      )

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(2)
    })

    it('returns 200 with intersection when both search and categories are provided', async () => {
      const matchingCampaign = { ...mockCampaignSummary, category: 'Propulsion' }
      mockQuery.mockResolvedValueOnce({ rows: [matchingCampaign], rowCount: 1 })

      const res = await request(app).get('/v1/campaigns?search=Mars&categories=Propulsion')

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
    })

    it('returns 200 with empty array when filters match no campaigns', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const res = await request(app).get('/v1/campaigns?search=nonexistentterm12345')

      expect(res.status).toBe(200)
      expect(res.body.data).toEqual([])
    })
  })

  describe('GET /v1/campaigns/:id', () => {
    it('returns 200 with campaign data when found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockCampaignRow], rowCount: 1 })
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // milestones
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // stretch goals
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // team members

      const res = await request(app).get(`/v1/campaigns/${TEST_UUID}`)

      expect(res.status).toBe(200)
      expect(res.headers['content-type']).toMatch(/application\/json/)
      expect(res.body).toHaveProperty('data')
      expect(res.body.data.id).toBe(TEST_UUID)
      expect(res.body.data.createdBy).toBe(CREATOR_UUID)
      expect(res.headers['x-correlation-id']).toBeDefined()
    })

    it('returns 404 with CAMPAIGN_NOT_FOUND when campaign does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const res = await request(app).get(`/v1/campaigns/${TEST_UUID}`)

      expect(res.status).toBe(404)
      expect(res.headers['content-type']).toMatch(/application\/json/)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error.code).toBe('CAMPAIGN_NOT_FOUND')
      expect(res.body.error).toHaveProperty('correlation_id')
    })

    it('returns 400 with INVALID_CAMPAIGN_ID when ID is not a UUID', async () => {
      const res = await request(app).get('/v1/campaigns/not-a-uuid')

      expect(res.status).toBe(400)
      expect(res.headers['content-type']).toMatch(/application\/json/)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error.code).toBe('INVALID_CAMPAIGN_ID')
      expect(res.body.error).toHaveProperty('correlation_id')
    })
  })

  describe('POST /v1/campaigns/:id/launch', () => {
    it('returns 200 with launched campaign data on success', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockApprovedCampaignRow], rowCount: 1 })
      mockQuery.mockResolvedValueOnce({ rows: [mockLaunchResult], rowCount: 1 })

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/launch`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('id', TEST_UUID)
      expect(res.body.data).toHaveProperty('status', 'Live')
      expect(res.body.data).toHaveProperty('launchedAt')
    })

    it('returns 200 when campaign has null creatorId (unassigned)', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockApprovedCampaignRow, creatorId: null }],
        rowCount: 1,
      })
      mockQuery.mockResolvedValueOnce({ rows: [mockLaunchResult], rowCount: 1 })

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/launch`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(200)
    })

    it('returns 401 when no token is provided', async () => {
      const res = await request(app).post(`/v1/campaigns/${TEST_UUID}/launch`)

      expect(res.status).toBe(401)
    })

    it('returns 403 when role is not Creator', async () => {
      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/launch`)
        .set('Authorization', `Bearer ${makeBackerToken()}`)

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 403 when Creator does not own the campaign', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockApprovedCampaignRow, creatorId: OTHER_CREATOR_UUID }],
        rowCount: 1,
      })

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/launch`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 409 INVALID_CAMPAIGN_STATE when campaign is not Approved', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockLiveCampaignRow], rowCount: 1 })

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/launch`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('INVALID_CAMPAIGN_STATE')
    })

    it('returns 500 on DB error during launch', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockApprovedCampaignRow], rowCount: 1 })
      mockQuery.mockRejectedValueOnce(new Error('DB error'))

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/launch`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(500)
    })
  })

  describe('POST /v1/campaigns/:id/contribute', () => {
    it('returns 200 with updated funding data on success', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockLiveCampaignRow], rowCount: 1 })
      mockQuery.mockResolvedValueOnce({ rows: [mockContributeResult], rowCount: 1 })

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/contribute`)
        .set('Authorization', `Bearer ${makeBackerToken()}`)
        .send({ amountUsd: 10000 })

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('currentAmountUsd')
      expect(res.body.data).toHaveProperty('contributorCount')
      expect(res.body.data).toHaveProperty('status', 'Live')
    })

    it('returns 200 and transitions status to Funded when min target is met', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockLiveCampaignRow], rowCount: 1 })
      mockQuery.mockResolvedValueOnce({ rows: [mockContributeResultFunded], rowCount: 1 })

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/contribute`)
        .set('Authorization', `Bearer ${makeBackerToken()}`)
        .send({ amountUsd: 50000 })

      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('Funded')
    })

    it('returns 200 for contributions to already-Funded campaigns', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockLiveCampaignRow, status: 'Funded', currentAmountUsd: 100000 }],
        rowCount: 1,
      })
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockContributeResult, currentAmountUsd: 110000, status: 'Funded' }],
        rowCount: 1,
      })

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/contribute`)
        .set('Authorization', `Bearer ${makeBackerToken()}`)
        .send({ amountUsd: 10000 })

      expect(res.status).toBe(200)
    })

    it('returns 401 when no token is provided', async () => {
      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/contribute`)
        .send({ amountUsd: 10000 })

      expect(res.status).toBe(401)
    })

    it('returns 400 when amountUsd is missing', async () => {
      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/contribute`)
        .set('Authorization', `Bearer ${makeBackerToken()}`)
        .send({})

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('INVALID_REQUEST_BODY')
    })

    it('returns 400 when amountUsd is not a positive integer', async () => {
      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/contribute`)
        .set('Authorization', `Bearer ${makeBackerToken()}`)
        .send({ amountUsd: -100 })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('INVALID_REQUEST_BODY')
    })

    it('returns 409 CAMPAIGN_DEADLINE_PASSED when deadline has passed and campaign is underfunded', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [mockLiveCampaignPastDeadlineUnderfunded],
        rowCount: 1,
      })
      // enforceDeadline query
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockLiveCampaignPastDeadlineUnderfunded, status: 'Failed' }],
        rowCount: 1,
      })

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/contribute`)
        .set('Authorization', `Bearer ${makeBackerToken()}`)
        .send({ amountUsd: 10000 })

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('CAMPAIGN_DEADLINE_PASSED')
    })

    it('returns 409 INVALID_CAMPAIGN_STATE for non-Live/non-Funded campaign', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockApprovedCampaignRow], rowCount: 1 })

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/contribute`)
        .set('Authorization', `Bearer ${makeBackerToken()}`)
        .send({ amountUsd: 10000 })

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('INVALID_CAMPAIGN_STATE')
    })

    it('returns 422 FUNDING_CAP_EXCEEDED when contribution exceeds max cap', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockLiveCampaignRow, currentAmountUsd: 490000, maxFundingCapUsd: 500000 }],
        rowCount: 1,
      })

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/contribute`)
        .set('Authorization', `Bearer ${makeBackerToken()}`)
        .send({ amountUsd: 20000 })

      expect(res.status).toBe(422)
      expect(res.body.error.code).toBe('FUNDING_CAP_EXCEEDED')
    })

    it('returns 500 on DB error during contribution', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockLiveCampaignRow], rowCount: 1 })
      mockQuery.mockRejectedValueOnce(new Error('DB error'))

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/contribute`)
        .set('Authorization', `Bearer ${makeBackerToken()}`)
        .send({ amountUsd: 10000 })

      expect(res.status).toBe(500)
    })
  })

  describe('POST /v1/campaigns/:id/cancel', () => {
    it('returns 200 with Cancelled status when no contributors (Branch A)', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockLiveCampaignNoContributors], rowCount: 1 })
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockLiveCampaignNoContributors, status: 'Cancelled' }],
        rowCount: 1,
      })

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/cancel`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('status', 'Cancelled')
    })

    it('returns 202 requesting admin approval when contributors exist (Branch B)', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockLiveCampaignRow], rowCount: 1 })
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockLiveCampaignRow, cancellationRequestedAt: new Date() }],
        rowCount: 1,
      })

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/cancel`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(202)
      expect(res.body.data).toHaveProperty('message')
    })

    it('returns 401 when no token is provided', async () => {
      const res = await request(app).post(`/v1/campaigns/${TEST_UUID}/cancel`)

      expect(res.status).toBe(401)
    })

    it('returns 403 when role is not Creator or Administrator', async () => {
      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/cancel`)
        .set('Authorization', `Bearer ${makeBackerToken()}`)

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 403 when Creator does not own the campaign', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockLiveCampaignRow, creatorId: OTHER_CREATOR_UUID }],
        rowCount: 1,
      })

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/cancel`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 409 INVALID_CAMPAIGN_STATE when campaign is not Live', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockApprovedCampaignRow], rowCount: 1 })

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/cancel`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('INVALID_CAMPAIGN_STATE')
    })

    it('returns 409 CANCELLATION_ALREADY_REQUESTED when cancellation is pending', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [mockLiveCampaignCancellationRequested],
        rowCount: 1,
      })

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/cancel`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('CANCELLATION_ALREADY_REQUESTED')
    })

    it('returns 500 on DB error during cancel', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockLiveCampaignNoContributors], rowCount: 1 })
      mockQuery.mockRejectedValueOnce(new Error('DB error'))

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/cancel`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(500)
    })
  })

  describe('POST /v1/campaigns/:id/approve-cancel', () => {
    it('returns 200 with Cancelled status on success', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [mockLiveCampaignCancellationRequested],
        rowCount: 1,
      })
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            ...mockLiveCampaignCancellationRequested,
            status: 'Cancelled',
            cancellationRequestedAt: null,
          },
        ],
        rowCount: 1,
      })

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/approve-cancel`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('status', 'Cancelled')
    })

    it('returns 401 when no token is provided', async () => {
      const res = await request(app).post(`/v1/campaigns/${TEST_UUID}/approve-cancel`)

      expect(res.status).toBe(401)
    })

    it('returns 403 when role is not Administrator', async () => {
      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/approve-cancel`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 409 NO_PENDING_CANCELLATION when no cancellation is requested', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockLiveCampaignRow], rowCount: 1 })

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/approve-cancel`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('NO_PENDING_CANCELLATION')
    })

    it('returns 409 NO_PENDING_CANCELLATION when campaign is not Live', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockApprovedCampaignRow, cancellationRequestedAt: new Date() }],
        rowCount: 1,
      })

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/approve-cancel`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('NO_PENDING_CANCELLATION')
    })

    it('returns 500 on DB error during approveCancellation', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [mockLiveCampaignCancellationRequested],
        rowCount: 1,
      })
      mockQuery.mockRejectedValueOnce(new Error('DB error'))

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/approve-cancel`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)

      expect(res.status).toBe(500)
    })
  })

  describe('POST /v1/campaigns/:id/enforce-deadline', () => {
    it('returns 200 with Failed status when campaign is underfunded (Branch A)', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [mockLiveCampaignPastDeadlineUnderfunded],
        rowCount: 1,
      })
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockLiveCampaignPastDeadlineUnderfunded, status: 'Failed' }],
        rowCount: 1,
      })

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/enforce-deadline`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('status', 'Failed')
    })

    it('returns 200 with no enforcement when campaign is funded (Branch B)', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [mockLiveCampaignPastDeadlineFunded],
        rowCount: 1,
      })

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/enforce-deadline`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('message', 'No enforcement needed.')
    })

    it('returns 401 when no token is provided', async () => {
      const res = await request(app).post(`/v1/campaigns/${TEST_UUID}/enforce-deadline`)

      expect(res.status).toBe(401)
    })

    it('returns 403 when role is not Administrator', async () => {
      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/enforce-deadline`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 409 INVALID_CAMPAIGN_STATE when campaign is not Live', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockApprovedCampaignRow], rowCount: 1 })

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/enforce-deadline`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('INVALID_CAMPAIGN_STATE')
    })

    it('returns 409 DEADLINE_NOT_PASSED when deadline is null', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockLiveCampaignRow], rowCount: 1 })

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/enforce-deadline`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('DEADLINE_NOT_PASSED')
    })

    it('returns 409 DEADLINE_NOT_PASSED when deadline is in the future', async () => {
      const futureDeadline = new Date(Date.now() + 86400000) // tomorrow
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockLiveCampaignRow, deadline: futureDeadline }],
        rowCount: 1,
      })

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/enforce-deadline`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('DEADLINE_NOT_PASSED')
    })

    it('returns 500 on DB error during enforceDeadline', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [mockLiveCampaignPastDeadlineUnderfunded],
        rowCount: 1,
      })
      mockQuery.mockRejectedValueOnce(new Error('DB error'))

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/enforce-deadline`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)

      expect(res.status).toBe(500)
    })
  })

  describe('POST /v1/campaigns/:id/settle', () => {
    it('returns 200 with Settlement status on success (Administrator)', async () => {
      mockGetCampaignWithStatus('Funded')
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // settleCampaign
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // insertAuditLog

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/settle`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toEqual({ id: TEST_UUID, status: 'Settlement' })
    })

    it('returns 200 for SuperAdministrator role', async () => {
      mockGetCampaignWithStatus('Funded')
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/settle`)
        .set('Authorization', `Bearer ${makeToken('SuperAdministrator')}`)

      expect(res.status).toBe(200)
    })

    it('returns 401 when no token provided', async () => {
      const res = await request(app).post(`/v1/campaigns/${TEST_UUID}/settle`)

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    it('returns 403 for Creator role', async () => {
      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/settle`)
        .set('Authorization', `Bearer ${makeToken('Creator')}`)

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 404 when campaign not found', async () => {
      mockGetCampaignNotFound()

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/settle`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)

      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('CAMPAIGN_NOT_FOUND')
    })

    it('returns 409 when campaign is not in Funded status', async () => {
      mockGetCampaignWithStatus('Live')

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/settle`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('INVALID_CAMPAIGN_STATE')
    })
  })

  describe('POST /v1/campaigns/:id/milestones/:mid/submit-evidence', () => {
    const validBody = {
      evidenceDescription: 'Phase 1 completed successfully',
      evidenceUrl: 'https://example.com/evidence',
    }

    it('returns 200 with Submitted status on success (Pending milestone)', async () => {
      mockGetCampaignWithStatus('Settlement', [mockMilestonePending])
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // submitMilestoneEvidence
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // insertAuditLog

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/submit-evidence`)
        .set('Authorization', `Bearer ${makeToken('Creator')}`)
        .send(validBody)

      expect(res.status).toBe(200)
      expect(res.body.data).toEqual({ id: TEST_MILESTONE_UUID, status: 'Submitted' })
    })

    it('returns 200 on success with Returned milestone', async () => {
      mockGetCampaignWithStatus('Settlement', [{ ...mockMilestonePending, status: 'Returned' }])
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/submit-evidence`)
        .set('Authorization', `Bearer ${makeToken('Creator')}`)
        .send(validBody)

      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('Submitted')
    })

    it('returns 401 when no token provided', async () => {
      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/submit-evidence`)
        .send(validBody)

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    it('returns 403 for Administrator role', async () => {
      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/submit-evidence`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)
        .send(validBody)

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 404 when campaign not found', async () => {
      mockGetCampaignNotFound()

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/submit-evidence`)
        .set('Authorization', `Bearer ${makeToken('Creator')}`)
        .send(validBody)

      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('CAMPAIGN_NOT_FOUND')
    })

    it('returns 409 when campaign is not in Settlement status', async () => {
      mockGetCampaignWithStatus('Live')

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/submit-evidence`)
        .set('Authorization', `Bearer ${makeToken('Creator')}`)
        .send(validBody)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('INVALID_CAMPAIGN_STATE')
    })

    it('returns 404 when milestone not found', async () => {
      mockGetCampaignWithStatus('Settlement', [])

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/submit-evidence`)
        .set('Authorization', `Bearer ${makeToken('Creator')}`)
        .send(validBody)

      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('MILESTONE_NOT_FOUND')
    })

    it('returns 409 when milestone is not in Pending or Returned status', async () => {
      mockGetCampaignWithStatus('Settlement', [{ ...mockMilestonePending, status: 'Verified' }])

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/submit-evidence`)
        .set('Authorization', `Bearer ${makeToken('Creator')}`)
        .send(validBody)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('INVALID_MILESTONE_STATE')
    })

    it('returns 422 when evidenceDescription is missing', async () => {
      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/submit-evidence`)
        .set('Authorization', `Bearer ${makeToken('Creator')}`)
        .send({ evidenceUrl: 'https://example.com' })

      expect(res.status).toBe(422)
      expect(res.body.error.code).toBe('INVALID_BODY')
    })
  })

  describe('POST /v1/campaigns/:id/milestones/:mid/verify', () => {
    it('returns 200 with campaignComplete: false when other milestones remain', async () => {
      mockGetCampaignWithStatus('Settlement', [{ ...mockMilestonePending, status: 'Submitted' }])
      // verifyMilestone uses pool.connect() — mock the transaction client queries
      mockClientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
      mockClientQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE milestone
      mockClientQuery.mockResolvedValueOnce({ rows: [{ unverified_count: '1' }], rowCount: 1 }) // SELECT COUNT
      mockClientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // COMMIT
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // insertAuditLog (milestone.verified)

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/verify`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toEqual({
        id: TEST_MILESTONE_UUID,
        status: 'Verified',
        campaignComplete: false,
      })
    })

    it('returns 200 with campaignComplete: true when all milestones are now verified', async () => {
      mockGetCampaignWithStatus('Settlement', [{ ...mockMilestonePending, status: 'Submitted' }])
      mockClientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
      mockClientQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE milestone
      mockClientQuery.mockResolvedValueOnce({ rows: [{ unverified_count: '0' }], rowCount: 1 }) // SELECT COUNT (all done)
      mockClientQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE campaigns SET status='Complete'
      mockClientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // COMMIT
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // insertAuditLog (milestone.verified)
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // insertAuditLog (campaign.completed)

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/verify`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)

      expect(res.status).toBe(200)
      expect(res.body.data.campaignComplete).toBe(true)
    })

    it('returns 200 for SuperAdministrator role', async () => {
      mockGetCampaignWithStatus('Settlement', [{ ...mockMilestonePending, status: 'Submitted' }])
      mockClientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
      mockClientQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE milestone
      mockClientQuery.mockResolvedValueOnce({ rows: [{ unverified_count: '1' }], rowCount: 1 }) // SELECT COUNT
      mockClientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // COMMIT
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // insertAuditLog

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/verify`)
        .set('Authorization', `Bearer ${makeToken('SuperAdministrator')}`)

      expect(res.status).toBe(200)
    })

    it('returns 401 when no token provided', async () => {
      const res = await request(app).post(
        `/v1/campaigns/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/verify`
      )

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    it('returns 403 for Creator role', async () => {
      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/verify`)
        .set('Authorization', `Bearer ${makeToken('Creator')}`)

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 404 when campaign not found', async () => {
      mockGetCampaignNotFound()

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/verify`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)

      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('CAMPAIGN_NOT_FOUND')
    })

    it('returns 409 when campaign is not in Settlement status', async () => {
      mockGetCampaignWithStatus('Live')

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/verify`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('INVALID_CAMPAIGN_STATE')
    })

    it('returns 404 when milestone not found', async () => {
      mockGetCampaignWithStatus('Settlement', [])

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/verify`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)

      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('MILESTONE_NOT_FOUND')
    })

    it('returns 409 when milestone is not in Submitted status', async () => {
      mockGetCampaignWithStatus('Settlement', [mockMilestonePending]) // status: 'Pending'

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/verify`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('INVALID_MILESTONE_STATE')
    })
  })

  describe('POST /v1/campaigns/:id/milestones/:mid/return', () => {
    const validBody = { feedback: 'Please provide more detailed documentation' }

    it('returns 200 with Returned status on success', async () => {
      mockGetCampaignWithStatus('Settlement', [{ ...mockMilestonePending, status: 'Submitted' }])
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // returnMilestone
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // insertAuditLog

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/return`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)
        .send(validBody)

      expect(res.status).toBe(200)
      expect(res.body.data).toEqual({ id: TEST_MILESTONE_UUID, status: 'Returned' })
    })

    it('returns 401 when no token provided', async () => {
      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/return`)
        .send(validBody)

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    it('returns 403 for Creator role', async () => {
      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/return`)
        .set('Authorization', `Bearer ${makeToken('Creator')}`)
        .send(validBody)

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 404 when campaign not found', async () => {
      mockGetCampaignNotFound()

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/return`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)
        .send(validBody)

      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('CAMPAIGN_NOT_FOUND')
    })

    it('returns 409 when campaign is not in Settlement status', async () => {
      mockGetCampaignWithStatus('Live')

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/return`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)
        .send(validBody)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('INVALID_CAMPAIGN_STATE')
    })

    it('returns 404 when milestone not found', async () => {
      mockGetCampaignWithStatus('Settlement', [])

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/return`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)
        .send(validBody)

      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('MILESTONE_NOT_FOUND')
    })

    it('returns 409 when milestone is not in Submitted status', async () => {
      mockGetCampaignWithStatus('Settlement', [mockMilestonePending]) // Pending, not Submitted

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/return`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)
        .send(validBody)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('INVALID_MILESTONE_STATE')
    })

    it('returns 422 when feedback is missing', async () => {
      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/milestones/${TEST_MILESTONE_UUID}/return`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)
        .send({})

      expect(res.status).toBe(422)
      expect(res.body.error.code).toBe('INVALID_BODY')
    })
  })

  describe('POST /v1/campaigns/:id/cancel (settlement)', () => {
    it('returns 200 with Cancelled status on success (Administrator)', async () => {
      mockGetCampaignWithStatus('Settlement')
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // cancelSettlement
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // insertAuditLog

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/cancel`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toEqual({ id: TEST_UUID, status: 'Cancelled' })
    })

    it('returns 200 for SuperAdministrator role', async () => {
      mockGetCampaignWithStatus('Settlement')
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/cancel`)
        .set('Authorization', `Bearer ${makeToken('SuperAdministrator')}`)

      expect(res.status).toBe(200)
    })

    it('returns 401 when no token provided (settlement cancel)', async () => {
      const res = await request(app).post(`/v1/campaigns/${TEST_UUID}/cancel`)

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    it('returns 403 for Backer role (settlement cancel)', async () => {
      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/cancel`)
        .set('Authorization', `Bearer ${makeToken('Backer')}`)

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 404 when campaign not found (settlement cancel)', async () => {
      mockGetCampaignNotFound()

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/cancel`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)

      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('CAMPAIGN_NOT_FOUND')
    })

    it('returns 409 when campaign is not in Settlement status (settlement cancel)', async () => {
      mockGetCampaignWithStatus('Funded')

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/cancel`)
        .set('Authorization', `Bearer ${makeToken('Administrator')}`)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('INVALID_CAMPAIGN_STATE')
    })
  })
})

const TEST_CREATOR_ID = CREATOR_UUID

// Returns a valid campaign row for submitCampaign's SELECT query (snake_case columns)
function makeSubmitCampaignRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
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

// Sets up the 4 pool.query calls that getCampaignById makes
function mockGetCampaignById(): void {
  mockQuery.mockResolvedValueOnce({ rows: [mockCampaignRow], rowCount: 1 }) // campaign
  mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // milestones
  mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // stretch goals
  mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // team members
}

describe('Campaign Write Endpoints', () => {
  beforeEach(() => {
    mockQuery.mockReset()
    vi.stubEnv('JWT_SECRET', TEST_JWT_SECRET)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('POST /v1/campaigns', () => {
    it('returns 201 with campaign data on success', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: TEST_UUID }], rowCount: 1 }) // INSERT campaign
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // INSERT audit event
      mockGetCampaignById()

      const res = await request(app)
        .post('/v1/campaigns')
        .set('Authorization', `Bearer ${makeCreatorToken()}`)
        .send({ title: 'Mars Habitat Project', category: 'Habitats & Construction' })

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('data')
      expect(res.body.data.id).toBe(TEST_UUID)
    })

    it('returns 400 INVALID_REQUEST_BODY when body is invalid', async () => {
      const res = await request(app)
        .post('/v1/campaigns')
        .set('Authorization', `Bearer ${makeCreatorToken()}`)
        .send({ title: '' }) // title fails min(1), category missing

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('INVALID_REQUEST_BODY')
    })

    it('returns 401 UNAUTHORIZED when no token provided', async () => {
      const res = await request(app)
        .post('/v1/campaigns')
        .send({ title: 'Test', category: 'Propulsion' })

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    it('returns 403 FORBIDDEN when caller is not Creator role', async () => {
      const res = await request(app)
        .post('/v1/campaigns')
        .set('Authorization', `Bearer ${makeBackerToken()}`)
        .send({ title: 'Test', category: 'Propulsion' })

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })
  })

  describe('PUT /v1/campaigns/:id', () => {
    it('returns 200 with updated campaign on success', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: TEST_UUID, creator_id: TEST_CREATOR_ID, status: 'Draft' }],
        rowCount: 1,
      }) // SELECT check
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE
      mockGetCampaignById()

      const res = await request(app)
        .put(`/v1/campaigns/${TEST_UUID}`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)
        .send({ title: 'Updated Title' })

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(res.body.data.id).toBe(TEST_UUID)
    })

    it('returns 400 INVALID_CAMPAIGN_ID when id is not a UUID', async () => {
      const res = await request(app)
        .put('/v1/campaigns/not-a-uuid')
        .set('Authorization', `Bearer ${makeCreatorToken()}`)
        .send({ title: 'Updated Title' })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('INVALID_CAMPAIGN_ID')
    })

    it('returns 404 CAMPAIGN_NOT_FOUND when campaign does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // SELECT check → not found

      const res = await request(app)
        .put(`/v1/campaigns/${TEST_UUID}`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)
        .send({ title: 'Updated Title' })

      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('CAMPAIGN_NOT_FOUND')
    })

    it('returns 403 FORBIDDEN when caller is not the campaign creator', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: TEST_UUID, creator_id: 'other-creator-id', status: 'Draft' }],
        rowCount: 1,
      })

      const res = await request(app)
        .put(`/v1/campaigns/${TEST_UUID}`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)
        .send({ title: 'Updated Title' })

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 409 CAMPAIGN_NOT_EDITABLE when campaign is not in Draft state', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: TEST_UUID, creator_id: TEST_CREATOR_ID, status: 'Live' }],
        rowCount: 1,
      })

      const res = await request(app)
        .put(`/v1/campaigns/${TEST_UUID}`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)
        .send({ title: 'Updated Title' })

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('CAMPAIGN_NOT_EDITABLE')
    })
  })

  describe('DELETE /v1/campaigns/:id', () => {
    it('returns 204 with no body on success', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: TEST_UUID, creator_id: TEST_CREATOR_ID, status: 'Draft' }],
        rowCount: 1,
      }) // SELECT check
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // DELETE

      const res = await request(app)
        .delete(`/v1/campaigns/${TEST_UUID}`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(204)
      expect(res.body).toEqual({})
    })

    it('returns 403 FORBIDDEN when caller is not the campaign creator', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: TEST_UUID, creator_id: 'other-creator-id', status: 'Draft' }],
        rowCount: 1,
      })

      const res = await request(app)
        .delete(`/v1/campaigns/${TEST_UUID}`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 409 CAMPAIGN_NOT_EDITABLE when campaign is not in Draft state', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: TEST_UUID, creator_id: TEST_CREATOR_ID, status: 'Submitted' }],
        rowCount: 1,
      })

      const res = await request(app)
        .delete(`/v1/campaigns/${TEST_UUID}`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('CAMPAIGN_NOT_EDITABLE')
    })
  })

  describe('POST /v1/campaigns/:id/submit', () => {
    it('returns 200 with submitted campaign when all validations pass', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [makeSubmitCampaignRow()], rowCount: 1 }) // SELECT campaign
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '1' }], rowCount: 1 }) // team COUNT
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '2', total_pct: '100' }], rowCount: 1 }) // milestones COUNT+SUM
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE status
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // INSERT audit event
      mockGetCampaignById()

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/submit`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(res.body.data.id).toBe(TEST_UUID)
    })

    it('returns 422 SUBMISSION_VALIDATION_FAILED when milestone percentages do not sum to 100 (AC-CAMP-003)', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [makeSubmitCampaignRow()], rowCount: 1 })
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '1' }], rowCount: 1 }) // team OK
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '2', total_pct: '90' }], rowCount: 1 }) // milestones sum ≠ 100

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/submit`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(422)
      expect(res.body.error.code).toBe('SUBMISSION_VALIDATION_FAILED')
      expect(Array.isArray(res.body.error.details)).toBe(true)
      expect(res.body.error.details).toContain('milestone funding percentages must sum to 100')
    })

    it('returns 422 SUBMISSION_VALIDATION_FAILED when required fields are missing (AC-CAMP-001)', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          makeSubmitCampaignRow({
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
        .post(`/v1/campaigns/${TEST_UUID}/submit`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(422)
      expect(res.body.error.code).toBe('SUBMISSION_VALIDATION_FAILED')
      expect(Array.isArray(res.body.error.details)).toBe(true)
      expect(res.body.error.details.length).toBeGreaterThan(0)
    })

    it('returns 409 CAMPAIGN_NOT_EDITABLE when campaign is not in Draft state', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [makeSubmitCampaignRow({ status: 'Submitted' })],
        rowCount: 1,
      })

      const res = await request(app)
        .post(`/v1/campaigns/${TEST_UUID}/submit`)
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('CAMPAIGN_NOT_EDITABLE')
    })
  })

  describe('GET /v1/campaigns?createdBy=me', () => {
    it('returns 200 with filtered campaigns when valid token provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockCampaignSummary], rowCount: 1 })

      const res = await request(app)
        .get('/v1/campaigns?createdBy=me')
        .set('Authorization', `Bearer ${makeCreatorToken()}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data).toHaveLength(1)
    })

    it('returns 401 UNAUTHORIZED when no token provided', async () => {
      const res = await request(app).get('/v1/campaigns?createdBy=me')

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })
  })
})
