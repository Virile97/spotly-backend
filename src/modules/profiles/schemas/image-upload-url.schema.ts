import { z } from 'zod'

export const imageUploadUrlSchema = z.object({
  type: z.enum(['avatar', 'background']),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
})
