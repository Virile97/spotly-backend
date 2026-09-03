import { Router } from 'express'
import { isDatabaseHealthy } from '../bootstrap/database'

export const healthRouter = Router()

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
