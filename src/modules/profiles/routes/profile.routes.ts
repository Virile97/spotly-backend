import { Router } from 'express'
import { authMiddleware } from '../../../shared/middleware/auth.middleware'
import { validate } from '../../../shared/middleware/validate.middleware'
import * as profileController from '../controllers/profile.controller'
import { confirmImageSchema } from '../schemas/confirm-image.schema'
import { imageUploadUrlSchema } from '../schemas/image-upload-url.schema'
import { updateProfileSchema } from '../schemas/update-profile.schema'

export const profileRouter = Router()

profileRouter.use(authMiddleware)

profileRouter.get('/me', profileController.me)
profileRouter.patch('/me', validate({ body: updateProfileSchema }), profileController.updateMe)
profileRouter.post(
  '/me/image-upload-url',
  validate({ body: imageUploadUrlSchema }),
  profileController.requestImageUploadUrl,
)
profileRouter.patch(
  '/me/image',
  validate({ body: confirmImageSchema }),
  profileController.confirmImage,
)
profileRouter.get('/:username/share', profileController.share)
profileRouter.get('/:username', profileController.getByUsername)
