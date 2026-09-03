import { randomBytes, createHash } from 'crypto'
import jwt from 'jsonwebtoken'
import ms from 'ms'
import { authConfig } from '../../config/auth.config'
import { AccessTokenPayload } from './types/auth.types'

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
