import Redis from 'ioredis'
import { redisConfig } from '../../config/redis.config'
import { logger } from '../../shared/utils/logger'

let client: Redis | undefined

export function getRedisClient(): Redis {
  if (client) return client

  client = new Redis(redisConfig.url, { maxRetriesPerRequest: null })

  client.on('error', (error) => logger.error({ error }, 'Redis client error'))
  client.on('connect', () => logger.info('Redis connected'))

  return client
}

export function createRedisConnection(): Redis {
  return new Redis(redisConfig.url, { maxRetriesPerRequest: null })
}

export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.quit()
    client = undefined
  }
}
