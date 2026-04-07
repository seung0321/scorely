import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { hashToken } from '../utils/hash'

export const verificationCodeRepository = {
  async create(email: string, code: string, expiresAt: Date, userId?: string): Promise<void> {
    try {
      await prisma.verificationCode.create({
        data: {
          code: hashToken(code),
          email,
          expiresAt,
          ...(userId ? { userId } : {}),
        },
      })
    } catch {
      throw new AppError(500, 'DB 생성 오류', 'INTERNAL_ERROR')
    }
  },

  async findLatestByEmail(email: string): Promise<{ id: string; code: string; expiresAt: Date; createdAt: Date } | null> {
    try {
      return await prisma.verificationCode.findFirst({
        where: { email },
        orderBy: { createdAt: 'desc' },
        select: { id: true, code: true, expiresAt: true, createdAt: true },
      })
    } catch {
      throw new AppError(500, 'DB 조회 오류', 'INTERNAL_ERROR')
    }
  },

  async findLatestByUserId(userId: string): Promise<{ id: string; code: string; expiresAt: Date; createdAt: Date } | null> {
    try {
      return await prisma.verificationCode.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, code: true, expiresAt: true, createdAt: true },
      })
    } catch {
      throw new AppError(500, 'DB 조회 오류', 'INTERNAL_ERROR')
    }
  },

  async deleteAllByEmail(email: string): Promise<void> {
    try {
      await prisma.verificationCode.deleteMany({ where: { email } })
    } catch {
      throw new AppError(500, 'DB 삭제 오류', 'INTERNAL_ERROR')
    }
  },

  async deleteAllByUserId(userId: string): Promise<void> {
    try {
      await prisma.verificationCode.deleteMany({ where: { userId } })
    } catch {
      throw new AppError(500, 'DB 삭제 오류', 'INTERNAL_ERROR')
    }
  },
}
