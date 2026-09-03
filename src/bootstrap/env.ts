import dotenv from 'dotenv'

dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' })

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const env = {
  nodeEnv: requireEnv('NODE_ENV', 'development'),
  port: parseInt(requireEnv('PORT', '3000'), 10),
  logLevel: requireEnv('LOG_LEVEL', 'info'),
  corsOrigin: requireEnv('CORS_ORIGIN', 'http://localhost:3000'),
  databaseUrl: requireEnv('DATABASE_URL'),
  databasePoolMax: parseInt(requireEnv('DATABASE_POOL_MAX', '10'), 10),
  databaseSlowQueryMs: parseInt(requireEnv('DATABASE_SLOW_QUERY_MS', '200'), 10),
  jwtAccessSecret: requireEnv('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: requireEnv('JWT_REFRESH_SECRET'),
  jwtAccessTtl: requireEnv('JWT_ACCESS_TTL', '15m'),
  jwtRefreshTtl: requireEnv('JWT_REFRESH_TTL', '30d'),
  emailHashSecret: requireEnv('EMAIL_HASH_SECRET'),
}

export const isProduction = env.nodeEnv === 'production'
export const isDevelopment = env.nodeEnv === 'development'
export const isTest = env.nodeEnv === 'test'
