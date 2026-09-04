import { logger } from '../../shared/utils/logger'
import { prisma } from '../client'

async function main(): Promise<void> {
  logger.info('Seeding database...')
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
