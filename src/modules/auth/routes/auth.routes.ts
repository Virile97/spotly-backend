import { Router } from 'express'
import { authMiddleware } from '../../../shared/middleware/auth.middleware'
import { validate } from '../../../shared/middleware/validate.middleware'
import * as authController from '../controllers/auth.controller'
import { loginSchema } from '../schemas/login.schema'
import { refreshTokenSchema } from '../schemas/refresh-token.schema'
import { registerSchema } from '../schemas/register.schema'

export const authRouter = Router()

authRouter.post('/register', validate({ body: registerSchema }), authController.register)
authRouter.post('/login', validate({ body: loginSchema }), authController.login)
authRouter.post('/refresh', validate({ body: refreshTokenSchema }), authController.refresh)
authRouter.post('/logout', validate({ body: refreshTokenSchema }), authController.logout)
authRouter.get('/me', authMiddleware, authController.me)
