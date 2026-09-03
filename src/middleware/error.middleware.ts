import { NextFunction, Request, Response } from 'express';
import { logger } from '../bootstrap/logger';
import { AppError } from '../shared/errors/app-error';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
  });
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const statusCode = err instanceof AppError ? err.statusCode : 500;

  if (statusCode >= 500) {
    logger.error({ err, requestId: req.requestId }, 'Unhandled error');
  } else {
    logger.warn({ err, requestId: req.requestId }, 'Request error');
  }

  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal Server Error',
    },
  });
}
