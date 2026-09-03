import { describe, expect, it } from 'vitest'

describe('sentry bootstrap (disabled, no SENTRY_DSN in test env)', () => {
  it('reports sentryEnabled as false when SENTRY_DSN is not set', async () => {
    const { sentryEnabled } = await import('../../../src/bootstrap/sentry.js')

    expect(sentryEnabled).toBe(false)
  })

  it('initSentry() does not throw when disabled', async () => {
    const { initSentry } = await import('../../../src/bootstrap/sentry.js')

    expect(() => initSentry()).not.toThrow()
  })

  it('captureError() does not throw and is a safe no-op when disabled', async () => {
    const { captureError } = await import('../../../src/bootstrap/sentry.js')

    expect(() =>
      captureError(new Error('boom'), {
        requestId: 'req-1',
        route: '/api/auth/register',
        method: 'POST',
        statusCode: 500,
        userId: 'user-1',
      }),
    ).not.toThrow()
  })

  it('captureError() does not throw when called with no context', async () => {
    const { captureError } = await import('../../../src/bootstrap/sentry.js')

    expect(() => captureError(new Error('boom'))).not.toThrow()
  })
})
