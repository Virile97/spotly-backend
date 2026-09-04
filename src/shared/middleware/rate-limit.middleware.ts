import { NextFunction, Request, Response } from 'express'

// Placeholder until infrastructure/redis rate limiting is wired up.
export function rateLimitMiddleware(_req: Request, _res: Response, next: NextFunction): void {
  next()
}
