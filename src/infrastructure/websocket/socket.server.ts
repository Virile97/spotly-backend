import { Server as HttpServer } from 'http'
import { Server as SocketIoServer } from 'socket.io'
import { socketConfig } from '../../config/socket.config'

export function createSocketServer(httpServer: HttpServer): SocketIoServer {
  return new SocketIoServer(httpServer, {
    cors: {
      origin: socketConfig.corsOrigin,
    },
  })
}
