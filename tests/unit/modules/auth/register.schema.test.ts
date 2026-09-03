import { describe, expect, it } from 'vitest'
import { registerSchema } from '../../../../src/modules/auth/schemas/register.schema'

const validPayload = {
  email: 'alice@example.com',
  password: 'correcthorsebatterystaple',
  displayName: 'Alice',
  firstName: 'Alice',
  lastName: 'Doe',
  gender: 'FEMALE',
  birthdate: '1990-01-01',
}

describe('registerSchema', () => {
  it('accepts a valid payload with only required fields', () => {
    const result = registerSchema.safeParse(validPayload)
    expect(result.success).toBe(true)
  })

  it('accepts a valid payload with all optional fields populated', () => {
    const result = registerSchema.safeParse({
      ...validPayload,
      middleName: 'Q',
      nickname: 'alice_doe',
      contactNo: '+63 917 123 4567',
      address: '123 Main St',
      maritalStatus: 'SINGLE',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid email format', () => {
    const result = registerSchema.safeParse({ ...validPayload, email: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('rejects a password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({ ...validPayload, password: 'short' })
    expect(result.success).toBe(false)
  })

  it('rejects a missing required field', () => {
    const { firstName: _firstName, ...withoutFirstName } = validPayload
    const result = registerSchema.safeParse(withoutFirstName)
    expect(result.success).toBe(false)
  })

  it('rejects an invalid gender enum value', () => {
    const result = registerSchema.safeParse({ ...validPayload, gender: 'ROBOT' })
    expect(result.success).toBe(false)
  })

  it('rejects a malformed birthdate', () => {
    const result = registerSchema.safeParse({ ...validPayload, birthdate: 'not-a-date' })
    expect(result.success).toBe(false)
  })

  it('rejects a nickname with invalid characters', () => {
    const result = registerSchema.safeParse({ ...validPayload, nickname: 'not valid!' })
    expect(result.success).toBe(false)
  })

  it('rejects a nickname shorter than 3 characters', () => {
    const result = registerSchema.safeParse({ ...validPayload, nickname: 'ab' })
    expect(result.success).toBe(false)
  })

  it('lowercases and trims the email', () => {
    const result = registerSchema.safeParse({ ...validPayload, email: '  ALICE@Example.com  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('alice@example.com')
    }
  })
})
