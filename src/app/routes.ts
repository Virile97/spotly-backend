import { Router } from 'express'
import { isDatabaseHealthy } from '../infrastructure/database/prisma'
import { apiKeyMiddleware } from '../shared/middleware/api-key.middleware'
import { authRouter } from '../modules/auth'
import { interestRouter } from '../modules/interests'
import { profileRouter } from '../modules/profiles'

export const apiRouter = Router()

const healthRouter = Router()

healthRouter.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

healthRouter.get('/ready', async (_req, res) => {
  const databaseHealthy = await isDatabaseHealthy()

  res.status(databaseHealthy ? 200 : 503).json({
    status: databaseHealthy ? 'ok' : 'unavailable',
    checks: {
      database: databaseHealthy ? 'ok' : 'unavailable',
    },
    timestamp: new Date().toISOString(),
  })
})

apiRouter.use('/health', healthRouter)
apiRouter.use('/auth', apiKeyMiddleware, authRouter)
apiRouter.use('/profiles', apiKeyMiddleware, profileRouter)
apiRouter.use('/interests', apiKeyMiddleware, interestRouter)
