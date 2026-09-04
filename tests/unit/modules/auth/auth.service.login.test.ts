import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { TEST_ACCESS_SECRET, TEST_REFRESH_SECRET } = vi.hoisted(() => ({
  TEST_ACCESS_SECRET: 'test-access-secret',
  TEST_REFRESH_SECRET: 'test-refresh-secret',
}))

vi.mock('../../../../src/database/client', () => ({
  prisma: {},
}))

vi.mock('../../../../src/config/auth.config', () => ({
  authConfig: {
    accessTokenSecret: TEST_ACCESS_SECRET,
    refreshTokenSecret: TEST_REFRESH_SECRET,
    accessTokenTtl: '15m',
    refreshTokenTtl: '30d',
    emailHashSecret: 'test-email-hash-secret',
    argon2: { type: 2, memoryCost: 8, timeCost: 1, parallelism: 1 },
  },
}))

vi.mock('../../../../src/database/transactions/transaction', () => ({
  runInTransaction: vi.fn((fn: (tx: unknown) => unknown) => fn({})),
}))

vi.mock('../../../../src/modules/auth/repositories/auth.repository', () => ({
  findLoginByEmailHash: vi.fn(),
  createRefreshToken: vi.fn(),
  findRefreshTokenByHash: vi.fn(),
  rotateRefreshToken: vi.fn(),
  revokeRefreshToken: vi.fn(),
  revokeAllRefreshTokensForUser: vi.fn(),
}))

import * as authRepository from '../../../../src/modules/auth/repositories/auth.repository'
import * as authService from '../../../../src/modules/auth/services/auth.service'
import { LoginDto } from '../../../../src/modules/auth/dto/login.dto'
import { AccessTokenPayload } from '../../../../src/modules/auth/types/auth.types'

const user = {
  id: 'user-1',
  firstName: 'Alice',
  middleName: null,
  lastName: 'Doe',
  username: null,
  gender: 'FEMALE',
  birthdate: new Date('1990-01-01'),
  contactNo: null,
  address: null,
  maritalStatus: null,
  isActive: true,
  bio: null,
  avatarUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
}

const loginDto: LoginDto = {
  email: 'alice@example.com',
  password: 'correcthorsebatterystaple',
}

describe('authService.login', () => {
  let storedPasswordHash: string

  beforeEach(async () => {
    storedPasswordHash = await argon2.hash(loginDto.password, {
      type: 2,
      memoryCost: 8,
      timeCost: 1,
      parallelism: 1,
    })

    vi.mocked(authRepository.findLoginByEmailHash)
      .mockReset()
      .mockResolvedValue({
        id: 'login-1',
        userId: user.id,
        authProvider: 'EMAIL',
        emailHash: 'hash',
        passwordHash: storedPasswordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
        user,
      } as never)
    vi.mocked(authRepository.createRefreshToken)
      .mockReset()
      .mockResolvedValue({} as never)
  })

  it('returns the user and tokens on correct credentials', async () => {
    const result = await authService.login(loginDto)

    expect(result.user).toEqual(user)
    expect(result.tokens.accessToken).toEqual(expect.any(String))
    expect(result.tokens.refreshToken).toEqual(expect.any(String))
  })

  it('never exposes the password hash in the returned user', async () => {
    const result = await authService.login(loginDto)

    expect(result.user).not.toHaveProperty('passwordHash')
    expect(result.user).not.toHaveProperty('password')
  })

  it('issues an access token with the correct identity claims', async () => {
    const result = await authService.login(loginDto)

    const payload = jwt.verify(result.tokens.accessToken, TEST_ACCESS_SECRET) as AccessTokenPayload
    expect(payload.sub).toBe(user.id)
    expect(payload.type).toBe('access')
  })

  it('issues a short-lived access token (15m expiry)', async () => {
    const result = await authService.login(loginDto)

    const decoded = jwt.decode(result.tokens.accessToken) as jwt.JwtPayload
    const ttlSeconds = decoded.exp! - decoded.iat!
    expect(ttlSeconds).toBe(15 * 60)
  })

  it('stores a hash of the refresh token, never the plaintext', async () => {
    const result = await authService.login(loginDto)

    const [params] = vi.mocked(authRepository.createRefreshToken).mock.calls[0]
    expect(params.tokenHash).not.toBe(result.tokens.refreshToken)
    expect(params.userId).toBe(user.id)
    expect(params.expiresAt).toBeInstanceOf(Date)
    expect(params.expiresAt.getTime()).toBeGreaterThan(Date.now())
  })

  it('the refresh token is not a JWT (opaque random string)', async () => {
    const result = await authService.login(loginDto)

    expect(() => {
      const decoded = jwt.decode(result.tokens.refreshToken)
      if (decoded === null) throw new Error('not a JWT')
    }).toThrow()
  })

  it('rejects login when no account exists for the email', async () => {
    vi.mocked(authRepository.findLoginByEmailHash).mockResolvedValue(null)

    await expect(authService.login(loginDto)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Account not found',
    })
  })

  it('rejects login when the account has no password (e.g. Google-only account)', async () => {
    vi.mocked(authRepository.findLoginByEmailHash).mockResolvedValue({
      id: 'login-1',
      userId: user.id,
      authProvider: 'GOOGLE',
      emailHash: 'hash',
      passwordHash: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      user,
    } as never)

    await expect(authService.login(loginDto)).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid email or password',
    })
  })

  it('rejects login with an incorrect password', async () => {
    await expect(
      authService.login({ ...loginDto, password: 'wrong-password' }),
    ).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid email or password',
    })
  })

  it('does not create a refresh token when credentials are invalid', async () => {
    await expect(
      authService.login({ ...loginDto, password: 'wrong-password' }),
    ).rejects.toBeDefined()

    expect(authRepository.createRefreshToken).not.toHaveBeenCalled()
  })
})
