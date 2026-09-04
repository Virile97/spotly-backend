import { Server as SocketIoServer } from 'socket.io'
import { handleConnection } from './socket.handlers'
import { socketAuthMiddleware } from './socket.middleware'
import { AppSocket } from './socket.types'

export function registerMessagingGateway(io: SocketIoServer): void {
  io.use((socket, next) => {
    void socketAuthMiddleware(socket as AppSocket, next)
  })

  io.on('connection', (socket) => {
    void handleConnection(socket as AppSocket)
  })
}
