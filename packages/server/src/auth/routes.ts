import { Router } from 'express'
import type { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { LoginRequestSchema } from './types.js'
import { findAccountByEmail, findAccountById } from './queries.js'
import { authenticate } from '../middleware/authenticate.js'

export function createAuthRouter(pool: Pool): Router {
  const router = Router()

  // POST /v1/auth/login
  router.post('/login', async (req, res, next) => {
    const parsed = LoginRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      const err = Object.assign(new Error('Invalid request body'), {
        status: 400,
        code: 'INVALID_REQUEST_BODY',
        details: parsed.error.flatten(),
      })
      return next(err)
    }

    const { email, password } = parsed.data

    try {
      const account = await findAccountByEmail(pool, email)

      // Use same error for unknown email and wrong password to prevent enumeration
      if (!account) {
        res.status(401).json({ error: { code: 'INVALID_CREDENTIALS' } })
        return
      }

      const passwordMatch = await bcrypt.compare(password, account.passwordHash)
      if (!passwordMatch) {
        res.status(401).json({ error: { code: 'INVALID_CREDENTIALS' } })
        return
      }

      const secret = process.env['JWT_SECRET']
      if (!secret) {
        res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR' } })
        return
      }

      // DEMO STUB: token is signed with JWT_SECRET env var, not a Clerk signing key.
      // No refresh token and no expiry revocation. Production would use Clerk.
      const token = jwt.sign({ id: account.id, email: account.email, role: account.role }, secret, {
        expiresIn: '8h',
      })

      const user = {
        id: account.id,
        email: account.email,
        displayName: account.displayName,
        bio: account.bio,
        role: account.role,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      }

      res.json({ data: { token, user } })
    } catch (err) {
      next(err)
    }
  })

  // POST /v1/auth/logout
  // DEMO STUB (L4-001 §5.2): no server-side session revocation in this demo stub.
  // JWT is stateless; actual token discard is client-side only.
  // Production systems should implement a token revocation blocklist (e.g. Redis).
  router.post('/logout', authenticate, (_req, res) => {
    res.json({ data: { message: 'Logged out' } })
  })

  // GET /v1/auth/me
  router.get('/me', authenticate, async (_req, res, next) => {
    const userId = (res.locals['user'] as { id: string }).id

    try {
      const account = await findAccountById(pool, userId)
      if (!account) {
        const err = Object.assign(new Error('User not found'), {
          status: 404,
          code: 'USER_NOT_FOUND',
          details: {},
        })
        return next(err)
      }

      const user = {
        id: account.id,
        email: account.email,
        displayName: account.displayName,
        bio: account.bio,
        role: account.role,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      }

      res.json({ data: user })
    } catch (err) {
      next(err)
    }
  })

  return router
}

export const authRouter = createAuthRouter
