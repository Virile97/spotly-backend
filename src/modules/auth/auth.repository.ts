import { prisma } from '../../database/client'
import { AuthProvider, User, UserLoginInfo } from '../../database/types'
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

export function createUserWithLogin(
  tx: TransactionClient,
  params: {
    displayName: string
    emailHash: string
    passwordHash: string
  },
): Promise<User> {
  return tx.user.create({
    data: {
      displayName: params.displayName,
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
