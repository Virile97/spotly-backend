import { Server as SocketIoServer } from 'socket.io'

let io: SocketIoServer | undefined

export function setSocketServer(server: SocketIoServer): void {
  io = server
}

export function emitToRoom(room: string, event: string, payload: unknown): void {
  io?.to(room).emit(event, payload)
}
