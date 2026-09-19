import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { createApp } from '../app.js'
import type { Pool } from 'pg'

const TEST_JWT_SECRET = 'test-jwt-secret-for-review-tests'

const mockQuery = vi.fn()
const mockPool = { query: mockQuery } as unknown as Pool
const app = createApp(mockPool)

const PROPOSAL_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const REVIEWER_UUID = '44444444-4444-4444-4444-444444444444'
const CREATOR_UUID = '22222222-2222-2222-2222-222222222222'
const OTHER_UUID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901'

const baseProposalRow = {
  id: PROPOSAL_UUID,
  title: 'Mars Habitat Project',
  summary: 'Building a habitat on Mars',
  status: 'Submitted',
  category: 'Habitats & Construction',
  heroImageUrl: null,
  goalAmount: 500000,
  raisedAmount: 0,
  contributorCount: 0,
  deadline: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  slug: 'mars-habitat-project',
  description: 'Detailed description',
  alignmentStatement: 'Aligned with Mars mission',
  tags: [],
  maxFundingCapUsd: 1000000,
  launchedAt: null,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  creatorId: CREATOR_UUID,
  reviewerId: null as string | null,
}

const submittedProposalRow = { ...baseProposalRow, status: 'Submitted', reviewerId: null }
const underReviewProposalRow = {
  ...baseProposalRow,
  status: 'Under Review',
  reviewerId: REVIEWER_UUID,
}
const rejectedProposalRow = {
  ...baseProposalRow,
  status: 'Rejected',
  reviewerId: REVIEWER_UUID,
}
const approvedProposalRow = { ...baseProposalRow, status: 'Approved', reviewerId: REVIEWER_UUID }
const draftProposalRow = { ...baseProposalRow, status: 'Draft', reviewerId: null }

const mockNotificationRow = {
  id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
  userId: CREATOR_UUID,
  proposalId: PROPOSAL_UUID,
  type: 'proposal.claimed',
  title: 'Proposal Under Review',
  message: 'Your proposal is now under review.',
  read: false,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
}

function makeToken(payload: object): string {
  return jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: '8h' })
}

function reviewerToken(): string {
  return makeToken({ id: REVIEWER_UUID, email: 'reviewer@example.com', role: 'Reviewer' })
}

function creatorToken(): string {
  return makeToken({ id: CREATOR_UUID, email: 'creator@example.com', role: 'Creator' })
}

function backerToken(): string {
  return makeToken({ id: OTHER_UUID, email: 'backer@example.com', role: 'Backer' })
}

/** Mock the 5 pool.query calls made by getProposalById */
function mockGetProposalById(row: typeof baseProposalRow | null): void {
  if (row === null) {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })
    return
  }
  mockQuery.mockResolvedValueOnce({ rows: [row], rowCount: 1 })
  mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // milestones
  mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // stretch goals
  mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // team members
  mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // updates
}

describe('Review Pipeline Routes', () => {
  beforeEach(() => {
    mockQuery.mockReset()
    vi.stubEnv('JWT_SECRET', TEST_JWT_SECRET)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  // ---------------------------------------------------------------------------
  // GET /v1/proposals/review-queue
  // ---------------------------------------------------------------------------
  describe('GET /v1/proposals/review-queue', () => {
    it('returns 200 with list of submitted proposals', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [submittedProposalRow], rowCount: 1 })

      const res = await request(app)
        .get('/v1/proposals/review-queue')
        .set('Authorization', `Bearer ${reviewerToken()}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data).toHaveLength(1)
    })

    it('returns 401 when no token provided', async () => {
      const res = await request(app).get('/v1/proposals/review-queue')

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    it('returns 403 when user is not a Reviewer', async () => {
      const res = await request(app)
        .get('/v1/proposals/review-queue')
        .set('Authorization', `Bearer ${backerToken()}`)

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })
  })

  // ---------------------------------------------------------------------------
  // POST /v1/proposals/:id/claim
  // ---------------------------------------------------------------------------
  describe('POST /v1/proposals/:id/claim', () => {
    it('returns 200 with updated proposal on success', async () => {
      mockGetProposalById(submittedProposalRow)
      mockQuery.mockResolvedValueOnce({ rows: [underReviewProposalRow], rowCount: 1 }) // claimProposal
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // createAuditEvent
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // createNotification

      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/claim`)
        .set('Authorization', `Bearer ${reviewerToken()}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(res.body.data.status).toBe('Under Review')
    })

    it('returns 401 when no token provided', async () => {
      const res = await request(app).post(`/v1/proposals/${PROPOSAL_UUID}/claim`)

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    it('returns 403 when user is not a Reviewer', async () => {
      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/claim`)
        .set('Authorization', `Bearer ${backerToken()}`)

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 404 when proposal does not exist', async () => {
      mockGetProposalById(null)

      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/claim`)
        .set('Authorization', `Bearer ${reviewerToken()}`)

      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('PROPOSAL_NOT_FOUND')
    })

    it('returns 409 when proposal is not in Submitted status', async () => {
      mockGetProposalById(underReviewProposalRow)

      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/claim`)
        .set('Authorization', `Bearer ${reviewerToken()}`)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('INVALID_PROPOSAL_STATUS')
    })
  })

  // ---------------------------------------------------------------------------
  // POST /v1/proposals/:id/approve
  // ---------------------------------------------------------------------------
  describe('POST /v1/proposals/:id/approve', () => {
    it('returns 200 with updated proposal on success', async () => {
      mockGetProposalById(underReviewProposalRow)
      mockQuery.mockResolvedValueOnce({ rows: [approvedProposalRow], rowCount: 1 }) // approveProposal
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // createAuditEvent
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // createNotification

      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/approve`)
        .set('Authorization', `Bearer ${reviewerToken()}`)
        .send({ notes: 'Great proposal!' })

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(res.body.data.status).toBe('Approved')
    })

    it('returns 401 when no token provided', async () => {
      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/approve`)
        .send({ notes: 'Great proposal!' })

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    it('returns 403 when reviewer is not the assigned reviewer', async () => {
      const proposalWithOtherReviewer = { ...underReviewProposalRow, reviewerId: OTHER_UUID }
      mockGetProposalById(proposalWithOtherReviewer)

      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/approve`)
        .set('Authorization', `Bearer ${reviewerToken()}`)
        .send({ notes: 'Great proposal!' })

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 404 when proposal does not exist', async () => {
      mockGetProposalById(null)

      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/approve`)
        .set('Authorization', `Bearer ${reviewerToken()}`)
        .send({ notes: 'Great proposal!' })

      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('PROPOSAL_NOT_FOUND')
    })

    it('returns 409 when proposal is not in Under Review status', async () => {
      mockGetProposalById(submittedProposalRow)

      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/approve`)
        .set('Authorization', `Bearer ${reviewerToken()}`)
        .send({ notes: 'Great proposal!' })

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('INVALID_PROPOSAL_STATUS')
    })

    it('returns 400 when notes is missing', async () => {
      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/approve`)
        .set('Authorization', `Bearer ${reviewerToken()}`)
        .send({})

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('INVALID_REQUEST_BODY')
    })

    it('returns 400 when notes is empty string', async () => {
      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/approve`)
        .set('Authorization', `Bearer ${reviewerToken()}`)
        .send({ notes: '' })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('INVALID_REQUEST_BODY')
    })
  })

  // ---------------------------------------------------------------------------
  // POST /v1/proposals/:id/reject
  // ---------------------------------------------------------------------------
  describe('POST /v1/proposals/:id/reject', () => {
    const validRejectBody = { rationale: 'Does not meet standards', guidance: 'Improve the plan' }

    it('returns 200 with updated proposal on success', async () => {
      mockGetProposalById(underReviewProposalRow)
      mockQuery.mockResolvedValueOnce({ rows: [rejectedProposalRow], rowCount: 1 }) // rejectProposal
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // createAuditEvent
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // createNotification

      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/reject`)
        .set('Authorization', `Bearer ${reviewerToken()}`)
        .send(validRejectBody)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(res.body.data.status).toBe('Rejected')
    })

    it('returns 401 when no token provided', async () => {
      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/reject`)
        .send(validRejectBody)

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    it('returns 403 when reviewer is not the assigned reviewer', async () => {
      const proposalWithOtherReviewer = { ...underReviewProposalRow, reviewerId: OTHER_UUID }
      mockGetProposalById(proposalWithOtherReviewer)

      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/reject`)
        .set('Authorization', `Bearer ${reviewerToken()}`)
        .send(validRejectBody)

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 404 when proposal does not exist', async () => {
      mockGetProposalById(null)

      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/reject`)
        .set('Authorization', `Bearer ${reviewerToken()}`)
        .send(validRejectBody)

      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('PROPOSAL_NOT_FOUND')
    })

    it('returns 409 when proposal is not in Under Review status', async () => {
      mockGetProposalById(submittedProposalRow)

      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/reject`)
        .set('Authorization', `Bearer ${reviewerToken()}`)
        .send(validRejectBody)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('INVALID_PROPOSAL_STATUS')
    })

    it('returns 400 when rationale is missing', async () => {
      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/reject`)
        .set('Authorization', `Bearer ${reviewerToken()}`)
        .send({ guidance: 'Improve the plan' })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('INVALID_REQUEST_BODY')
    })

    it('returns 400 when guidance is missing', async () => {
      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/reject`)
        .set('Authorization', `Bearer ${reviewerToken()}`)
        .send({ rationale: 'Does not meet standards' })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('INVALID_REQUEST_BODY')
    })

    it('returns 400 when both rationale and guidance are missing', async () => {
      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/reject`)
        .set('Authorization', `Bearer ${reviewerToken()}`)
        .send({})

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('INVALID_REQUEST_BODY')
    })
  })

  // ---------------------------------------------------------------------------
  // POST /v1/proposals/:id/resubmit
  // ---------------------------------------------------------------------------
  describe('POST /v1/proposals/:id/resubmit', () => {
    it('returns 200 with updated proposal on success', async () => {
      mockGetProposalById(rejectedProposalRow)
      mockQuery.mockResolvedValueOnce({ rows: [draftProposalRow], rowCount: 1 }) // resubmitProposal
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // createAuditEvent

      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/resubmit`)
        .set('Authorization', `Bearer ${creatorToken()}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(res.body.data.status).toBe('Draft')
    })

    it('returns 401 when no token provided', async () => {
      const res = await request(app).post(`/v1/proposals/${PROPOSAL_UUID}/resubmit`)

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    it('returns 403 when user is not the proposal creator', async () => {
      const proposalWithOtherCreator = { ...rejectedProposalRow, creatorId: OTHER_UUID }
      mockGetProposalById(proposalWithOtherCreator)

      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/resubmit`)
        .set('Authorization', `Bearer ${creatorToken()}`)

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 404 when proposal does not exist', async () => {
      mockGetProposalById(null)

      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/resubmit`)
        .set('Authorization', `Bearer ${creatorToken()}`)

      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('PROPOSAL_NOT_FOUND')
    })

    it('returns 409 when proposal is not in Rejected status', async () => {
      mockGetProposalById(submittedProposalRow)

      const res = await request(app)
        .post(`/v1/proposals/${PROPOSAL_UUID}/resubmit`)
        .set('Authorization', `Bearer ${creatorToken()}`)

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('INVALID_PROPOSAL_STATUS')
    })
  })

  // ---------------------------------------------------------------------------
  // GET /v1/notifications
  // ---------------------------------------------------------------------------
  describe('GET /v1/notifications', () => {
    it('returns 200 with list of notifications for authenticated user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockNotificationRow], rowCount: 1 })

      const res = await request(app)
        .get('/v1/notifications')
        .set('Authorization', `Bearer ${creatorToken()}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data).toHaveLength(1)
    })

    it('returns 401 when no token provided', async () => {
      const res = await request(app).get('/v1/notifications')

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })
  })
})
