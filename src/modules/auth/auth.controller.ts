import { Request, Response } from 'express'
import { User } from '../../database/types'
import * as authService from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RefreshTokenDto } from './dto/refresh-token.dto'
import { RegisterDto } from './dto/register.dto'

function toUserResponse(user: User) {
  return {
    id: user.id,
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
    displayName: user.displayName,
    nickname: user.nickname,
    gender: user.gender,
    birthdate: user.birthdate,
    maritalStatus: user.maritalStatus,
    isActive: user.isActive,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
  }
}

export async function register(req: Request, res: Response): Promise<void> {
  const dto = req.body as RegisterDto
  const { user, tokens } = await authService.register(dto)

  res.status(201).json({ user: toUserResponse(user), tokens })
}

export async function login(req: Request, res: Response): Promise<void> {
  const dto = req.body as LoginDto
  const { user, tokens } = await authService.login(dto)

  res.status(200).json({ user: toUserResponse(user), tokens })
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const dto = req.body as RefreshTokenDto
  const tokens = await authService.refresh(dto.refreshToken)

  res.status(200).json({ tokens })
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await authService.getCurrentUser(req.userId)

  res.status(200).json({ user: toUserResponse(user) })
}

export async function logout(req: Request, res: Response): Promise<void> {
  const dto = req.body as RefreshTokenDto
  await authService.logout(dto.refreshToken)

  res.status(204).send()
}
