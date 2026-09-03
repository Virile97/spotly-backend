import pino from 'pino'
import { env, isDevelopment } from './env'

export const logger = pino({
  level: env.logLevel,
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:standard' },
      }
    : undefined,
})
