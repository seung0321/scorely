import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { hashToken } from '../utils/hash'

export const passwordResetTokenRepository = {
  async create(userId: string, token: string, expiresAt: Date): Promise<void> {
    try {
      await prisma.passwordResetToken.create({
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

  async findByToken(token: string): Promise<{ id: string; userId: string; expiresAt: Date; used: boolean } | null> {
    try {
      return await prisma.passwordResetToken.findUnique({
        where: { token: hashToken(token) },
        select: { id: true, userId: true, expiresAt: true, used: true },
      })
    } catch {
      throw new AppError(500, 'DB 조회 오류', 'INTERNAL_ERROR')
    }
  },

  async findLatestByUserId(userId: string): Promise<{ id: string; createdAt: Date } | null> {
    try {
      return await prisma.passwordResetToken.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, createdAt: true },
      })
    } catch {
      throw new AppError(500, 'DB 조회 오류', 'INTERNAL_ERROR')
    }
  },

  async markUsed(id: string): Promise<void> {
    try {
      await prisma.passwordResetToken.update({
        where: { id },
        data: { used: true },
      })
    } catch {
      throw new AppError(500, 'DB 업데이트 오류', 'INTERNAL_ERROR')
    }
  },

  async deleteAllByUserId(userId: string): Promise<void> {
    try {
      await prisma.passwordResetToken.deleteMany({ where: { userId } })
    } catch {
      throw new AppError(500, 'DB 삭제 오류', 'INTERNAL_ERROR')
    }
  },
}
