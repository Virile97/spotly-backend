import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../../src/infrastructure/storage/storage.service', () => ({
  createPresignedImageUpload: vi.fn(),
  isAllowedImageContentType: vi.fn((contentType: string) =>
    ['image/jpeg', 'image/png', 'image/webp'].includes(contentType),
  ),
}))

vi.mock('../../../../src/modules/profiles/repositories/profile.repository', () => ({
  updateProfileImage: vi.fn(),
}))

import * as storageService from '../../../../src/infrastructure/storage/storage.service'
import * as profileRepository from '../../../../src/modules/profiles/repositories/profile.repository'
import * as profileImageService from '../../../../src/modules/profiles/services/profile-image.service'

describe('profileImageService.requestImageUploadUrl', () => {
  beforeEach(() => {
    vi.mocked(storageService.createPresignedImageUpload).mockReset().mockResolvedValue({
      uploadUrl: 'https://r2.example.com/presigned',
      key: 'avatars/user-1/abc.jpg',
      expiresInSeconds: 300,
    })
  })

  it('requests a presigned upload scoped to the user and image type', async () => {
    const result = await profileImageService.requestImageUploadUrl('user-1', {
      type: 'avatar',
      contentType: 'image/jpeg',
    })

    expect(storageService.createPresignedImageUpload).toHaveBeenCalledWith({
      folder: 'avatars/user-1',
      contentType: 'image/jpeg',
    })
    expect(result.uploadUrl).toBe('https://r2.example.com/presigned')
  })

  it('uses the backgrounds folder for background image type', async () => {
    await profileImageService.requestImageUploadUrl('user-1', {
      type: 'background',
      contentType: 'image/png',
    })

    expect(storageService.createPresignedImageUpload).toHaveBeenCalledWith({
      folder: 'backgrounds/user-1',
      contentType: 'image/png',
    })
  })

  it('rejects unsupported content types with 400', async () => {
    vi.mocked(storageService.isAllowedImageContentType).mockReturnValueOnce(false)

    await expect(
      profileImageService.requestImageUploadUrl('user-1', {
        type: 'avatar',
        contentType: 'image/gif' as never,
      }),
    ).rejects.toMatchObject({ statusCode: 400 })
    expect(storageService.createPresignedImageUpload).not.toHaveBeenCalled()
  })
})

describe('profileImageService.confirmImageUpload', () => {
  beforeEach(() => {
    vi.mocked(profileRepository.updateProfileImage)
      .mockReset()
      .mockResolvedValue({ id: 'user-1' } as never)
  })

  it('saves the key to avatarKey when confirming an avatar upload', async () => {
    await profileImageService.confirmImageUpload('user-1', {
      type: 'avatar',
      key: 'avatars/user-1/abc.jpg',
    })

    expect(profileRepository.updateProfileImage).toHaveBeenCalledWith(
      'user-1',
      'avatarKey',
      'avatars/user-1/abc.jpg',
    )
  })

  it('saves the key to backgroundImageKey when confirming a background upload', async () => {
    await profileImageService.confirmImageUpload('user-1', {
      type: 'background',
      key: 'backgrounds/user-1/abc.jpg',
    })

    expect(profileRepository.updateProfileImage).toHaveBeenCalledWith(
      'user-1',
      'backgroundImageKey',
      'backgrounds/user-1/abc.jpg',
    )
  })

  it('rejects when the key does not belong to this user (spoofed key)', async () => {
    await expect(
      profileImageService.confirmImageUpload('user-1', {
        type: 'avatar',
        key: 'avatars/someone-else/abc.jpg',
      }),
    ).rejects.toMatchObject({ statusCode: 400 })
    expect(profileRepository.updateProfileImage).not.toHaveBeenCalled()
  })

  it('rejects when the key belongs to the wrong image type folder', async () => {
    await expect(
      profileImageService.confirmImageUpload('user-1', {
        type: 'avatar',
        key: 'backgrounds/user-1/abc.jpg',
      }),
    ).rejects.toMatchObject({ statusCode: 400 })
  })
})
