import { z } from 'zod'
import { imageUploadUrlSchema } from '../schemas/image-upload-url.schema'

export type ImageUploadUrlDto = z.infer<typeof imageUploadUrlSchema>
