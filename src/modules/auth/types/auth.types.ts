export interface AccessTokenPayload {
  sub: string
  type: 'access'
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}
