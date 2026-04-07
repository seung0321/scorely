import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  REFRESH_TOKEN_SECRET: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_REGION: z.string().min(1),
  AWS_S3_BUCKET: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  BACKEND_URL: z.string().optional(),
  BREVO_API_KEY: z.string().min(1),
  BREVO_FROM_EMAIL: z.string().email(),
  BREVO_FROM_NAME: z.string().default('Scorely'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ 환경변수 검증 실패:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
