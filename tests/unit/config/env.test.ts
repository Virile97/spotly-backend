import { describe, expect, it } from 'vitest'

describe('env loading', () => {
  it('loads .env.test and sets nodeEnv to test', async () => {
    const { env, isTest } = await import('../../../src/config/env.js')

    expect(isTest).toBe(true)
    expect(env.nodeEnv).toBe('test')
    expect(env.databaseUrl).toContain('spotly_test')
  })
})
