import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../../../src/modules/auth/services/token.service', () => ({
  verifyAccessToken: vi.fn(),
}))

vi.mock('../../../../../src/database/repositories/user.repository', () => ({
  findUserById: vi.fn(),
}))

import { findUserById } from '../../../../../src/database/repositories/user.repository'
import { verifyAccessToken } from '../../../../../src/modules/auth/services/token.service'
import { socketAuthMiddleware } from '../../../../../src/modules/messaging/socket/socket.middleware'
import { AppSocket } from '../../../../../src/modules/messaging/socket/socket.types'

const activeUser = {
  id: 'user-1',
  isActive: true,
  deletedAt: null,
}

function mockSocket(token?: string): AppSocket {
  return {
    handshake: { auth: token === undefined ? {} : { token } },
    data: {},
  } as unknown as AppSocket
}

describe('socketAuthMiddleware', () => {
  let next: ReturnType<typeof vi.fn>

  beforeEach(() => {
    next = vi.fn()
    vi.mocked(verifyAccessToken).mockReset()
    vi.mocked(findUserById).mockReset()
  })

  async function callMiddleware(token?: string): Promise<AppSocket> {
    const socket = mockSocket(token)
    await socketAuthMiddleware(socket, next as (err?: Error) => void)
    return socket
  }

  it('attaches socket.data.user and calls next() with no error for a valid token', async () => {
    vi.mocked(verifyAccessToken).mockReturnValue({ sub: 'user-1', type: 'access' })
    vi.mocked(findUserById).mockResolvedValue(activeUser as never)

    const socket = await callMiddleware('valid-token')

    expect(socket.data.user).toEqual(activeUser)
    expect(next).toHaveBeenCalledWith()
  })

  it('rejects when no token is provided in the handshake', async () => {
    await callMiddleware(undefined)

    const error = next.mock.calls[0][0] as Error
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('Missing authentication token')
    expect(findUserById).not.toHaveBeenCalled()
  })

  it('rejects when the token signature is invalid', async () => {
    vi.mocked(verifyAccessToken).mockImplementation(() => {
      throw new Error('invalid signature')
    })

    await callMiddleware('tampered-token')

    const error = next.mock.calls[0][0] as Error
    expect(error.message).toBe('Invalid or expired access token')
    expect(findUserById).not.toHaveBeenCalled()
  })

  it('rejects when the token is well-formed but the user no longer exists', async () => {
    vi.mocked(verifyAccessToken).mockReturnValue({ sub: 'ghost-user', type: 'access' })
    vi.mocked(findUserById).mockResolvedValue(null)

    await callMiddleware('valid-token')

    const error = next.mock.calls[0][0] as Error
    expect(error.message).toBe('Invalid or expired access token')
  })

  it('rejects when the user has been soft-deleted', async () => {
    vi.mocked(verifyAccessToken).mockReturnValue({ sub: 'user-1', type: 'access' })
    vi.mocked(findUserById).mockResolvedValue({ ...activeUser, deletedAt: new Date() } as never)

    await callMiddleware('valid-token')

    const error = next.mock.calls[0][0] as Error
    expect(error.message).toBe('Invalid or expired access token')
  })

  it('rejects when the user has been deactivated', async () => {
    vi.mocked(verifyAccessToken).mockReturnValue({ sub: 'user-1', type: 'access' })
    vi.mocked(findUserById).mockResolvedValue({ ...activeUser, isActive: false } as never)

    await callMiddleware('valid-token')

    const error = next.mock.calls[0][0] as Error
    expect(error.message).toBe('Invalid or expired access token')
  })
})
