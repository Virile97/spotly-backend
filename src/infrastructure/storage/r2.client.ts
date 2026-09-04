import { S3Client } from '@aws-sdk/client-s3'
import { storageConfig } from '../../config/storage.config'

let client: S3Client | undefined

export function getR2Client(): S3Client {
  if (client) return client

  if (!storageConfig.endpoint || !storageConfig.accessKeyId || !storageConfig.secretAccessKey) {
    throw new Error(
      'Object storage is not configured: STORAGE_ENDPOINT, STORAGE_ACCESS_KEY_ID and STORAGE_SECRET_ACCESS_KEY are required',
    )
  }

  client = new S3Client({
    region: 'auto',
    endpoint: storageConfig.endpoint,
    credentials: {
      accessKeyId: storageConfig.accessKeyId,
      secretAccessKey: storageConfig.secretAccessKey,
    },
  })

  return client
}
