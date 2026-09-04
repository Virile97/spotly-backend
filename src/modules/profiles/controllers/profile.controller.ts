import { Request, Response } from 'express'
import { SetUserInterestsDto } from '../../interests/dto/set-user-interests.dto'
import { ConfirmImageDto } from '../dto/confirm-image.dto'
import { ImageUploadUrlDto } from '../dto/image-upload-url.dto'
import { UpdateProfileDto } from '../dto/update-profile.dto'
import * as profileImageService from '../services/profile-image.service'
import * as profileService from '../services/profile.service'
import { buildProfileResponse } from '../services/profile.service'

export async function me(req: Request, res: Response): Promise<void> {
  res.status(200).json({ profile: await buildProfileResponse(req.user) })
}

export async function getByUsername(
  req: Request<{ username: string }>,
  res: Response,
): Promise<void> {
  const user = await profileService.getProfileByUsername(req.params.username)

  res.status(200).json({ profile: await buildProfileResponse(user) })
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const dto = req.body as UpdateProfileDto
  const user = await profileService.updateProfile(req.userId, dto)

  res.status(200).json({ profile: await buildProfileResponse(user) })
}

export async function requestImageUploadUrl(req: Request, res: Response): Promise<void> {
  const dto = req.body as ImageUploadUrlDto
  const result = await profileImageService.requestImageUploadUrl(req.userId, dto)

  res.status(200).json(result)
}

export async function confirmImage(req: Request, res: Response): Promise<void> {
  const dto = req.body as ConfirmImageDto
  const user = await profileImageService.confirmImageUpload(req.userId, dto)

  res.status(200).json({ profile: await buildProfileResponse(user) })
}

export async function share(req: Request<{ username: string }>, res: Response): Promise<void> {
  const result = await profileService.getProfileForShare(req.params.username)

  res.status(200).json(result)
}

export async function setInterests(req: Request, res: Response): Promise<void> {
  const dto = req.body as SetUserInterestsDto
  const interests = await profileService.setUserInterests(req.userId, dto.interestIds)

  res.status(200).json({ interests })
}
