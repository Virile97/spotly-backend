import { env } from './env'

export const storageConfig = {
  endpoint: env.storageEndpoint,
  bucket: env.storageBucket,
  accessKeyId: env.storageAccessKeyId,
  secretAccessKey: env.storageSecretAccessKey,
  publicBaseUrl: env.storagePublicBaseUrl,
  presignedUploadTtlSeconds: 300,
}
