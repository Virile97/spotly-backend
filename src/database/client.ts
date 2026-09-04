import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { logger } from '../shared/utils/logger'
import { databaseConfig } from '../config/database.config'
import { PrismaClient } from './generated/client/client'

declare global {
  var __prisma: PrismaClient | undefined
  var __prismaPool: Pool | undefined
}

function createPrismaClient(): { client: PrismaClient; pool: Pool } {
  const pool = new Pool({
    connectionString: databaseConfig.url,
    max: databaseConfig.poolMax,
  })

  const adapter = new PrismaPg(pool)

  const client = new PrismaClient({
    adapter,
    log: [
      { level: 'warn', emit: 'event' },
      { level: 'error', emit: 'event' },
      { level: 'query', emit: 'event' },
    ] as const,
  })

  client.$on('warn', (event) => logger.warn({ target: event.target }, event.message))
  client.$on('error', (event) => logger.error({ target: event.target }, event.message))
  client.$on('query', (event) => {
    if (event.duration >= databaseConfig.slowQueryThresholdMs) {
      logger.warn({ query: event.query, durationMs: event.duration }, 'Slow query detected')
    }
  })

  return { client, pool }
}

const instance = globalThis.__prisma
  ? { client: globalThis.__prisma, pool: globalThis.__prismaPool! }
  : createPrismaClient()

export const prisma = instance.client
export const prismaPool = instance.pool

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = instance.client
  globalThis.__prismaPool = instance.pool
}
