import { logger } from '../shared/utils/logger'
import { captureError } from '../shared/utils/sentry'
import { bootstrap } from './bootstrap'

bootstrap().catch((error) => {
  logger.error({ error }, 'Failed to start server')
  captureError(error, { route: 'server.bootstrap' })
  process.exit(1)
})
