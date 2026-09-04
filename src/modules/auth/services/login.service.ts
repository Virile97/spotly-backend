import argon2 from 'argon2'
import { createHmac } from 'crypto'
import { authConfig } from '../../../config/auth.config'
import { User } from '../../../database/types'
import { AppError } from '../../../shared/errors/app-error'
import * as authRepository from '../repositories/auth.repository'
import { issueAuthTokens } from './token.service'
import { LoginDto } from '../dto/login.dto'
import { AuthTokens } from '../types/auth.types'

function hashEmail(email: string): string {
  return createHmac('sha256', authConfig.emailHashSecret).update(email).digest('hex')
}

export async function login(dto: LoginDto): Promise<{ user: User; tokens: AuthTokens }> {
  const emailHash = hashEmail(dto.email)
  const loginInfo = await authRepository.findLoginByEmailHash(emailHash)

  if (!loginInfo || !loginInfo.passwordHash) {
    throw new AppError('Invalid email or password', 401)
  }

  const passwordValid = await argon2.verify(loginInfo.passwordHash, dto.password)
  if (!passwordValid) {
    throw new AppError('Invalid email or password', 401)
  }

  return { user: loginInfo.user, tokens: await issueAuthTokens(loginInfo.user.id) }
}
