import { logger } from '../../shared/utils/logger'
import { prisma } from '../client'

const INTERESTS: { name: string; icon: string }[] = [
  { name: 'Coffee', icon: '☕' },
  { name: 'Photography', icon: '📷' },
  { name: 'Travel', icon: '🏖️' },
  { name: 'Food', icon: '🍜' },
  { name: 'Music', icon: '🎵' },
  { name: 'Fitness', icon: '🏋️' },
  { name: 'Reading', icon: '📚' },
  { name: 'Gaming', icon: '🎮' },
  { name: 'Art', icon: '🎨' },
  { name: 'Outdoors', icon: '🥾' },
  { name: 'Movies', icon: '🎬' },
  { name: 'Pets', icon: '🐾' },
]

async function seedInterests(): Promise<void> {
  for (const interest of INTERESTS) {
    await prisma.interest.upsert({
      where: { name: interest.name },
      update: { icon: interest.icon },
      create: interest,
    })
  }
  logger.info(`Seeded ${INTERESTS.length} interests`)
}

async function main(): Promise<void> {
  logger.info('Seeding database...')
  await seedInterests()
  logger.info('Seed complete')
}

main()
  .catch((error) => {
    logger.error({ error }, 'Seed failed')
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
