import { appConfig } from '../../../config/app.config'
import { findUserById } from '../../../database/repositories/user.repository'
import { User } from '../../../database/types'
import { emitToRoom } from '../../../infrastructure/websocket/socket-emitter'
import { toPublicImageUrl } from '../../../infrastructure/storage/storage.service'
import {
  getUserInterests,
  InterestResponse,
  setUserInterests as setUserInterestsInternal,
  toInterestResponse,
} from '../../interests/services/interest.service'
import { userRoom } from '../../messaging/socket/socket.rooms'
import { AppError } from '../../../shared/errors/app-error'
import * as profileRepository from '../repositories/profile.repository'
import { UpdateProfileDto } from '../dto/update-profile.dto'
import { ProfileSocketEvent } from './profile.events'

export interface ProfileResponse {
  id: string
  username: string | null
  displayName: string | null
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
  interests: InterestResponse[]
}

export function toProfileResponse(user: User, interests: InterestResponse[] = []): ProfileResponse {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
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
    interests,
  }
}

export async function buildProfileResponse(user: User): Promise<ProfileResponse> {
  const interests = await getUserInterests(user.id)
  return toProfileResponse(user, interests.map(toInterestResponse))
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

  const user = await profileRepository.updateProfile(userId, dto)

  emitToRoom(userRoom(userId), ProfileSocketEvent.ProfileUpdated, await buildProfileResponse(user))

  return user
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

export async function setUserInterests(
  userId: string,
  interestIds: string[],
): Promise<InterestResponse[]> {
  const interests = await setUserInterestsInternal(userId, interestIds)

  const user = await findUserById(userId)
  if (user) {
    emitToRoom(
      userRoom(userId),
      ProfileSocketEvent.ProfileUpdated,
      await buildProfileResponse(user),
    )
  }

  return interests.map(toInterestResponse)
}
