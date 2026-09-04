import { env } from './env'

export const redisConfig = {
  url: env.redisUrl,
  socketAdapterKeyPrefix: 'spotly:socket.io:',
}
