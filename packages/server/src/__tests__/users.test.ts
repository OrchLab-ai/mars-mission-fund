import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { createApp } from '../app.js'
import type { Pool } from 'pg'

const TEST_JWT_SECRET = 'test-jwt-secret-for-users-tests'

const mockQuery = vi.fn()
const mockPool = { query: mockQuery } as unknown as Pool
const app = createApp(mockPool)

const TEST_BACKER_ID = 'b1c2d3e4-f5a6-7890-bcde-f01234567890'
const TEST_ADMIN_ID = 'a0b1c2d3-e4f5-6789-abcd-ef0123456789'
const TEST_OTHER_ID = 'c2d3e4f5-a6b7-8901-cdef-012345678901'

function makeToken(payload: { id: string; email: string; role: string }): string {
  return jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: '8h' })
}

const backerToken = makeToken({ id: TEST_BACKER_ID, email: 'backer@example.com', role: 'Backer' })
const adminToken = makeToken({
  id: TEST_ADMIN_ID,
  email: 'admin@example.com',
  role: 'Administrator',
})

const mockBackerRow = {
  id: TEST_BACKER_ID,
  email: 'backer@example.com',
  passwordHash: '$2b$10$somehash',
  displayName: 'Test Backer',
  bio: null,
  role: 'Backer',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}

const mockAdminRow = {
  id: TEST_ADMIN_ID,
  email: 'admin@example.com',
  passwordHash: '$2b$10$somehash',
  displayName: 'Test Admin',
  bio: 'Administrator bio',
  role: 'Administrator',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}

describe('User Routes', () => {
  beforeEach(() => {
    mockQuery.mockReset()
    vi.stubEnv('JWT_SECRET', TEST_JWT_SECRET)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('GET /v1/users', () => {
    it('returns 200 with user array when authenticated as Administrator', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockBackerRow, mockAdminRow], rowCount: 2 })

      const res = await request(app).get('/v1/users').set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data).toHaveLength(2)
      expect(res.body.data[0]).not.toHaveProperty('passwordHash')
      expect(res.body.data[0]).not.toHaveProperty('password_hash')
    })

    it('returns 403 FORBIDDEN when authenticated as Backer', async () => {
      const res = await request(app).get('/v1/users').set('Authorization', `Bearer ${backerToken}`)

      expect(res.status).toBe(403)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 401 UNAUTHORIZED when no token provided', async () => {
      const res = await request(app).get('/v1/users')

      expect(res.status).toBe(401)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('GET /v1/users/:id', () => {
    it('returns 200 with user when authenticated', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockBackerRow], rowCount: 1 })

      const res = await request(app)
        .get(`/v1/users/${TEST_BACKER_ID}`)
        .set('Authorization', `Bearer ${backerToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(res.body.data.id).toBe(TEST_BACKER_ID)
      expect(res.body.data.email).toBe('backer@example.com')
      expect(res.body.data).not.toHaveProperty('passwordHash')
      expect(res.body.data).not.toHaveProperty('password_hash')
    })

    it('returns 401 UNAUTHORIZED when no token provided', async () => {
      const res = await request(app).get(`/v1/users/${TEST_BACKER_ID}`)

      expect(res.status).toBe(401)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    it('returns 404 USER_NOT_FOUND when user does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const res = await request(app)
        .get(`/v1/users/${TEST_OTHER_ID}`)
        .set('Authorization', `Bearer ${backerToken}`)

      expect(res.status).toBe(404)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error.code).toBe('USER_NOT_FOUND')
    })

    it('returns 400 when ID is not a valid UUID', async () => {
      const res = await request(app)
        .get('/v1/users/not-a-uuid')
        .set('Authorization', `Bearer ${backerToken}`)

      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
    })
  })

  describe('PATCH /v1/users/:id', () => {
    it('returns 200 with updated user when patching own profile', async () => {
      const updatedRow = { ...mockBackerRow, displayName: 'Updated Name', bio: 'New bio' }
      mockQuery.mockResolvedValueOnce({ rows: [updatedRow], rowCount: 1 })

      const res = await request(app)
        .patch(`/v1/users/${TEST_BACKER_ID}`)
        .set('Authorization', `Bearer ${backerToken}`)
        .send({ displayName: 'Updated Name', bio: 'New bio' })

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(res.body.data.displayName).toBe('Updated Name')
      expect(res.body.data.bio).toBe('New bio')
      expect(res.body.data).not.toHaveProperty('passwordHash')
      expect(res.body.data).not.toHaveProperty('password_hash')
    })

    it('returns 403 FORBIDDEN when patching another user profile', async () => {
      const res = await request(app)
        .patch(`/v1/users/${TEST_OTHER_ID}`)
        .set('Authorization', `Bearer ${backerToken}`)
        .send({ displayName: 'Hacker Name' })

      expect(res.status).toBe(403)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 401 UNAUTHORIZED when no token provided', async () => {
      const res = await request(app)
        .patch(`/v1/users/${TEST_BACKER_ID}`)
        .send({ displayName: 'Updated Name' })

      expect(res.status).toBe(401)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })
  })
})
