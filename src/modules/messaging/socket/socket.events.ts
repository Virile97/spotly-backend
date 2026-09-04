export const SocketEvent = {
  UserPresence: 'user.presence',
} as const

export type SocketEventName = (typeof SocketEvent)[keyof typeof SocketEvent]

export interface UserPresencePayload {
  userId: string
  status: 'online' | 'offline'
}
