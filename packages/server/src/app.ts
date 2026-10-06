import express from 'express'
import type { Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import type { Pool } from 'pg'
import { correlationId } from './middleware/correlationId.js'
import { createRequestLogger } from './middleware/requestLogger.js'
import { errorHandler } from './middleware/errorHandler.js'
import { createCampaignRouter } from './campaigns/routes.js'
import { createAuthRouter } from './auth/routes.js'
import { createUsersRouter } from './users/routes.js'
import { createNotificationsRouter } from './notifications/routes.js'

export function createApp(pool: Pool): Express {
  const app = express()

  app.use(helmet())
  app.use(cors())
  app.use(express.json())
  app.use(correlationId)
  app.use(createRequestLogger())
  app.use('/v1/campaigns', createCampaignRouter(pool))
  app.use('/v1/auth', createAuthRouter(pool))
  app.use('/v1/users', createUsersRouter(pool))
  app.use('/v1/notifications', createNotificationsRouter(pool))
  app.use(errorHandler)

  return app
}
