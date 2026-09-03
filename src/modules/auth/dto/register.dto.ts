import { z } from 'zod'
import { registerSchema } from '../schemas/register.schema'

export type RegisterDto = z.infer<typeof registerSchema>
