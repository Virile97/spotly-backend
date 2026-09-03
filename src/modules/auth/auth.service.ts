import argon2 from 'argon2'
import { createHmac } from 'crypto'
import { runInTransaction } from '../../database/transactions/transaction'
import { Prisma, User } from '../../database/types'
import { AppError } from '../../shared/errors/app-error'
import { authConfig } from '../../config/auth.config'
import { logger } from '../../bootstrap/logger'
import * as authRepository from './auth.repository'
import { generateRefreshToken, hashRefreshToken, issueAccessToken } from './auth.tokens'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { AuthTokens } from './types/auth.types'

function hashEmail(email: string): string {
  return createHmac('sha256', authConfig.emailHashSecret).update(email).digest('hex')
}

async function issueAuthTokens(userId: string): Promise<AuthTokens> {
  const accessToken = issueAccessToken(userId)
  const { token: refreshToken, tokenHash, expiresAt } = generateRefreshToken()

  await authRepository.createRefreshToken({ userId, tokenHash, expiresAt })

  return { accessToken, refreshToken }
}

export async function register(dto: RegisterDto): Promise<{ user: User; tokens: AuthTokens }> {
  const emailHash = hashEmail(dto.email)

  const existingEmail = await authRepository.findLoginByEmailHash(emailHash)
  if (existingEmail) {
    throw new AppError('An account with this email already exists', 409)
  }

  if (dto.username) {
    const existingUsername = await authRepository.findUserByUsername(dto.username)
    if (existingUsername) {
      throw new AppError('This username is already taken', 409)
    }
  }

  const passwordHash = await argon2.hash(dto.password, authConfig.argon2)

  let user: User
  try {
    user = await runInTransaction((tx) =>
      authRepository.createUserWithLogin(tx, {
        firstName: dto.firstName,
        middleName: dto.middleName,
        lastName: dto.lastName,
        username: dto.username,
        gender: dto.gender,
        birthdate: new Date(dto.birthdate),
        contactNo: dto.contactNo,
        address: dto.address,
        maritalStatus: dto.maritalStatus,
        emailHash,
        passwordHash,
      }),
    )
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = (error.meta?.target as string[] | undefined) ?? []
      if (target.includes('username')) {
        throw new AppError('This username is already taken', 409)
      }
      throw new AppError('An account with this email already exists', 409)
    }
    throw error
  }

  return { user, tokens: await issueAuthTokens(user.id) }
}

export async function login(dto: LoginDto): Promise<{ user: User; tokens: AuthTokens }> {
  const emailHash = hashEmail(dto.email)
  const loginInfo = await authRepository.findLoginByEmailHash(emailHash)

  if (!loginInfo || !loginInfo.passwordHash) {
    throw new AppError('Invalid email or password', 401)
  }

  const passwordValid = await argon2.verify(loginInfo.passwordHash, dto.password)
  if (!passwordValid) {
    throw new AppError('Invalid email or password', 401)
  }

  return { user: loginInfo.user, tokens: await issueAuthTokens(loginInfo.user.id) }
}

export async function refresh(refreshToken: string): Promise<AuthTokens> {
  const tokenHash = hashRefreshToken(refreshToken)
  const stored = await authRepository.findRefreshTokenByHash(tokenHash)

  if (!stored || stored.expiresAt < new Date() || stored.user.deletedAt) {
    throw new AppError('Invalid or expired refresh token', 401)
  }

  if (stored.revokedAt) {
    // A previously rotated/revoked token was reused — likely stolen. Revoke
    // the whole chain by revoking every active token for this user.
    logger.warn(
      { userId: stored.userId, tokenId: stored.id },
      'Reuse of a revoked refresh token detected; revoking all sessions',
    )
    await authRepository.revokeAllRefreshTokensForUser(stored.userId)
    throw new AppError('Invalid or expired refresh token', 401)
  }

  const accessToken = issueAccessToken(stored.userId)
  const { token: newRefreshToken, tokenHash: newTokenHash, expiresAt } = generateRefreshToken()

  await authRepository.rotateRefreshToken(stored.id, {
    userId: stored.userId,
    tokenHash: newTokenHash,
    expiresAt,
  })

  return { accessToken, refreshToken: newRefreshToken }
}

export async function logout(refreshToken: string): Promise<void> {
  const tokenHash = hashRefreshToken(refreshToken)
  const stored = await authRepository.findRefreshTokenByHash(tokenHash)

  if (!stored || stored.revokedAt) {
    return
  }

  await authRepository.revokeRefreshToken(stored.id)
}
