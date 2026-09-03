import argon2 from 'argon2'
import { env } from '../bootstrap/env'

export const authConfig = {
  accessTokenSecret: env.jwtAccessSecret,
  refreshTokenSecret: env.jwtRefreshSecret,
  accessTokenTtl: env.jwtAccessTtl,
  refreshTokenTtl: env.jwtRefreshTtl,
  emailHashSecret: env.emailHashSecret,
  argon2: {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  } satisfies argon2.HashOptions,
}
