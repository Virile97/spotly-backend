import { prisma } from '../../database/client'
import { AuthProvider, Gender, MaritalStatus, User, UserLoginInfo } from '../../database/types'
import { TransactionClient } from '../../database/transactions/transaction'

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
  displayName: string
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
      displayName: params.displayName,
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

export function findUserById(userId: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id: userId } })
}
