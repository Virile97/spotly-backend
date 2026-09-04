import { randomUUID } from 'crypto'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { storageConfig } from '../../config/storage.config'
import { getR2Client } from './r2.client'

export interface PresignedUpload {
  uploadUrl: string
  key: string
  expiresInSeconds: number
}

const CONTENT_TYPE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export function isAllowedImageContentType(contentType: string): boolean {
  return contentType in CONTENT_TYPE_EXTENSIONS
}

export async function createPresignedImageUpload(params: {
  folder: string
  contentType: string
}): Promise<PresignedUpload> {
  const extension = CONTENT_TYPE_EXTENSIONS[params.contentType]
  if (!extension) {
    throw new Error(`Unsupported content type: ${params.contentType}`)
  }

  const key = `${params.folder}/${randomUUID()}.${extension}`

  const command = new PutObjectCommand({
    Bucket: storageConfig.bucket,
    Key: key,
    ContentType: params.contentType,
  })

  const uploadUrl = await getSignedUrl(getR2Client(), command, {
    expiresIn: storageConfig.presignedUploadTtlSeconds,
  })

  return { uploadUrl, key, expiresInSeconds: storageConfig.presignedUploadTtlSeconds }
}

export function toPublicImageUrl(key: string | null): string | null {
  if (!key) return null
  if (!storageConfig.publicBaseUrl) return null
  return `${storageConfig.publicBaseUrl.replace(/\/$/, '')}/${key}`
}
