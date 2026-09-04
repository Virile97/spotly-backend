import { Server as SocketIoServer } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { redisConfig } from '../../config/redis.config'
import { createRedisConnection } from '../redis/redis.client'

export async function attachRedisAdapter(io: SocketIoServer): Promise<void> {
  const pubClient = createRedisConnection()
  const subClient = pubClient.duplicate()

  await Promise.all([
    new Promise<void>((resolve) => pubClient.once('ready', resolve)),
    new Promise<void>((resolve) => subClient.once('ready', resolve)),
  ])

  io.adapter(createAdapter(pubClient, subClient, { key: redisConfig.socketAdapterKeyPrefix }))
}
