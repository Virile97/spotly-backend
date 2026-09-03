import argon2 from 'argon2'
import { createHmac } from 'crypto'
import { runInTransaction } from '../../database/transactions/transaction'
import { Prisma, User } from '../../database/types'
import { AppError } from '../../shared/errors/app-error'
import { NotFoundError } from '../../shared/errors/not-found-error'
import { authConfig } from '../../config/auth.config'
import * as authRepository from './auth.repository'
import { issueTokens, verifyRefreshToken } from './auth.tokens'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { AuthTokens } from './types/auth.types'

function hashEmail(email: string): string {
  return createHmac('sha256', authConfig.emailHashSecret).update(email).digest('hex')
}

export async function register(dto: RegisterDto): Promise<{ user: User; tokens: AuthTokens }> {
  const emailHash = hashEmail(dto.email)

  const existingEmail = await authRepository.findLoginByEmailHash(emailHash)
  if (existingEmail) {
    throw new AppError('An account with this email already exists', 409)
  }

  if (dto.nickname) {
    const existingNickname = await authRepository.findUserByNickname(dto.nickname)
    if (existingNickname) {
      throw new AppError('This nickname is already taken', 409)
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
        displayName: dto.displayName,
        nickname: dto.nickname,
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
      if (target.includes('nickname')) {
        throw new AppError('This nickname is already taken', 409)
      }
      throw new AppError('An account with this email already exists', 409)
    }
    throw error
  }

  return { user, tokens: issueTokens(user.id) }
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

  return { user: loginInfo.user, tokens: issueTokens(loginInfo.user.id) }
}

export async function refresh(refreshToken: string): Promise<AuthTokens> {
  let userId: string
  try {
    userId = verifyRefreshToken(refreshToken).sub
  } catch {
    throw new AppError('Invalid or expired refresh token', 401)
  }

  const user = await authRepository.findUserById(userId)
  if (!user || user.deletedAt) {
    throw new AppError('Invalid or expired refresh token', 401)
  }

  return issueTokens(user.id)
}

export async function getCurrentUser(userId: string): Promise<User> {
  const user = await authRepository.findUserById(userId)
  if (!user || user.deletedAt) {
    throw new NotFoundError('User not found')
  }
  return user
}
