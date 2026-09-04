import {
  createPresignedImageUpload,
  isAllowedImageContentType,
  PresignedUpload,
} from '../../../infrastructure/storage/storage.service'
import { User } from '../../../database/types'
import { AppError } from '../../../shared/errors/app-error'
import * as profileRepository from '../repositories/profile.repository'
import { ImageUploadUrlDto } from '../dto/image-upload-url.dto'
import { ConfirmImageDto } from '../dto/confirm-image.dto'

const FOLDER_BY_TYPE: Record<ImageUploadUrlDto['type'], string> = {
  avatar: 'avatars',
  background: 'backgrounds',
}

const FIELD_BY_TYPE: Record<ConfirmImageDto['type'], 'avatarKey' | 'backgroundImageKey'> = {
  avatar: 'avatarKey',
  background: 'backgroundImageKey',
}

export async function requestImageUploadUrl(
  userId: string,
  dto: ImageUploadUrlDto,
): Promise<PresignedUpload> {
  if (!isAllowedImageContentType(dto.contentType)) {
    throw new AppError('Unsupported image content type', 400)
  }

  return createPresignedImageUpload({
    folder: `${FOLDER_BY_TYPE[dto.type]}/${userId}`,
    contentType: dto.contentType,
  })
}

export async function confirmImageUpload(userId: string, dto: ConfirmImageDto): Promise<User> {
  const field = FIELD_BY_TYPE[dto.type]
  const expectedPrefix = `${FOLDER_BY_TYPE[dto.type]}/${userId}/`

  if (!dto.key.startsWith(expectedPrefix)) {
    throw new AppError('Image key does not belong to this user/type', 400)
  }

  return profileRepository.updateProfileImage(userId, field, dto.key)
}
