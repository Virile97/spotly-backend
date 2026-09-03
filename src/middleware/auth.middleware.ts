import { NextFunction, Request, Response } from 'express'
import { verifyAccessToken } from '../modules/auth/auth.tokens'
import { AppError } from '../shared/errors/app-error'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId: string
    }
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Missing or invalid Authorization header', 401))
  }

  const token = header.slice('Bearer '.length)

  try {
    const payload = verifyAccessToken(token)
    req.userId = payload.sub
    next()
  } catch {
    next(new AppError('Invalid or expired access token', 401))
  }
}
