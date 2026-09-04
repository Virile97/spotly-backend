import { NextFunction, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../../src/config/app.config', () => ({
  appConfig: { spotlyApiKey: 'correct-api-key' },
}))

import { apiKeyMiddleware } from '../../../../src/shared/middleware/api-key.middleware'
import { AppError } from '../../../../src/shared/errors/app-error'

function mockRequest(headerValue?: string | string[]): Request {
  return {
    headers: headerValue === undefined ? {} : { 'x-spotly-api-key': headerValue },
  } as unknown as Request
}

describe('apiKeyMiddleware', () => {
  let next: ReturnType<typeof vi.fn>

  beforeEach(() => {
    next = vi.fn()
  })

  function callMiddleware(headerValue?: string | string[]): void {
    apiKeyMiddleware(mockRequest(headerValue), {} as Response, next as NextFunction)
  }

  it('calls next() with no error when the API key is correct', () => {
    callMiddleware('correct-api-key')

    expect(next).toHaveBeenCalledWith()
  })

  it('rejects with 401 when the header is missing', () => {
    callMiddleware(undefined)

    const error = next.mock.calls[0][0] as AppError
    expect(error).toBeInstanceOf(AppError)
    expect(error.statusCode).toBe(401)
  })

  it('rejects with 401 when the key is wrong', () => {
    callMiddleware('wrong-key')

    const error = next.mock.calls[0][0] as AppError
    expect(error.statusCode).toBe(401)
  })

  it('rejects with 401 when the key is a different length (avoids buffer length crash)', () => {
    callMiddleware('short')

    const error = next.mock.calls[0][0] as AppError
    expect(error.statusCode).toBe(401)
  })

  it('accepts the first value when the header is sent multiple times with a valid key', () => {
    callMiddleware(['correct-api-key', 'wrong-key'])

    expect(next).toHaveBeenCalledWith()
  })
})
