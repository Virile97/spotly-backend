import { prisma } from '../client'
import { User } from '../types'

export function findUserById(userId: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id: userId } })
}
