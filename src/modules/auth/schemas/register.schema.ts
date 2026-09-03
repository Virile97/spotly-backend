import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().trim().min(1).max(80),
})
