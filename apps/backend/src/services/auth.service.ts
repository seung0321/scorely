import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomBytes, randomInt, timingSafeEqual } from 'crypto'
import { FastifyInstance } from 'fastify'
import { User } from '@prisma/client'
import { userRepository } from '../repositories/user.repository'
import { refreshTokenRepository } from '../repositories/refresh-token.repository'
import { verificationCodeRepository } from '../repositories/verification-code.repository'
import { passwordResetTokenRepository } from '../repositories/password-reset-token.repository'
import { resumeService } from './resume.service'
import { emailService } from './email.service'
import { AppError } from '../middlewares/errorHandler'
import { env } from '../config/env'
import { hashToken } from '../utils/hash'

type UserWithoutPassword = Omit<User, 'password'>

type AuthResult = {
  accessToken: string
  refreshToken: string
  user: UserWithoutPassword
}

type RefreshResult = {
  accessToken: string
  refreshToken: string
}

type JwtPayload = {
  userId: string
  email: string
}

function generateAccessToken(app: FastifyInstance, payload: JwtPayload): string {
  return app.jwt.sign(
    { userId: payload.userId, email: payload.email },
    { expiresIn: '30m' },
  )
}

function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(
    { userId: payload.userId, email: payload.email, type: 'refresh' },
    env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' },
  )
}

export function createAuthService(app: FastifyInstance) {
  async function createTokenPair(userId: string, email: string): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = generateAccessToken(app, { userId, email })
    const refreshToken = generateRefreshToken({ userId, email })

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await refreshTokenRepository.create(userId, refreshToken, expiresAt)

    return { accessToken, refreshToken }
  }

  return {
    // 회원가입 전 이메일 인증코드 발송
    async sendEmailCode(email: string): Promise<void> {
      const existing = await userRepository.findByEmail(email)
      if (existing) {
        throw new AppError(400, '이미 사용 중인 이메일입니다', 'VALIDATION_ERROR')
      }

      // 60초 rate limit
      const latest = await verificationCodeRepository.findLatestByEmail(email)
      if (latest) {
        const elapsed = Date.now() - latest.createdAt.getTime()
        if (elapsed < 60 * 1000) {
          const remaining = Math.ceil((60 * 1000 - elapsed) / 1000)
          throw new AppError(429, `${remaining}초 후에 다시 요청해주세요`, 'RATE_LIMIT_EXCEEDED')
        }
      }

      await verificationCodeRepository.deleteAllByEmail(email)
      const code = randomInt(100000, 1000000).toString()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
      await verificationCodeRepository.create(email, code, expiresAt)
      await emailService.sendVerificationEmail(email, code)
    },

    // 회원가입 전 이메일 인증코드 확인
    async checkEmailCode(email: string, code: string): Promise<void> {
      const stored = await verificationCodeRepository.findLatestByEmail(email)
      if (!stored) {
        throw new AppError(400, '인증 코드가 존재하지 않습니다. 재전송을 요청해주세요.', 'VALIDATION_ERROR')
      }
      if (stored.expiresAt < new Date()) {
        throw new AppError(400, '인증 코드가 만료되었습니다. 재전송을 요청해주세요.', 'VALIDATION_ERROR')
      }

      const inputHash = Buffer.from(hashToken(code))
      const storedHash = Buffer.from(stored.code)
      const isMatch = inputHash.length === storedHash.length && timingSafeEqual(inputHash, storedHash)
      if (!isMatch) {
        throw new AppError(400, '인증 코드가 올바르지 않습니다', 'VALIDATION_ERROR')
      }
    },

    async register(data: {
      email: string
      password: string
      name: string
      code: string
    }): Promise<AuthResult> {
      const existing = await userRepository.findByEmail(data.email)
      if (existing) {
        throw new AppError(400, '이미 사용 중인 이메일입니다', 'VALIDATION_ERROR')
      }

      // 인증코드 최종 검증
      const stored = await verificationCodeRepository.findLatestByEmail(data.email)
      if (!stored) {
        throw new AppError(400, '이메일 인증이 필요합니다', 'VALIDATION_ERROR')
      }
      if (stored.expiresAt < new Date()) {
        throw new AppError(400, '인증 코드가 만료되었습니다. 재전송을 요청해주세요.', 'VALIDATION_ERROR')
      }
      const inputHash = Buffer.from(hashToken(data.code))
      const storedHash = Buffer.from(stored.code)
      const isMatch = inputHash.length === storedHash.length && timingSafeEqual(inputHash, storedHash)
      if (!isMatch) {
        throw new AppError(400, '이메일 인증 코드가 올바르지 않습니다', 'VALIDATION_ERROR')
      }

      const hashedPassword = await bcrypt.hash(data.password, 10)
      const user = await userRepository.create({
        email: data.email,
        password: hashedPassword,
        name: data.name,
        emailVerified: true,
      })

      await verificationCodeRepository.deleteAllByEmail(data.email)

      const tokens = await createTokenPair(user.id, user.email)
      const { password: _, ...userWithoutPassword } = user

      return { ...tokens, user: userWithoutPassword }
    },

    async login(data: { email: string; password: string }): Promise<AuthResult> {
      const user = await userRepository.findByEmail(data.email)

      if (user && !user.password) {
        throw new AppError(
          401,
          'Google 계정으로 가입된 사용자입니다. Google 로그인을 이용해주세요.',
          'UNAUTHORIZED',
        )
      }

      const isValid = user?.password
        ? await bcrypt.compare(data.password, user.password)
        : false

      if (!user || !isValid) {
        throw new AppError(
          401,
          '이메일 또는 비밀번호가 올바르지 않습니다',
          'UNAUTHORIZED',
        )
      }

      const tokens = await createTokenPair(user.id, user.email)
      const { password: _, ...userWithoutPassword } = user

      return { ...tokens, user: userWithoutPassword }
    },

    async refresh(refreshToken: string): Promise<RefreshResult> {
      let payload: JwtPayload
      try {
        const decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET) as JwtPayload & { type: string }
        if (decoded.type !== 'refresh') {
          throw new Error('invalid token type')
        }
        payload = { userId: decoded.userId, email: decoded.email }
      } catch {
        throw new AppError(401, '유효하지 않은 리프레시 토큰입니다', 'UNAUTHORIZED')
      }

      const stored = await refreshTokenRepository.findByToken(refreshToken)
      if (!stored) {
        throw new AppError(401, '유효하지 않은 리프레시 토큰입니다', 'UNAUTHORIZED')
      }

      if (stored.expiresAt < new Date()) {
        await refreshTokenRepository.deleteByToken(refreshToken)
        throw new AppError(401, '리프레시 토큰이 만료되었습니다', 'UNAUTHORIZED')
      }

      // 토큰 로테이션: 기존 삭제 → 새 토큰 쌍 발급
      await refreshTokenRepository.deleteByToken(refreshToken)
      const tokens = await createTokenPair(payload.userId, payload.email)

      return tokens
    },

    async logout(refreshToken: string): Promise<void> {
      await refreshTokenRepository.deleteByToken(refreshToken)
    },

    async deleteAccount(userId: string): Promise<void> {
      // S3 파일 정리 후 유저 삭제 (cascade로 Resume, Analysis, RefreshToken 자동 삭제)
      await resumeService.deleteAllResumes(userId)
      await userRepository.delete(userId)
    },

    async googleCallback(code: string, redirectUri: string): Promise<AuthResult> {
      if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
        throw new AppError(500, 'Google OAuth가 설정되지 않았습니다', 'INTERNAL_ERROR')
      }

      // 1. code → token 교환
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      })

      if (!tokenRes.ok) {
        throw new AppError(401, 'Google 인증에 실패했습니다', 'UNAUTHORIZED')
      }

      const tokenData = await tokenRes.json() as { access_token: string }

      // 2. 사용자 정보 조회
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })

      if (!userInfoRes.ok) {
        throw new AppError(401, 'Google 사용자 정보 조회에 실패했습니다', 'UNAUTHORIZED')
      }

      const googleUser = await userInfoRes.json() as {
        id: string
        email: string
        name: string
      }

      // 3. DB에서 사용자 찾기/생성
      let user = await userRepository.findByGoogleId(googleUser.id)

      if (!user) {
        const existingUser = await userRepository.findByEmail(googleUser.email)
        if (existingUser) {
          // 이메일/비밀번호 계정이든 아니든 Google ID 연동
          user = await userRepository.updateGoogleId(existingUser.id, googleUser.id)
          if (!user.emailVerified) {
            user = await userRepository.updateEmailVerified(user.id, true)
          }
        } else {
          // 신규 사용자 생성 (password 없음, 이메일 자동 인증)
          user = await userRepository.create({
            email: googleUser.email,
            name: googleUser.name,
            googleId: googleUser.id,
            emailVerified: true,
          })
        }
      }

      const tokens = await createTokenPair(user.id, user.email)
      const { password: _, ...userWithoutPassword } = user

      return { ...tokens, user: userWithoutPassword }
    },

    async verifyEmail(userId: string, code: string): Promise<void> {
      const user = await userRepository.findById(userId)
      if (!user) {
        throw new AppError(404, '사용자를 찾을 수 없습니다', 'NOT_FOUND')
      }
      if (user.emailVerified) {
        throw new AppError(400, '이미 인증된 이메일입니다', 'VALIDATION_ERROR')
      }

      const stored = await verificationCodeRepository.findLatestByUserId(userId)
      if (!stored) {
        throw new AppError(400, '인증 코드가 존재하지 않습니다. 재전송을 요청해주세요.', 'VALIDATION_ERROR')
      }
      if (stored.expiresAt < new Date()) {
        throw new AppError(400, '인증 코드가 만료되었습니다. 재전송을 요청해주세요.', 'VALIDATION_ERROR')
      }

      const inputHash = Buffer.from(hashToken(code))
      const storedHash = Buffer.from(stored.code)
      const isMatch = inputHash.length === storedHash.length && timingSafeEqual(inputHash, storedHash)
      if (!isMatch) {
        throw new AppError(400, '인증 코드가 올바르지 않습니다', 'VALIDATION_ERROR')
      }

      await userRepository.updateEmailVerified(userId, true)
      await verificationCodeRepository.deleteAllByUserId(userId)
    },

    async resendVerificationEmail(userId: string): Promise<void> {
      const user = await userRepository.findById(userId)
      if (!user) {
        throw new AppError(404, '사용자를 찾을 수 없습니다', 'NOT_FOUND')
      }
      if (user.emailVerified) {
        throw new AppError(400, '이미 인증된 이메일입니다', 'VALIDATION_ERROR')
      }

      // 60초 rate limit
      const latest = await verificationCodeRepository.findLatestByUserId(userId)
      if (latest) {
        const elapsed = Date.now() - latest.createdAt.getTime()
        if (elapsed < 60 * 1000) {
          const remaining = Math.ceil((60 * 1000 - elapsed) / 1000)
          throw new AppError(429, `${remaining}초 후에 다시 요청해주세요`, 'RATE_LIMIT_EXCEEDED')
        }
      }

      await verificationCodeRepository.deleteAllByUserId(userId)
      const code = randomInt(100000, 1000000).toString()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
      await verificationCodeRepository.create(user.email, code, expiresAt, userId)
      await emailService.sendVerificationEmail(user.email, code)
    },

    async requestPasswordReset(email: string): Promise<void> {
      const user = await userRepository.findByEmail(email)
      if (!user) {
        throw new AppError(404, '등록되지 않은 이메일입니다', 'NOT_FOUND')
      }
      if (!user.password) {
        throw new AppError(400, '구글 로그인으로 가입된 계정입니다', 'VALIDATION_ERROR')
      }

      // 60초 rate limit
      const latest = await passwordResetTokenRepository.findLatestByUserId(user.id)
      if (latest) {
        const elapsed = Date.now() - latest.createdAt.getTime()
        if (elapsed < 60 * 1000) {
          const remaining = Math.ceil((60 * 1000 - elapsed) / 1000)
          throw new AppError(429, `${remaining}초 후에 다시 요청해주세요`, 'RATE_LIMIT_EXCEEDED')
        }
      }

      const rawToken = randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15분
      await passwordResetTokenRepository.create(user.id, rawToken, expiresAt)

      const frontendUrl = env.FRONTEND_URL.split(',')[0]
      const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`
      await emailService.sendPasswordResetEmail(user.email, resetLink)
    },

    async resetPassword(token: string, newPassword: string): Promise<void> {
      const stored = await passwordResetTokenRepository.findByToken(token)
      if (!stored) {
        throw new AppError(400, '유효하지 않은 재설정 링크입니다', 'VALIDATION_ERROR')
      }
      if (stored.used) {
        throw new AppError(400, '이미 사용된 재설정 링크입니다', 'VALIDATION_ERROR')
      }
      if (stored.expiresAt < new Date()) {
        throw new AppError(400, '재설정 링크가 만료되었습니다. 다시 요청해주세요.', 'VALIDATION_ERROR')
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10)
      await userRepository.updatePassword(stored.userId, hashedPassword)
      await passwordResetTokenRepository.markUsed(stored.id)
      // 보안: 기존 세션 전체 로그아웃
      await refreshTokenRepository.deleteAllByUserId(stored.userId)
    },

    async getMe(userId: string): Promise<UserWithoutPassword> {
      const user = await userRepository.findById(userId)
      if (!user) {
        throw new AppError(404, '사용자를 찾을 수 없습니다', 'NOT_FOUND')
      }

      const { password: _, ...userWithoutPassword } = user

      return userWithoutPassword
    },
  }
}
