import { env } from './env'

export const appConfig = {
  port: env.port,
  nodeEnv: env.nodeEnv,
  corsOrigin: env.corsOrigin,
  spotlyApiKey: env.spotlyApiKey,
}
