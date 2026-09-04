import { findUserById } from '../../../database/repositories/user.repository'
import { verifyAccessToken } from '../../auth/services/token.service'
import { AppSocket } from './socket.types'

export async function socketAuthMiddleware(
  socket: AppSocket,
  next: (err?: Error) => void,
): Promise<void> {
  const token = socket.handshake.auth.token as string | undefined

  if (!token) {
    return next(new Error('Missing authentication token'))
  }

  let userId: string
  try {
    userId = verifyAccessToken(token).sub
  } catch {
    return next(new Error('Invalid or expired access token'))
  }

  const user = await findUserById(userId)
  if (!user || user.deletedAt || !user.isActive) {
    return next(new Error('Invalid or expired access token'))
  }

  socket.data.user = user
  next()
}
