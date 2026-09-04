import { Socket } from 'socket.io'
import { User } from '../../../database/types'

export interface SocketData {
  user: User
}

export type AppSocket = Socket<
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  SocketData
>
