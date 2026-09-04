import { createServer } from 'http'
import { Application } from 'express'
import { appConfig } from '../config/app.config'
import { connectDatabase, disconnectDatabase } from '../infrastructure/database/prisma'
import { disconnectRedis } from '../infrastructure/redis/redis.client'
import { createSocketServer } from '../infrastructure/websocket/socket.server'
import { attachRedisAdapter } from '../infrastructure/websocket/socket.redis-adapter'
import { setSocketServer } from '../infrastructure/websocket/socket-emitter'
import { registerMessagingGateway } from '../modules/messaging'
import { captureError, initSentry } from '../shared/utils/sentry'
import { logger } from '../shared/utils/logger'
import { createApp } from './app'

export async function bootstrap(): Promise<void> {
  initSentry()

  await connectDatabase()

  const app: Application = createApp()
  const httpServer = createServer(app)

  const io = createSocketServer(httpServer)
  await attachRedisAdapter(io)
  setSocketServer(io)
  registerMessagingGateway(io)

  const server = httpServer.listen(appConfig.port, () => {
    logger.info(`Server running in ${appConfig.nodeEnv} mode on port ${appConfig.port}`)
  })

  async function shutdown(signal: string): Promise<void> {
    logger.info(`${signal} received, shutting down gracefully`)
    io.close()
    server.close(async () => {
      await disconnectDatabase()
      await disconnectRedis()
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
