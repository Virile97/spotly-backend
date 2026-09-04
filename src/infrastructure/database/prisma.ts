import { prisma, prismaPool } from '../../database/client'
import { logger } from '../../shared/utils/logger'

export async function connectDatabase(): Promise<void> {
  await prisma.$connect()
  logger.info('Database connected')
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect()
  await prismaPool.end()
  logger.info('Database disconnected')
}

export async function isDatabaseHealthy(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    logger.error({ error }, 'Database health check failed')
    return false
  }
}
