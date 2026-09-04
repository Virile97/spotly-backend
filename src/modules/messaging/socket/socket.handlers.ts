import { logger } from '../../../shared/utils/logger'
import { SocketEvent, UserPresencePayload } from './socket.events'
import { userRoom } from './socket.rooms'
import { AppSocket } from './socket.types'

export async function handleConnection(socket: AppSocket): Promise<void> {
  const { user } = socket.data
  const room = userRoom(user.id)

  await socket.join(room)
  logger.info({ userId: user.id, socketId: socket.id }, 'Socket connected')

  socket.to(room).emit(SocketEvent.UserPresence, {
    userId: user.id,
    status: 'online',
  } satisfies UserPresencePayload)

  socket.on('disconnect', () => {
    logger.info({ userId: user.id, socketId: socket.id }, 'Socket disconnected')

    socket.to(room).emit(SocketEvent.UserPresence, {
      userId: user.id,
      status: 'offline',
    } satisfies UserPresencePayload)
  })
}
