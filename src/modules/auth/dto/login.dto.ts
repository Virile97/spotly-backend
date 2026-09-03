import { z } from 'zod'
import { loginSchema } from '../schemas/login.schema'

export type LoginDto = z.infer<typeof loginSchema>
