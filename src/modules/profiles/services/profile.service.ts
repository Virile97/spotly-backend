import { appConfig } from '../../../config/app.config'
import { User } from '../../../database/types'
import { toPublicImageUrl } from '../../../infrastructure/storage/storage.service'
import { AppError } from '../../../shared/errors/app-error'
import * as profileRepository from '../repositories/profile.repository'
import { UpdateProfileDto } from '../dto/update-profile.dto'

export interface ProfileResponse {
  id: string
  username: string | null
  firstName: string
  middleName: string | null
  lastName: string
  bio: string | null
  avatarUrl: string | null
  backgroundImageUrl: string | null
  followersCount: number
  followingCount: number
  postsCount: number
  isActive: boolean
  createdAt: Date
}

export function toProfileResponse(user: User): ProfileResponse {
  return {
    id: user.id,
    username: user.username,
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
    bio: user.bio,
    avatarUrl: toPublicImageUrl(user.avatarKey),
    backgroundImageUrl: toPublicImageUrl(user.backgroundImageKey),
    followersCount: user.followersCount,
    followingCount: user.followingCount,
    postsCount: user.postsCount,
    isActive: user.isActive,
    createdAt: user.createdAt,
  }
}

export async function getProfileByUsername(username: string): Promise<User> {
  const user = await profileRepository.findProfileByUsername(username)
  if (!user || user.deletedAt) {
    throw new AppError('Profile not found', 404)
  }
  return user
}

export async function updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
  if (dto.username) {
    const existing = await profileRepository.findUserByUsernameExcludingId(dto.username, userId)
    if (existing) {
      throw new AppError('This username is already taken', 409)
    }
  }

  return profileRepository.updateProfile(userId, dto)
}

export function getShareUrl(username: string): { url: string } {
  return { url: `${appConfig.publicWebBaseUrl.replace(/\/$/, '')}/u/${username}` }
}

export async function getProfileForShare(username: string): Promise<{ url: string }> {
  const user = await profileRepository.findProfileByUsername(username)
  if (!user || user.deletedAt) {
    throw new AppError('Profile not found', 404)
  }
  return getShareUrl(username)
}
