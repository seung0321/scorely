import { Analysis } from '@prisma/client'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'

type CreateAnalysisData = {
  resumeId: string
  expertiseScore: number
  experienceScore: number
  achievementScore: number
  communicationScore: number
  structureScore: number
  totalScore: number
  strengths: string[]
  improvements: object[]
  oneLiner: string
}

type ScoreHistory = {
  version: number
  totalScore: number
  createdAt: Date
  jobCategory: string
}

export const analysisRepository = {
  async create(data: CreateAnalysisData): Promise<Analysis> {
    try {
      return await prisma.analysis.create({ data })
    } catch (err) {
      throw new AppError(500, 'DB 생성 오류', 'INTERNAL_ERROR')
    }
  },

  async findByResumeId(resumeId: string): Promise<Analysis | null> {
    try {
      return await prisma.analysis.findUnique({ where: { resumeId } })
    } catch (err) {
      throw new AppError(500, 'DB 조회 오류', 'INTERNAL_ERROR')
    }
  },

  async findScoreHistoryByUserId(userId: string): Promise<ScoreHistory[]> {
    try {
      const resumes = await prisma.resume.findMany({
        where: { userId },
        select: {
          version: true,
          jobCategory: true,
          createdAt: true,
          analysis: {
            select: { totalScore: true },
          },
        },
        orderBy: { version: 'asc' },
      })

      return resumes
        .filter((r) => r.analysis !== null)
        .map((r) => ({
          version: r.version,
          totalScore: r.analysis!.totalScore,
          createdAt: r.createdAt,
          jobCategory: r.jobCategory,
        }))
    } catch (err) {
      throw new AppError(500, 'DB 조회 오류', 'INTERNAL_ERROR')
    }
  },
}
