import { prisma } from '../../../database/client'
import { Interest } from '../../../database/types'

export function findAllInterests(): Promise<Interest[]> {
  return prisma.interest.findMany({ orderBy: { name: 'asc' } })
}

export function findInterestsByIds(ids: string[]): Promise<Interest[]> {
  return prisma.interest.findMany({ where: { id: { in: ids } } })
}

export function findUserInterests(userId: string): Promise<Interest[]> {
  return prisma.interest.findMany({
    where: { users: { some: { userId } } },
    orderBy: { name: 'asc' },
  })
}

export async function setUserInterests(userId: string, interestIds: string[]): Promise<void> {
  await prisma.$transaction([
    prisma.userInterest.deleteMany({ where: { userId } }),
    prisma.userInterest.createMany({
      data: interestIds.map((interestId) => ({ userId, interestId })),
    }),
  ])
}
