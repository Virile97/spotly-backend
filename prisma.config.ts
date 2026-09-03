import path from 'node:path'
import { PrismaPg } from '@prisma/adapter-pg'
import { defineConfig } from 'prisma/config'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

export default defineConfig({
  schema: path.join('src', 'database', 'prisma'),
  migrations: {
    path: path.join('src', 'database', 'migrations'),
    seed: 'tsx src/database/seeds/seed.ts',
  },
  datasource: {
    url: connectionString,
  },
  adapter: async () => new PrismaPg({ connectionString }),
})
