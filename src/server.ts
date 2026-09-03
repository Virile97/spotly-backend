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

bootstrap().catch((error) => {
  logger.error({ error }, 'Failed to start server')
  process.exit(1)
})
