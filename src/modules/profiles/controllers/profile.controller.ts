import { Request, Response } from 'express'
import { ConfirmImageDto } from '../dto/confirm-image.dto'
import { ImageUploadUrlDto } from '../dto/image-upload-url.dto'
import { UpdateProfileDto } from '../dto/update-profile.dto'
import * as profileImageService from '../services/profile-image.service'
import * as profileService from '../services/profile.service'
import { toProfileResponse } from '../services/profile.service'

export function me(req: Request, res: Response): void {
  res.status(200).json({ profile: toProfileResponse(req.user) })
}

export async function getByUsername(
  req: Request<{ username: string }>,
  res: Response,
): Promise<void> {
  const user = await profileService.getProfileByUsername(req.params.username)

  res.status(200).json({ profile: toProfileResponse(user) })
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const dto = req.body as UpdateProfileDto
  const user = await profileService.updateProfile(req.userId, dto)

  res.status(200).json({ profile: toProfileResponse(user) })
}

export async function requestImageUploadUrl(req: Request, res: Response): Promise<void> {
  const dto = req.body as ImageUploadUrlDto
  const result = await profileImageService.requestImageUploadUrl(req.userId, dto)

  res.status(200).json(result)
}

export async function confirmImage(req: Request, res: Response): Promise<void> {
  const dto = req.body as ConfirmImageDto
  const user = await profileImageService.confirmImageUpload(req.userId, dto)

  res.status(200).json({ profile: toProfileResponse(user) })
}

export async function share(req: Request<{ username: string }>, res: Response): Promise<void> {
  const result = await profileService.getProfileForShare(req.params.username)

  res.status(200).json(result)
}
