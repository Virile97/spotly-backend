import { Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../../src/modules/auth/auth.service', () => ({
  register: vi.fn(),
}))

import * as authController from '../../../../src/modules/auth/auth.controller'
import * as authService from '../../../../src/modules/auth/auth.service'

function mockResponse(): Response {
  const res = {} as Response
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  return res
}

const user = {
  id: 'user-1',
  firstName: 'Alice',
  middleName: null,
  lastName: 'Doe',
  username: 'alice_doe',
  gender: 'FEMALE',
  birthdate: new Date('1990-01-01'),
  contactNo: '+639171234567',
  address: '123 Main St',
  maritalStatus: 'SINGLE',
  isActive: true,
  bio: null,
  avatarUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
}

describe('authController.register', () => {
  beforeEach(() => {
    vi.mocked(authService.register)
      .mockReset()
      .mockResolvedValue({
        user: user as never,
        tokens: { accessToken: 'access-token', refreshToken: 'refresh-token' },
      })
  })

  it('responds 201 with the created user and tokens, excluding password fields', async () => {
    const req = { body: {} } as Request
    const res = mockResponse()

    await authController.register(req, res)

    expect(res.status).toHaveBeenCalledWith(201)
    const [payload] = vi.mocked(res.json).mock.calls[0]
    expect(payload.user.id).toBe('user-1')
    expect(payload.tokens).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' })
    expect(payload.user).not.toHaveProperty('password')
    expect(payload.user).not.toHaveProperty('passwordHash')
  })

  it('excludes contactNo and address from the response', async () => {
    const req = { body: {} } as Request
    const res = mockResponse()

    await authController.register(req, res)

    const [payload] = vi.mocked(res.json).mock.calls[0]
    expect(payload.user).not.toHaveProperty('contactNo')
    expect(payload.user).not.toHaveProperty('address')
  })

  it('propagates service errors to the caller (for the error middleware to handle)', async () => {
    vi.mocked(authService.register).mockRejectedValue(new Error('conflict'))
    const req = { body: {} } as Request
    const res = mockResponse()

    await expect(authController.register(req, res)).rejects.toThrow('conflict')
  })
})
