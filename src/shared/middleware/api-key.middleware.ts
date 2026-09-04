import { timingSafeEqual } from 'crypto'
import { NextFunction, Request, Response } from 'express'
import { appConfig } from '../../config/app.config'
import { AppError } from '../errors/app-error'

const API_KEY_HEADER = 'x-spotly-api-key'

function isValidApiKey(candidate: string): boolean {
  const expected = Buffer.from(appConfig.spotlyApiKey)
  const actual = Buffer.from(candidate)

  if (expected.length !== actual.length) {
    return false
  }

  return timingSafeEqual(expected, actual)
}

export function apiKeyMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers[API_KEY_HEADER]
  const apiKey = Array.isArray(header) ? header[0] : header

  if (!apiKey || !isValidApiKey(apiKey)) {
    return next(new AppError('Missing or invalid API key', 401))
  }

  next()
}
