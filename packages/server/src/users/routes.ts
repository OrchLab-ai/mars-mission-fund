import { Router } from 'express'
import type { Pool } from 'pg'
import { authenticate } from '../middleware/authenticate.js'
import { requireRole } from '../middleware/requireRole.js'
import { UserParamsSchema, UpdateProfileRequestSchema } from './types.js'
import { listAccounts, getAccountById, updateAccount } from './queries.js'

export function createUsersRouter(pool: Pool): Router {
  const router = Router()

  // GET /v1/users — Administrator only
  router.get('/', authenticate, requireRole('Administrator'), async (_req, res, next) => {
    try {
      const accounts = await listAccounts(pool)
      const users = accounts.map((account) => ({
        id: account.id,
        email: account.email,
        displayName: account.displayName,
        bio: account.bio,
        role: account.role,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      }))
      res.json({ data: users })
    } catch (err) {
      next(err)
    }
  })

  // GET /v1/users/:id — authenticated
  router.get('/:id', authenticate, async (req, res, next) => {
    const parsed = UserParamsSchema.safeParse(req.params)
    if (!parsed.success) {
      const err = Object.assign(new Error('Invalid user ID'), {
        status: 400,
        code: 'INVALID_REQUEST_PARAMS',
        details: parsed.error.flatten(),
      })
      return next(err)
    }

    try {
      const account = await getAccountById(pool, parsed.data.id)
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

  // PATCH /v1/users/:id — authenticated, own profile only
  router.patch('/:id', authenticate, async (req, res, next) => {
    const parsedParams = UserParamsSchema.safeParse(req.params)
    if (!parsedParams.success) {
      const err = Object.assign(new Error('Invalid user ID'), {
        status: 400,
        code: 'INVALID_REQUEST_PARAMS',
        details: parsedParams.error.flatten(),
      })
      return next(err)
    }

    const requestingUser = res.locals['user'] as { id: string }
    if (requestingUser.id !== parsedParams.data.id) {
      res.status(403).json({ error: { code: 'FORBIDDEN' } })
      return
    }

    const parsedBody = UpdateProfileRequestSchema.safeParse(req.body)
    if (!parsedBody.success) {
      const err = Object.assign(new Error('Invalid request body'), {
        status: 400,
        code: 'INVALID_REQUEST_BODY',
        details: parsedBody.error.flatten(),
      })
      return next(err)
    }

    try {
      const updated = await updateAccount(pool, parsedParams.data.id, parsedBody.data)
      if (!updated) {
        const err = Object.assign(new Error('User not found'), {
          status: 404,
          code: 'USER_NOT_FOUND',
          details: {},
        })
        return next(err)
      }

      const user = {
        id: updated.id,
        email: updated.email,
        displayName: updated.displayName,
        bio: updated.bio,
        role: updated.role,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      }

      res.json({ data: user })
    } catch (err) {
      next(err)
    }
  })

  return router
}

export const usersRouter = createUsersRouter
