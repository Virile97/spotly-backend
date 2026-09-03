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

vi.mock('../../../../src/database/transactions/transaction', () => ({
  runInTransaction: vi.fn((fn: (tx: unknown) => unknown) => fn({})),
}))

vi.mock('../../../../src/modules/auth/auth.repository', () => ({
  findLoginByEmailHash: vi.fn(),
  findUserByNickname: vi.fn(),
  createUserWithLogin: vi.fn(),
  createRefreshToken: vi.fn(),
}))

vi.mock('../../../../src/modules/auth/auth.tokens', () => ({
  issueAccessToken: vi.fn(() => 'access-token'),
  generateRefreshToken: vi.fn(() => ({
    token: 'refresh-token',
    tokenHash: 'refresh-token-hash',
    expiresAt: new Date('2099-01-01'),
  })),
  hashRefreshToken: vi.fn((token: string) => `hash(${token})`),
}))

import * as authRepository from '../../../../src/modules/auth/auth.repository'
import * as authService from '../../../../src/modules/auth/auth.service'
import { RegisterDto } from '../../../../src/modules/auth/dto/register.dto'
import { AppError } from '../../../../src/shared/errors/app-error'
import { Prisma } from '../../../../src/database/types'

const baseDto: RegisterDto = {
  email: 'alice@example.com',
  password: 'correcthorsebatterystaple',
  displayName: 'Alice',
  firstName: 'Alice',
  lastName: 'Doe',
  gender: 'FEMALE',
  birthdate: '1990-01-01',
}

const createdUser = {
  id: 'user-1',
  firstName: 'Alice',
  middleName: null,
  lastName: 'Doe',
  displayName: 'Alice',
  nickname: null,
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

describe('authService.register', () => {
  beforeEach(() => {
    vi.mocked(authRepository.findLoginByEmailHash).mockReset().mockResolvedValue(null)
    vi.mocked(authRepository.findUserByNickname).mockReset().mockResolvedValue(null)
    vi.mocked(authRepository.createUserWithLogin)
      .mockReset()
      .mockResolvedValue(createdUser as never)
    vi.mocked(authRepository.createRefreshToken)
      .mockReset()
      .mockResolvedValue({} as never)
  })

  it('creates a user and returns tokens on valid input', async () => {
    const result = await authService.register(baseDto)

    expect(result.user).toEqual(createdUser)
    expect(result.tokens).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' })
  })

  it('never passes the plain-text password to the repository', async () => {
    await authService.register(baseDto)

    const call = vi.mocked(authRepository.createUserWithLogin).mock.calls[0]
    const params = call[1]

    expect(params.passwordHash).toBeDefined()
    expect(params.passwordHash).not.toBe(baseDto.password)
    expect(params).not.toHaveProperty('password')
  })

  it('hashes the email before checking/storing it', async () => {
    await authService.register(baseDto)

    const [emailHashArg] = vi.mocked(authRepository.findLoginByEmailHash).mock.calls[0]
    expect(emailHashArg).not.toBe(baseDto.email)
    expect(typeof emailHashArg).toBe('string')
    expect(emailHashArg).toHaveLength(64) // sha256 hex digest
  })

  it('rejects registration when the email is already registered', async () => {
    vi.mocked(authRepository.findLoginByEmailHash).mockResolvedValue({
      id: 'login-1',
      userId: 'user-1',
      authProvider: 'EMAIL',
      emailHash: 'hash',
      passwordHash: 'hash',
      createdAt: new Date(),
      updatedAt: new Date(),
      user: createdUser,
    } as never)

    await expect(authService.register(baseDto)).rejects.toMatchObject({
      statusCode: 409,
      message: 'An account with this email already exists',
    })
    expect(authRepository.createUserWithLogin).not.toHaveBeenCalled()
  })

  it('rejects registration when the nickname is already taken', async () => {
    vi.mocked(authRepository.findUserByNickname).mockResolvedValue(createdUser as never)

    await expect(authService.register({ ...baseDto, nickname: 'alice_doe' })).rejects.toMatchObject(
      {
        statusCode: 409,
        message: 'This nickname is already taken',
      },
    )
    expect(authRepository.createUserWithLogin).not.toHaveBeenCalled()
  })

  it('skips the nickname lookup when no nickname is provided', async () => {
    await authService.register(baseDto)

    expect(authRepository.findUserByNickname).not.toHaveBeenCalled()
  })

  it('surfaces a 409 nickname conflict from a concurrent unique-constraint violation', async () => {
    vi.mocked(authRepository.createUserWithLogin).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.10.0',
        meta: { target: ['nickname'] },
      }),
    )

    await expect(authService.register({ ...baseDto, nickname: 'alice_doe' })).rejects.toMatchObject(
      {
        statusCode: 409,
        message: 'This nickname is already taken',
      },
    )
  })

  it('propagates unrelated errors from user creation', async () => {
    vi.mocked(authRepository.createUserWithLogin).mockRejectedValue(new Error('db down'))

    await expect(authService.register(baseDto)).rejects.toThrow('db down')
  })
})

describe('AppError shape', () => {
  it('is thrown with the expected status code for duplicates', () => {
    const error = new AppError('conflict', 409)
    expect(error.statusCode).toBe(409)
    expect(error.isOperational).toBe(true)
  })
})
