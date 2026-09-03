import { randomUUID } from 'crypto'
import { NextFunction, Request, Response } from 'express'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.headers['x-request-id']
  req.requestId = typeof incomingId === 'string' ? incomingId : randomUUID()
  res.setHeader('X-Request-Id', req.requestId)
  next()
}
