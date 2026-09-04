import { z } from 'zod'
import { setUserInterestsSchema } from '../schemas/set-user-interests.schema'

export type SetUserInterestsDto = z.infer<typeof setUserInterestsSchema>
