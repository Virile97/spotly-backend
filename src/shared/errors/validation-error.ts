import { AppError } from './app-error'

export interface ValidationIssue {
  path: string
  message: string
}

export class ValidationError extends AppError {
  public readonly issues: ValidationIssue[]

  constructor(issues: ValidationIssue[] = [], message = 'Validation failed') {
    super(message, 400)
    this.issues = issues
  }
}
