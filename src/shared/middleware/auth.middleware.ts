import { NextFunction, Request, Response } from 'express'
import { findUserById } from '../../database/repositories/user.repository'
import { User } from '../../database/types'
import { verifyAccessToken } from '../../modules/auth/services/token.service'
import { AppError } from '../errors/app-error'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId: string
      user: User
    }
  }
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Missing or invalid Authorization header', 401))
  }

  const token = header.slice('Bearer '.length)

  let userId: string
  try {
    userId = verifyAccessToken(token).sub
  } catch {
    return next(new AppError('Invalid or expired access token', 401))
  }

  const user = await findUserById(userId)
  if (!user || user.deletedAt || !user.isActive) {
    return next(new AppError('Invalid or expired access token', 401))
  }

  req.userId = user.id
  req.user = user
  next()
}
