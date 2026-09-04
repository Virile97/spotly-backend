import { NextFunction, Request, Response } from 'express'
import { ZodType } from 'zod'
import { ValidationError } from '../errors/validation-error'

interface ValidationSchemas {
  body?: ZodType
  params?: ZodType
  query?: ZodType
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    for (const [target, schema] of Object.entries(schemas) as [
      keyof ValidationSchemas,
      ZodType | undefined,
    ][]) {
      if (!schema) continue

      const result = schema.safeParse(req[target])
      if (!result.success) {
        const issues = result.error.issues.map((issue) => ({
          path: `${target}.${issue.path.join('.')}`,
          message: issue.message,
        }))
        return next(new ValidationError(issues))
      }

      req[target] = result.data
    }

    next()
  }
}
