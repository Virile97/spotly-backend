import { Router } from 'express'
import { authMiddleware } from '../../../shared/middleware/auth.middleware'
import * as interestController from '../controllers/interest.controller'

export const interestRouter = Router()

interestRouter.use(authMiddleware)

interestRouter.get('/', interestController.list)
