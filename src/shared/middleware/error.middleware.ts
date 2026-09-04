import { NextFunction, Request, Response } from 'express'
import { resolveStatusCode, toErrorResponseBody } from '../errors/error-handler'
import { logger } from '../utils/logger'
import { captureError } from '../utils/sentry'

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
  })
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const statusCode = resolveStatusCode(err)

  if (statusCode >= 500) {
    logger.error({ err, requestId: req.requestId }, 'Unhandled error')
    captureError(err, {
      requestId: req.requestId,
      route: req.route?.path ?? req.originalUrl,
      method: req.method,
      statusCode,
      userId: req.userId,
    })
  } else {
    logger.warn({ err, requestId: req.requestId }, 'Request error')
  }

  res.status(statusCode).json(toErrorResponseBody(err))
}
