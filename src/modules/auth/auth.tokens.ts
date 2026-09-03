import jwt from 'jsonwebtoken'
import { authConfig } from '../../config/auth.config'
import { AccessTokenPayload, AuthTokens, RefreshTokenPayload } from './types/auth.types'

export function issueTokens(userId: string): AuthTokens {
  const accessToken = jwt.sign(
    { sub: userId, type: 'access' } satisfies AccessTokenPayload,
    authConfig.accessTokenSecret,
    { expiresIn: authConfig.accessTokenTtl } as jwt.SignOptions,
  )

  const refreshToken = jwt.sign(
    { sub: userId, type: 'refresh' } satisfies RefreshTokenPayload,
    authConfig.refreshTokenSecret,
    { expiresIn: authConfig.refreshTokenTtl } as jwt.SignOptions,
  )

  return { accessToken, refreshToken }
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, authConfig.accessTokenSecret) as AccessTokenPayload
  if (payload.type !== 'access') {
    throw new Error('Invalid token type')
  }
  return payload
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const payload = jwt.verify(token, authConfig.refreshTokenSecret) as RefreshTokenPayload
  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type')
  }
  return payload
}
