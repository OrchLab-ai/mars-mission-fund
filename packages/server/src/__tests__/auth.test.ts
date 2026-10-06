import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { createApp } from '../app.js'
import type { Pool } from 'pg'

const TEST_JWT_SECRET = 'test-jwt-secret-for-auth-tests'

const mockQuery = vi.fn()
const mockPool = { query: mockQuery } as unknown as Pool
const app = createApp(mockPool)

const TEST_USER_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const TEST_EMAIL = 'backer@example.com'
const TEST_PASSWORD = 'backer-demo-pass'

// Pre-compute bcrypt hash for test password (cost 10)
const TEST_PASSWORD_HASH = bcrypt.hashSync(TEST_PASSWORD, 10)

const mockAccountRow = {
  id: TEST_USER_ID,
  email: TEST_EMAIL,
  passwordHash: TEST_PASSWORD_HASH,
  displayName: 'Test Backer',
  bio: null,
  role: 'Backer',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}

function makeToken(
  payload: object = { id: TEST_USER_ID, email: TEST_EMAIL, role: 'Backer' }
): string {
  return jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: '8h' })
}

describe('Auth Routes', () => {
  beforeEach(() => {
    mockQuery.mockReset()
    vi.stubEnv('JWT_SECRET', TEST_JWT_SECRET)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('POST /v1/auth/login', () => {
    it('returns 200 with token and user on valid credentials', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockAccountRow], rowCount: 1 })

      const res = await request(app)
        .post('/v1/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(res.body.data).toHaveProperty('token')
      expect(res.body.data).toHaveProperty('user')
      expect(res.body.data.user.email).toBe(TEST_EMAIL)
      expect(res.body.data.user).not.toHaveProperty('passwordHash')
      expect(res.body.data.user).not.toHaveProperty('password_hash')

      // Verify returned token is valid
      const decoded = jwt.verify(res.body.data.token, TEST_JWT_SECRET) as {
        id: string
        email: string
        role: string
      }
      expect(decoded.id).toBe(TEST_USER_ID)
      expect(decoded.email).toBe(TEST_EMAIL)
      expect(decoded.role).toBe('Backer')
    })

    it('returns 401 INVALID_CREDENTIALS on wrong password', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockAccountRow], rowCount: 1 })

      const res = await request(app)
        .post('/v1/auth/login')
        .send({ email: TEST_EMAIL, password: 'wrong-password' })

      expect(res.status).toBe(401)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS')
    })

    it('returns 401 INVALID_CREDENTIALS on unknown email', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const res = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'nobody@example.com', password: TEST_PASSWORD })

      expect(res.status).toBe(401)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS')
    })

    it('returns 400 on invalid request body', async () => {
      const res = await request(app).post('/v1/auth/login').send({ email: 'not-an-email' })

      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
    })
  })

  describe('POST /v1/auth/logout', () => {
    it('returns 200 with message on valid token', async () => {
      const token = makeToken()

      const res = await request(app).post('/v1/auth/logout').set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(res.body.data.message).toBe('Logged out')
    })

    it('returns 401 when no token provided', async () => {
      const res = await request(app).post('/v1/auth/logout')

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    it('returns 401 when invalid token provided', async () => {
      const res = await request(app)
        .post('/v1/auth/logout')
        .set('Authorization', 'Bearer invalid.token.here')

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('GET /v1/auth/me', () => {
    it('returns 200 with user object on valid token', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockAccountRow], rowCount: 1 })

      const token = makeToken()

      const res = await request(app).get('/v1/auth/me').set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(res.body.data.id).toBe(TEST_USER_ID)
      expect(res.body.data.email).toBe(TEST_EMAIL)
      expect(res.body.data).not.toHaveProperty('passwordHash')
      expect(res.body.data).not.toHaveProperty('password_hash')
    })

    it('returns 401 when no token provided', async () => {
      const res = await request(app).get('/v1/auth/me')

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    it('returns 401 when invalid token provided', async () => {
      const res = await request(app)
        .get('/v1/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    it('returns 401 when expired token provided', async () => {
      const expiredToken = jwt.sign(
        { id: TEST_USER_ID, email: TEST_EMAIL, role: 'Backer' },
        TEST_JWT_SECRET,
        { expiresIn: -1 }
      )

      const res = await request(app)
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    it('returns 404 USER_NOT_FOUND when account row is missing', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const token = makeToken()

      const res = await request(app).get('/v1/auth/me').set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('USER_NOT_FOUND')
    })
  })
})
