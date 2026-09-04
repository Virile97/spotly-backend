import { prisma } from '../../../database/client'
import { User } from '../../../database/types'

export function findProfileByUsername(username: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { username } })
}

export function findUserByUsernameExcludingId(
  username: string,
  excludeUserId: string,
): Promise<User | null> {
  return prisma.user.findFirst({ where: { username, id: { not: excludeUserId } } })
}

export interface UpdateProfileParams {
  username?: string
  displayName?: string | null
  firstName?: string
  middleName?: string | null
  lastName?: string
  bio?: string | null
  address?: string | null
  maritalStatus?: User['maritalStatus'] | null
}

export function updateProfile(userId: string, data: UpdateProfileParams): Promise<User> {
  return prisma.user.update({ where: { id: userId }, data })
}

export function updateProfileImage(
  userId: string,
  field: 'avatarKey' | 'backgroundImageKey',
  key: string,
): Promise<User> {
  return prisma.user.update({ where: { id: userId }, data: { [field]: key } })
}
