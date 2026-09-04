import { z } from 'zod'
import { MaritalStatus } from '../../../database/types'

export const updateProfileSchema = z
  .object({
    username: z
      .string()
      .trim()
      .regex(
        /^[a-zA-Z0-9_]{3,30}$/,
        'Username must be 3-30 characters (letters, numbers, underscore)',
      ),
    firstName: z.string().trim().min(1).max(80),
    middleName: z.string().trim().min(1).max(80).nullable(),
    lastName: z.string().trim().min(1).max(80),
    bio: z.string().trim().max(500).nullable(),
    address: z.string().trim().min(1).max(255).nullable(),
    maritalStatus: z.enum(MaritalStatus).nullable(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields provided to update' })
