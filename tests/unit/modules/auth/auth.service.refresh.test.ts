import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../../src/database/client', () => ({
  prisma: {},
}))

vi.mock('../../../../src/config/auth.config', () => ({
  authConfig: {
    accessTokenSecret: 'test-access-secret',
    refreshTokenSecret: 'test-refresh-secret',
    accessTokenTtl: '15m',
    refreshTokenTtl: '30d',
    emailHashSecret: 'test-email-hash-secret',
    argon2: { type: 2, memoryCost: 8, timeCost: 1, parallelism: 1 },
  },
}))

vi.mock('../../../../src/bootstrap/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}))

vi.mock('../../../../src/modules/auth/auth.repository', () => ({
  findRefreshTokenByHash: vi.fn(),
  rotateRefreshToken: vi.fn(),
  revokeRefreshToken: vi.fn(),
  revokeAllRefreshTokensForUser: vi.fn(),
}))

import * as authRepository from '../../../../src/modules/auth/auth.repository'
import * as authService from '../../../../src/modules/auth/auth.service'

const user = {
  id: 'user-1',
  deletedAt: null,
}

function storedToken(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'token-1',
    userId: 'user-1',
    tokenHash: 'some-hash',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    revokedAt: null,
    replacedBy: null,
    createdAt: new Date(),
    user,
    ...overrides,
  }
}

describe('authService.refresh', () => {
  beforeEach(() => {
    vi.mocked(authRepository.findRefreshTokenByHash).mockReset()
    vi.mocked(authRepository.rotateRefreshToken)
      .mockReset()
      .mockResolvedValue({ id: 'token-2' } as never)
    vi.mocked(authRepository.revokeAllRefreshTokensForUser).mockReset().mockResolvedValue(undefined)
  })

  it('returns new tokens for a valid, unexpired, unrevoked refresh token', async () => {
    vi.mocked(authRepository.findRefreshTokenByHash).mockResolvedValue(storedToken() as never)

    const result = await authService.refresh('some-refresh-token')

    expect(result.accessToken).toEqual(expect.any(String))
    expect(result.refreshToken).toEqual(expect.any(String))
  })

  it('rotates the token: old token is superseded by a newly stored one', async () => {
    vi.mocked(authRepository.findRefreshTokenByHash).mockResolvedValue(storedToken() as never)

    await authService.refresh('some-refresh-token')

    expect(authRepository.rotateRefreshToken).toHaveBeenCalledWith(
      'token-1',
      expect.objectContaining({ userId: 'user-1' }),
    )
  })

  it('issues a refresh token that differs from the one presented (new opaque value)', async () => {
    vi.mocked(authRepository.findRefreshTokenByHash).mockResolvedValue(storedToken() as never)

    const result = await authService.refresh('some-refresh-token')

    expect(result.refreshToken).not.toBe('some-refresh-token')
  })

  it('rejects when no matching token exists', async () => {
    vi.mocked(authRepository.findRefreshTokenByHash).mockResolvedValue(null)

    await expect(authService.refresh('unknown-token')).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid or expired refresh token',
    })
  })

  it('rejects when the token has expired', async () => {
    vi.mocked(authRepository.findRefreshTokenByHash).mockResolvedValue(
      storedToken({ expiresAt: new Date(Date.now() - 1000) }) as never,
    )

    await expect(authService.refresh('expired-token')).rejects.toMatchObject({
      statusCode: 401,
    })
    expect(authRepository.rotateRefreshToken).not.toHaveBeenCalled()
  })

  it('rejects when the owning user is soft-deleted', async () => {
    vi.mocked(authRepository.findRefreshTokenByHash).mockResolvedValue(
      storedToken({ user: { id: 'user-1', deletedAt: new Date() } }) as never,
    )

    await expect(authService.refresh('some-token')).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  it('rejects reuse of an already-revoked token and revokes the whole session chain', async () => {
    vi.mocked(authRepository.findRefreshTokenByHash).mockResolvedValue(
      storedToken({ revokedAt: new Date(), replacedBy: 'token-2' }) as never,
    )

    await expect(authService.refresh('stolen-and-reused-token')).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid or expired refresh token',
    })

    expect(authRepository.revokeAllRefreshTokensForUser).toHaveBeenCalledWith('user-1')
    expect(authRepository.rotateRefreshToken).not.toHaveBeenCalled()
  })
})

describe('authService.logout', () => {
  beforeEach(() => {
    vi.mocked(authRepository.findRefreshTokenByHash).mockReset()
    vi.mocked(authRepository.revokeRefreshToken)
      .mockReset()
      .mockResolvedValue({} as never)
  })

  it('revokes the matching refresh token', async () => {
    vi.mocked(authRepository.findRefreshTokenByHash).mockResolvedValue(storedToken() as never)

    await authService.logout('some-refresh-token')

    expect(authRepository.revokeRefreshToken).toHaveBeenCalledWith('token-1')
  })

  it('is a no-op when the token does not exist (idempotent logout)', async () => {
    vi.mocked(authRepository.findRefreshTokenByHash).mockResolvedValue(null)

    await expect(authService.logout('unknown-token')).resolves.toBeUndefined()
    expect(authRepository.revokeRefreshToken).not.toHaveBeenCalled()
  })

  it('is a no-op when the token is already revoked', async () => {
    vi.mocked(authRepository.findRefreshTokenByHash).mockResolvedValue(
      storedToken({ revokedAt: new Date() }) as never,
    )

    await authService.logout('already-revoked-token')

    expect(authRepository.revokeRefreshToken).not.toHaveBeenCalled()
  })
})
