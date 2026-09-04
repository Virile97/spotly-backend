import { z } from 'zod'
import { updateProfileSchema } from '../schemas/update-profile.schema'

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>
