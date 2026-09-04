import { prisma } from '../../../database/client'
import {
  AuthProvider,
  Gender,
  MaritalStatus,
  RefreshToken,
  User,
  UserLoginInfo,
} from '../../../database/types'
import { TransactionClient } from '../../../database/transactions/transaction'

export function findLoginByEmailHash(
  emailHash: string,
  authProvider: AuthProvider = AuthProvider.EMAIL,
): Promise<(UserLoginInfo & { user: User }) | null> {
  return prisma.userLoginInfo.findUnique({
    where: { authProvider_emailHash: { authProvider, emailHash } },
    include: { user: true },
  })
}

export interface CreateUserWithLoginParams {
  firstName: string
  middleName?: string
  lastName: string
  username?: string
  gender: Gender
  birthdate: Date
  contactNo?: string
  address?: string
  maritalStatus?: MaritalStatus
  emailHash: string
  passwordHash: string
}

export function createUserWithLogin(
  tx: TransactionClient,
  params: CreateUserWithLoginParams,
): Promise<User> {
  return tx.user.create({
    data: {
      firstName: params.firstName,
      middleName: params.middleName,
      lastName: params.lastName,
      username: params.username,
      gender: params.gender,
      birthdate: params.birthdate,
      contactNo: params.contactNo,
      address: params.address,
      maritalStatus: params.maritalStatus,
      loginInfos: {
        create: {
          authProvider: AuthProvider.EMAIL,
          emailHash: params.emailHash,
          passwordHash: params.passwordHash,
        },
      },
    },
  })
}

export function findUserByUsername(username: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { username } })
}

export function createRefreshToken(params: {
  userId: string
  tokenHash: string
  expiresAt: Date
}): Promise<RefreshToken> {
  return prisma.refreshToken.create({
    data: {
      userId: params.userId,
      tokenHash: params.tokenHash,
      expiresAt: params.expiresAt,
    },
  })
}

export function findRefreshTokenByHash(
  tokenHash: string,
): Promise<(RefreshToken & { user: User }) | null> {
  return prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  })
}

export function rotateRefreshToken(
  oldTokenId: string,
  newToken: { userId: string; tokenHash: string; expiresAt: Date },
): Promise<RefreshToken> {
  return prisma.$transaction(async (tx) => {
    const created = await tx.refreshToken.create({ data: newToken })
    await tx.refreshToken.update({
      where: { id: oldTokenId },
      data: { revokedAt: new Date(), replacedBy: created.id },
    })
    return created
  })
}

export function revokeRefreshToken(tokenId: string): Promise<RefreshToken> {
  return prisma.refreshToken.update({
    where: { id: tokenId },
    data: { revokedAt: new Date() },
  })
}

export async function revokeAllRefreshTokensForUser(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}
