import { randomBytes, createHash } from 'crypto'
import jwt from 'jsonwebtoken'
import ms from 'ms'
import { authConfig } from '../../../config/auth.config'
import { logger } from '../../../shared/utils/logger'
import { AppError } from '../../../shared/errors/app-error'
import * as authRepository from '../repositories/auth.repository'
import { AccessTokenPayload, AuthTokens } from '../types/auth.types'

export function issueAccessToken(userId: string): string {
  return jwt.sign(
    { sub: userId, type: 'access' } satisfies AccessTokenPayload,
    authConfig.accessTokenSecret,
    { expiresIn: authConfig.accessTokenTtl } as jwt.SignOptions,
  )
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, authConfig.accessTokenSecret) as AccessTokenPayload
  if (payload.type !== 'access') {
    throw new Error('Invalid token type')
  }
  return payload
}

export function generateRefreshToken(): { token: string; tokenHash: string; expiresAt: Date } {
  const token = randomBytes(48).toString('hex')
  const tokenHash = hashRefreshToken(token)
  const expiresAt = new Date(Date.now() + ms(authConfig.refreshTokenTtl as ms.StringValue))

  return { token, tokenHash, expiresAt }
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function issueAuthTokens(userId: string): Promise<AuthTokens> {
  const accessToken = issueAccessToken(userId)
  const { token: refreshToken, tokenHash, expiresAt } = generateRefreshToken()

  await authRepository.createRefreshToken({ userId, tokenHash, expiresAt })

  return { accessToken, refreshToken }
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
