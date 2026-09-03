export interface AccessTokenPayload {
  sub: string
  type: 'access'
}

export interface RefreshTokenPayload {
  sub: string
  type: 'refresh'
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}
