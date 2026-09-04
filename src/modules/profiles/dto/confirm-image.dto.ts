import { z } from 'zod'
import { confirmImageSchema } from '../schemas/confirm-image.schema'

export type ConfirmImageDto = z.infer<typeof confirmImageSchema>
