import { Application } from 'express'
import { appConfig } from '../config/app.config'
import { connectDatabase, disconnectDatabase } from '../infrastructure/database/prisma'
import { captureError, initSentry } from '../shared/utils/sentry'
import { logger } from '../shared/utils/logger'
import { createApp } from './app'

export async function bootstrap(): Promise<void> {
  initSentry()

  await connectDatabase()

  const app: Application = createApp()

  const server = app.listen(appConfig.port, () => {
    logger.info(`Server running in ${appConfig.nodeEnv} mode on port ${appConfig.port}`)
  })

  async function shutdown(signal: string): Promise<void> {
    logger.info(`${signal} received, shutting down gracefully`)
    server.close(async () => {
      await disconnectDatabase()
      logger.info('Server closed')
      process.exit(0)
    })
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'))
  process.on('SIGINT', () => void shutdown('SIGINT'))

  process.on('unhandledRejection', (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason))
    logger.error({ error }, 'Unhandled promise rejection')
    captureError(error, { route: 'process.unhandledRejection' })
  })

  process.on('uncaughtException', (error) => {
    logger.error({ error }, 'Uncaught exception')
    captureError(error, { route: 'process.uncaughtException' })
    process.exit(1)
  })
}
