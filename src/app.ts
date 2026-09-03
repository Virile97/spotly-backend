import compression from 'compression'
import cors from 'cors'
import express, { Application } from 'express'
import helmet from 'helmet'
import pinoHttp from 'pino-http'
import { logger } from './bootstrap/logger'
import { appConfig } from './config/app.config'
import { errorHandler, notFoundHandler } from './middleware/error.middleware'
import { requestIdMiddleware } from './middleware/request-id.middleware'
import { apiRouter } from './routes'

export function createApp(): Application {
  const app = express()

  app.use(requestIdMiddleware)
  app.use(pinoHttp({ logger }))
  app.use(helmet())
  app.use(cors({ origin: appConfig.corsOrigin }))
  app.use(compression())
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  app.use('/api', apiRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
