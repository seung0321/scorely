import bcrypt from 'bcryptjs'
import { FastifyInstance } from 'fastify'
import { User } from '@prisma/client'
import { userRepository } from '../repositories/user.repository'
import { AppError } from '../middlewares/errorHandler'

type UserWithoutPassword = Omit<User, 'password'>

type AuthResult = {
  token: string
  user: UserWithoutPassword
}

export function createAuthService(app: FastifyInstance) {
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

      const token = app.jwt.sign(
        { userId: user.id, email: user.email },
        { expiresIn: '7d' },
      )

      const { password: _, ...userWithoutPassword } = user

      return { token, user: userWithoutPassword }
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

      const token = app.jwt.sign(
        { userId: user.id, email: user.email },
        { expiresIn: '7d' },
      )

      const { password: _, ...userWithoutPassword } = user

      return { token, user: userWithoutPassword }
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
