import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { hashToken } from '../utils/hash'

export const refreshTokenRepository = {
  async create(userId: string, token: string, expiresAt: Date): Promise<void> {
    try {
      await prisma.refreshToken.create({
        data: {
          token: hashToken(token),
          userId,
          expiresAt,
        },
      })
    } catch {
      throw new AppError(500, 'DB 생성 오류', 'INTERNAL_ERROR')
    }
  },

  async findByToken(token: string): Promise<{ id: string; userId: string; expiresAt: Date } | null> {
    try {
      return await prisma.refreshToken.findUnique({
        where: { token: hashToken(token) },
        select: { id: true, userId: true, expiresAt: true },
      })
    } catch {
      throw new AppError(500, 'DB 조회 오류', 'INTERNAL_ERROR')
    }
  },

  async deleteByToken(token: string): Promise<void> {
    try {
      await prisma.refreshToken.deleteMany({
        where: { token: hashToken(token) },
      })
    } catch {
      throw new AppError(500, 'DB 삭제 오류', 'INTERNAL_ERROR')
    }
  },

  async deleteAllByUserId(userId: string): Promise<void> {
    try {
      await prisma.refreshToken.deleteMany({
        where: { userId },
      })
    } catch {
      throw new AppError(500, 'DB 삭제 오류', 'INTERNAL_ERROR')
    }
  },
}
