import { z } from 'zod'
import { Gender, MaritalStatus } from '../../../database/types'

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  username: z
    .string()
    .trim()
    .regex(
      /^[a-zA-Z0-9_]{3,30}$/,
      'Username must be 3-30 characters (letters, numbers, underscore)',
    )
    .optional(),
  firstName: z.string().trim().min(1).max(80),
  middleName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80),
  gender: z.enum(Gender),
  birthdate: z.iso.date(),
  contactNo: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s-]{6,19}$/, 'Invalid contact number')
    .optional(),
  address: z.string().trim().min(1).max(255).optional(),
  maritalStatus: z.enum(MaritalStatus).optional(),
})
