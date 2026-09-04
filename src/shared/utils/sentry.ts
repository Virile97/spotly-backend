import * as Sentry from '@sentry/node'
import path from 'path'
import { env, isProduction } from '../../config/env'
import { logger } from './logger'

const SRC_ROOT = path.join(__dirname, '..', '..')

export const sentryEnabled = Boolean(env.sentryDsn)

export function initSentry(): void {
  if (!sentryEnabled) {
    if (isProduction) {
      logger.warn('SENTRY_DSN is not set — errors will not be reported to Sentry')
    }
    return
  }

  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.nodeEnv,
    release: `spotly-backend@${process.env.npm_package_version ?? '0.0.0'}`,
    tracesSampleRate: env.sentryTracesSampleRate,
    sendDefaultPii: false,
  })

  logger.info('Sentry initialized')
}

function resolveErrorModule(error: Error): string | undefined {
  const stack = error.stack
  if (!stack) return undefined

  const projectFrame = stack
    .split('\n')
    .slice(1)
    .map((line) => line.trim())
    .find((line) => line.includes(SRC_ROOT) && !line.includes('node_modules'))

  if (!projectFrame) return undefined

  const match = projectFrame.match(/\(?([^():]+):\d+:\d+\)?$/)
  const filePath = match?.[1]
  if (!filePath) return undefined

  return path
    .relative(SRC_ROOT, filePath)
    .replace(/\.(ts|js)$/, '')
    .replace(/\\/g, '/')
}

export interface CaptureContext {
  requestId?: string
  route?: string
  method?: string
  statusCode?: number
  userId?: string
}

export function captureError(error: Error, context: CaptureContext = {}): void {
  if (!sentryEnabled) {
    return
  }

  const module = resolveErrorModule(error)

  Sentry.withScope((scope) => {
    if (module) scope.setTag('module', module)
    if (context.route) scope.setTag('route', context.route)
    if (context.method) scope.setTag('http.method', context.method)
    if (context.statusCode) scope.setTag('http.status_code', context.statusCode)
    if (context.requestId) scope.setTag('request_id', context.requestId)
    if (context.userId) scope.setUser({ id: context.userId })

    scope.setContext('error_source', {
      module: module ?? 'unknown',
      environment: env.nodeEnv,
    })

    Sentry.captureException(error)
  })
}
