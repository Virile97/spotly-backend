import { env } from './env'

export const socketConfig = {
  corsOrigin: env.socketCorsOrigin ?? env.corsOrigin,
}
