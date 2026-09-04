import { AppError } from './app-error'
import { ValidationError } from './validation-error'

export interface ErrorResponseBody {
  error: {
    message: string
    issues?: ValidationError['issues']
  }
}

export function resolveStatusCode(err: Error): number {
  return err instanceof AppError ? err.statusCode : 500
}

export function toErrorResponseBody(err: Error): ErrorResponseBody {
  return {
    error: {
      message: err.message || 'Internal Server Error',
      ...(err instanceof ValidationError && err.issues.length > 0 ? { issues: err.issues } : {}),
    },
  }
}
