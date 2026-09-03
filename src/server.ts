import { initSentry, captureError } from './bootstrap/sentry'

initSentry()

import { createApp } from './app'
import { connectDatabase, disconnectDatabase } from './bootstrap/database'
import { logger } from './bootstrap/logger'
import { appConfig } from './config/app.config'

async function bootstrap(): Promise<void> {
  await connectDatabase()

  const app = createApp()

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
}

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

bootstrap().catch((error) => {
  logger.error({ error }, 'Failed to start server')
  captureError(error, { route: 'server.bootstrap' })
  process.exit(1)
})
