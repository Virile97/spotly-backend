import argon2 from 'argon2'
import { createHmac } from 'crypto'
import { runInTransaction } from '../../../database/transactions/transaction'
import { Prisma, User } from '../../../database/types'
import { AppError } from '../../../shared/errors/app-error'
import { authConfig } from '../../../config/auth.config'
import * as authRepository from '../repositories/auth.repository'
import { issueAuthTokens } from './token.service'
import { RegisterDto } from '../dto/register.dto'
import { AuthTokens } from '../types/auth.types'

function hashEmail(email: string): string {
  return createHmac('sha256', authConfig.emailHashSecret).update(email).digest('hex')
}

export async function register(dto: RegisterDto): Promise<{ user: User; tokens: AuthTokens }> {
  const emailHash = hashEmail(dto.email)

  const existingEmail = await authRepository.findLoginByEmailHash(emailHash)
  if (existingEmail) {
    throw new AppError('An account with this email already exists', 409)
  }

  if (dto.username) {
    const existingUsername = await authRepository.findUserByUsername(dto.username)
    if (existingUsername) {
      throw new AppError('This username is already taken', 409)
    }
  }

  const passwordHash = await argon2.hash(dto.password, authConfig.argon2)

  let user: User
  try {
    user = await runInTransaction((tx) =>
      authRepository.createUserWithLogin(tx, {
        firstName: dto.firstName,
        middleName: dto.middleName,
        lastName: dto.lastName,
        username: dto.username,
        gender: dto.gender,
        birthdate: new Date(dto.birthdate),
        contactNo: dto.contactNo,
        address: dto.address,
        maritalStatus: dto.maritalStatus,
        emailHash,
        passwordHash,
      }),
    )
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = (error.meta?.target as string[] | undefined) ?? []
      if (target.includes('username')) {
        throw new AppError('This username is already taken', 409)
      }
      throw new AppError('An account with this email already exists', 409)
    }
    throw error
  }

  return { user, tokens: await issueAuthTokens(user.id) }
}
