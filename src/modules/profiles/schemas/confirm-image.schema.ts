import { z } from 'zod'

export const confirmImageSchema = z.object({
  type: z.enum(['avatar', 'background']),
  key: z.string().trim().min(1),
})
