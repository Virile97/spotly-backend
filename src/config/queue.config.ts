import { env } from './env'

export const queueConfig = {
  redisUrl: env.queueRedisUrl ?? env.redisUrl,
}
