import { env } from './env'

export const databaseConfig = {
  url: env.databaseUrl,
  poolMax: env.databasePoolMax,
  slowQueryThresholdMs: env.databaseSlowQueryMs,
}
