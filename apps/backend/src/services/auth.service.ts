import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { FastifyInstance } from 'fastify'
import { User } from '@prisma/client'
import { userRepository } from '../repositories/user.repository'
import { refreshTokenRepository } from '../repositories/refresh-token.repository'
import { resumeService } from './resume.service'
import { AppError } from '../middlewares/errorHandler'
import { env } from '../config/env'

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
    async register(data: {
      email: string
      password: string
      name: string
    }): Promise<AuthResult> {
      const existing = await userRepository.findByEmail(data.email)
      if (existing) {
        throw new AppError(400, '이미 사용 중인 이메일입니다', 'VALIDATION_ERROR')
      }

      const hashedPassword = await bcrypt.hash(data.password, 10)
      const user = await userRepository.create({
        email: data.email,
        password: hashedPassword,
        name: data.name,
      })

      const tokens = await createTokenPair(user.id, user.email)
      const { password: _, ...userWithoutPassword } = user

      return { ...tokens, user: userWithoutPassword }
    },

    async login(data: { email: string; password: string }): Promise<AuthResult> {
      const user = await userRepository.findByEmail(data.email)
      const isValid = user ? await bcrypt.compare(data.password, user.password) : false

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
