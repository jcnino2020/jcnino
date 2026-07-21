import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const endpoint = process.env.R2_ENDPOINT_URL;
const bucketName = process.env.R2_BUCKET_NAME || 'frameforge-prod-media';

export const s3Client = new S3Client({
  region: 'auto',
  endpoint: endpoint,
  credentials: {
    accessKeyId: accessKeyId || 'placeholder',
    secretAccessKey: secretAccessKey || 'placeholder',
  },
});

/**
 * Generate a pre-signed PUT URL for uploading visual assets directly from the browser.
 */
export async function getUploadPresignedUrl(key: string, contentType: string, expiresInSeconds = 3600): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

/**
 * Delete an object from the S3/R2 bucket storage.
 */
export async function deleteAssetFromStorage(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Get the public asset URL based on custom domains or S3/R2 endpoint naming patterns.
 */
export function getPublicAssetUrl(key: string): string {
  const customDomain = process.env.NEXT_PUBLIC_ASSET_CDN_DOMAIN;
  if (customDomain) {
    return `${customDomain}/${key}`;
  }
  return `${endpoint}/${bucketName}/${key}`;
}
