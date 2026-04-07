import { User } from '@prisma/client'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'

export const userRepository = {
  async findByEmail(email: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({ where: { email } })
    } catch (err) {
      throw new AppError(500, 'DB 조회 오류', 'INTERNAL_ERROR')
    }
  },

  async findById(id: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({ where: { id } })
    } catch (err) {
      throw new AppError(500, 'DB 조회 오류', 'INTERNAL_ERROR')
    }
  },

  async create(data: { email: string; password?: string; name: string; googleId?: string; emailVerified?: boolean }): Promise<User> {
    try {
      return await prisma.user.create({ data })
    } catch (err) {
      throw new AppError(500, 'DB 생성 오류', 'INTERNAL_ERROR')
    }
  },

  async findByGoogleId(googleId: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({ where: { googleId } })
    } catch (err) {
      throw new AppError(500, 'DB 조회 오류', 'INTERNAL_ERROR')
    }
  },

  async updateGoogleId(id: string, googleId: string): Promise<User> {
    try {
      return await prisma.user.update({
        where: { id },
        data: { googleId },
      })
    } catch (err) {
      throw new AppError(500, 'DB 업데이트 오류', 'INTERNAL_ERROR')
    }
  },

  async updateEmailVerified(id: string, verified: boolean): Promise<User> {
    try {
      return await prisma.user.update({
        where: { id },
        data: { emailVerified: verified },
      })
    } catch {
      throw new AppError(500, 'DB 업데이트 오류', 'INTERNAL_ERROR')
    }
  },

  async updatePassword(id: string, hashedPassword: string): Promise<User> {
    try {
      return await prisma.user.update({
        where: { id },
        data: { password: hashedPassword },
      })
    } catch {
      throw new AppError(500, 'DB 업데이트 오류', 'INTERNAL_ERROR')
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await prisma.user.delete({ where: { id } })
    } catch {
      throw new AppError(500, 'DB 삭제 오류', 'INTERNAL_ERROR')
    }
  },
}
