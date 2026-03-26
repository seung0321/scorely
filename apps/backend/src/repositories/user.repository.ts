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

  async create(data: { email: string; password: string; name: string }): Promise<User> {
    try {
      return await prisma.user.create({ data })
    } catch (err) {
      throw new AppError(500, 'DB 생성 오류', 'INTERNAL_ERROR')
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await prisma.user.delete({ where: { id } })
    } catch (err) {
      throw new AppError(500, 'DB 삭제 오류', 'INTERNAL_ERROR')
    }
  },
}
