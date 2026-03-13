import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from '../config/env'
import { AppError } from '../middlewares/errorHandler'

const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
})

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function uploadToS3(
  fileBuffer: Buffer,
  userId: string,
  originalName: string,
): Promise<string> {
  const s3Key = `resumes/${userId}/${Date.now()}_${originalName}`

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: 'application/pdf',
      }),
    )
    return s3Key
  } catch (err) {
    throw new AppError(500, 'S3 업로드에 실패했습니다', 'S3_ERROR')
  }
}

export async function getPresignedUrl(s3Key: string): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: s3Key,
    })
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 })
  } catch (err) {
    throw new AppError(500, 'Presigned URL 생성에 실패했습니다', 'S3_ERROR')
  }
}

export async function deleteFromS3(s3Key: string): Promise<void> {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: s3Key,
      }),
    )
  } catch (err) {
    console.error(`S3 삭제 실패 (key: ${s3Key}):`, err)
  }
}

export function validatePdfFile(mimetype: string, fileSize: number): void {
  if (mimetype !== 'application/pdf') {
    throw new AppError(400, 'PDF 파일만 업로드할 수 있습니다', 'VALIDATION_ERROR')
  }
  if (fileSize > MAX_FILE_SIZE) {
    throw new AppError(400, '파일 크기는 10MB를 초과할 수 없습니다', 'VALIDATION_ERROR')
  }
}
