import { NextFunction, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../src/modules/auth/auth.tokens', () => ({
  verifyAccessToken: vi.fn(),
}))

vi.mock('../../../src/database/repositories/user.repository', () => ({
  findUserById: vi.fn(),
}))

import { authMiddleware } from '../../../src/middleware/auth.middleware'
import { findUserById } from '../../../src/database/repositories/user.repository'
import { verifyAccessToken } from '../../../src/modules/auth/auth.tokens'
import { AppError } from '../../../src/shared/errors/app-error'

const activeUser = {
  id: 'user-1',
  isActive: true,
  deletedAt: null,
}

function mockRequest(authHeader?: string): Request {
  return {
    headers: authHeader === undefined ? {} : { authorization: authHeader },
  } as unknown as Request
}

describe('authMiddleware', () => {
  let next: ReturnType<typeof vi.fn>

  beforeEach(() => {
    next = vi.fn()
    vi.mocked(verifyAccessToken).mockReset()
    vi.mocked(findUserById).mockReset()
  })

  async function callMiddleware(authHeader?: string): Promise<Request> {
    const req = mockRequest(authHeader)
    await authMiddleware(req, {} as Response, next as NextFunction)
    return req
  }

  it('attaches req.userId and req.user for a valid token and active user', async () => {
    vi.mocked(verifyAccessToken).mockReturnValue({ sub: 'user-1', type: 'access' })
    vi.mocked(findUserById).mockResolvedValue(activeUser as never)

    const req = await callMiddleware('Bearer valid-token')

    expect(req.userId).toBe('user-1')
    expect(req.user).toEqual(activeUser)
    expect(next).toHaveBeenCalledWith()
  })

  it('rejects with 401 when the Authorization header is missing', async () => {
    await callMiddleware(undefined)

    const error = next.mock.calls[0][0] as AppError
    expect(error).toBeInstanceOf(AppError)
    expect(error.statusCode).toBe(401)
    expect(error.message).toBe('Missing or invalid Authorization header')
    expect(findUserById).not.toHaveBeenCalled()
  })

  it('rejects with 401 when the header does not use the Bearer scheme', async () => {
    await callMiddleware('Basic dXNlcjpwYXNz')

    const error = next.mock.calls[0][0] as AppError
    expect(error.statusCode).toBe(401)
    expect(error.message).toBe('Missing or invalid Authorization header')
  })

  it('rejects with 401 when the token signature is invalid', async () => {
    vi.mocked(verifyAccessToken).mockImplementation(() => {
      throw new Error('invalid signature')
    })

    await callMiddleware('Bearer tampered-token')

    const error = next.mock.calls[0][0] as AppError
    expect(error.statusCode).toBe(401)
    expect(error.message).toBe('Invalid or expired access token')
    expect(findUserById).not.toHaveBeenCalled()
  })

  it('rejects with 401 when the token has expired', async () => {
    vi.mocked(verifyAccessToken).mockImplementation(() => {
      throw new Error('jwt expired')
    })

    await callMiddleware('Bearer expired-token')

    const error = next.mock.calls[0][0] as AppError
    expect(error.statusCode).toBe(401)
    expect(error.message).toBe('Invalid or expired access token')
  })

  it('rejects with 401 when the token is well-formed but the user no longer exists', async () => {
    vi.mocked(verifyAccessToken).mockReturnValue({ sub: 'ghost-user', type: 'access' })
    vi.mocked(findUserById).mockResolvedValue(null)

    await callMiddleware('Bearer valid-token')

    const error = next.mock.calls[0][0] as AppError
    expect(error.statusCode).toBe(401)
    expect(error.message).toBe('Invalid or expired access token')
  })

  it('rejects with 401 when the user has been soft-deleted', async () => {
    vi.mocked(verifyAccessToken).mockReturnValue({ sub: 'user-1', type: 'access' })
    vi.mocked(findUserById).mockResolvedValue({
      ...activeUser,
      deletedAt: new Date(),
    } as never)

    await callMiddleware('Bearer valid-token')

    const error = next.mock.calls[0][0] as AppError
    expect(error.statusCode).toBe(401)
  })

  it('rejects with 401 when the user has been deactivated', async () => {
    vi.mocked(verifyAccessToken).mockReturnValue({ sub: 'user-1', type: 'access' })
    vi.mocked(findUserById).mockResolvedValue({
      ...activeUser,
      isActive: false,
    } as never)

    await callMiddleware('Bearer valid-token')

    const error = next.mock.calls[0][0] as AppError
    expect(error.statusCode).toBe(401)
  })
})
