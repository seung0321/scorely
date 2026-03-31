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

    async googleCallback(code: string): Promise<AuthResult> {
      if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
        throw new AppError(500, 'Google OAuth가 설정되지 않았습니다', 'INTERNAL_ERROR')
      }

      const redirectUri = `${env.BACKEND_URL ?? `http://localhost:${env.PORT}`}/api/auth/google/callback`

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
        // googleId로 못 찾으면 이메일로 기존 계정 확인
        const existingUser = await userRepository.findByEmail(googleUser.email)
        if (existingUser) {
          // 기존 이메일 계정에 googleId 연동
          user = await userRepository.updateGoogleId(existingUser.id, googleUser.id)
        } else {
          // 새 계정 생성 (password 없음)
          user = await userRepository.create({
            email: googleUser.email,
            name: googleUser.name,
            googleId: googleUser.id,
          })
        }
      }

      const tokens = await createTokenPair(user.id, user.email)
      const { password: _, ...userWithoutPassword } = user

      return { ...tokens, user: userWithoutPassword }
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
