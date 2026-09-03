import { Router } from 'express'
import { authRouter } from '../modules/auth'
import { healthRouter } from './health.routes'

export const apiRouter = Router()

apiRouter.use('/health', healthRouter)
apiRouter.use('/auth', authRouter)
