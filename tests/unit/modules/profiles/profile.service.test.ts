import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../../src/config/app.config', () => ({
  appConfig: { publicWebBaseUrl: 'https://spotly.app' },
}))

vi.mock('../../../../src/infrastructure/storage/storage.service', () => ({
  toPublicImageUrl: vi.fn((key: string | null) => (key ? `https://cdn.example.com/${key}` : null)),
}))

vi.mock('../../../../src/modules/profiles/repositories/profile.repository', () => ({
  findProfileByUsername: vi.fn(),
  findUserByUsernameExcludingId: vi.fn(),
  updateProfile: vi.fn(),
}))

import * as profileRepository from '../../../../src/modules/profiles/repositories/profile.repository'
import * as profileService from '../../../../src/modules/profiles/services/profile.service'
import { AppError } from '../../../../src/shared/errors/app-error'

const baseUser = {
  id: 'user-1',
  username: 'alice_doe',
  firstName: 'Alice',
  middleName: null,
  lastName: 'Doe',
  bio: 'hello world',
  avatarKey: 'avatars/user-1/pic.jpg',
  backgroundImageKey: null,
  followersCount: 1204,
  followingCount: 312,
  postsCount: 86,
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date(),
  deletedAt: null,
}

describe('toProfileResponse', () => {
  it('maps a user to the public profile shape with resolved image URLs', () => {
    const result = profileService.toProfileResponse(baseUser as never)

    expect(result).toEqual({
      id: 'user-1',
      username: 'alice_doe',
      firstName: 'Alice',
      middleName: null,
      lastName: 'Doe',
      bio: 'hello world',
      avatarUrl: 'https://cdn.example.com/avatars/user-1/pic.jpg',
      backgroundImageUrl: null,
      followersCount: 1204,
      followingCount: 312,
      postsCount: 86,
      isActive: true,
      createdAt: baseUser.createdAt,
    })
  })

  it('never leaks internal fields like storage keys or password data', () => {
    const result = profileService.toProfileResponse(baseUser as never)

    expect(result).not.toHaveProperty('avatarKey')
    expect(result).not.toHaveProperty('backgroundImageKey')
    expect(result).not.toHaveProperty('deletedAt')
  })
})

describe('profileService.getProfileByUsername', () => {
  beforeEach(() => {
    vi.mocked(profileRepository.findProfileByUsername).mockReset()
  })

  it('returns the user for an existing, active username', async () => {
    vi.mocked(profileRepository.findProfileByUsername).mockResolvedValue(baseUser as never)

    const result = await profileService.getProfileByUsername('alice_doe')

    expect(result).toEqual(baseUser)
  })

  it('throws 404 when no user matches the username', async () => {
    vi.mocked(profileRepository.findProfileByUsername).mockResolvedValue(null)

    await expect(profileService.getProfileByUsername('ghost')).rejects.toMatchObject({
      statusCode: 404,
      message: 'Profile not found',
    })
  })

  it('throws 404 when the user is soft-deleted', async () => {
    vi.mocked(profileRepository.findProfileByUsername).mockResolvedValue({
      ...baseUser,
      deletedAt: new Date(),
    } as never)

    await expect(profileService.getProfileByUsername('alice_doe')).rejects.toMatchObject({
      statusCode: 404,
    })
  })
})

describe('profileService.updateProfile', () => {
  beforeEach(() => {
    vi.mocked(profileRepository.findUserByUsernameExcludingId).mockReset().mockResolvedValue(null)
    vi.mocked(profileRepository.updateProfile)
      .mockReset()
      .mockResolvedValue(baseUser as never)
  })

  it('updates allowed fields', async () => {
    const result = await profileService.updateProfile('user-1', { bio: 'new bio' })

    expect(profileRepository.updateProfile).toHaveBeenCalledWith('user-1', { bio: 'new bio' })
    expect(result).toEqual(baseUser)
  })

  it('checks username availability excluding the current user when username is provided', async () => {
    await profileService.updateProfile('user-1', { username: 'new_handle' })

    expect(profileRepository.findUserByUsernameExcludingId).toHaveBeenCalledWith(
      'new_handle',
      'user-1',
    )
  })

  it('skips the username availability check when username is not provided', async () => {
    await profileService.updateProfile('user-1', { bio: 'new bio' })

    expect(profileRepository.findUserByUsernameExcludingId).not.toHaveBeenCalled()
  })

  it('rejects with 409 when the username is already taken by another user', async () => {
    vi.mocked(profileRepository.findUserByUsernameExcludingId).mockResolvedValue(baseUser as never)

    await expect(
      profileService.updateProfile('user-1', { username: 'taken_handle' }),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: 'This username is already taken',
    })
    expect(profileRepository.updateProfile).not.toHaveBeenCalled()
  })
})

describe('profileService.getShareUrl / getProfileForShare', () => {
  beforeEach(() => {
    vi.mocked(profileRepository.findProfileByUsername).mockReset()
  })

  it('builds a canonical share URL from the public web base URL and username', () => {
    expect(profileService.getShareUrl('alice_doe')).toEqual({
      url: 'https://spotly.app/u/alice_doe',
    })
  })

  it('returns the share URL when the profile exists', async () => {
    vi.mocked(profileRepository.findProfileByUsername).mockResolvedValue(baseUser as never)

    const result = await profileService.getProfileForShare('alice_doe')

    expect(result).toEqual({ url: 'https://spotly.app/u/alice_doe' })
  })

  it('throws 404 when sharing a non-existent profile', async () => {
    vi.mocked(profileRepository.findProfileByUsername).mockResolvedValue(null)

    await expect(profileService.getProfileForShare('ghost')).rejects.toMatchObject({
      statusCode: 404,
    })
  })
})

describe('AppError shape', () => {
  it('is thrown with the expected status code for duplicates', () => {
    const error = new AppError('conflict', 409)
    expect(error.statusCode).toBe(409)
    expect(error.isOperational).toBe(true)
  })
})
