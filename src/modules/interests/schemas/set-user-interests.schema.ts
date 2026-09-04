import { z } from 'zod'
import { MAX_USER_INTERESTS } from '../services/interest.service'

export const setUserInterestsSchema = z.object({
  interestIds: z.array(z.string().uuid()).max(MAX_USER_INTERESTS),
})
