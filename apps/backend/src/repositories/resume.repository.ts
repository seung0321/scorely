import { Resume, Analysis, Prisma } from '@prisma/client'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { ResumeSections } from '@resumate/types'

type ResumeWithAnalysis = Resume & { analysis: Analysis | null }

type CreateResumeData = {
  userId: string
  version: number
  s3Key: string
  extractedText: string
  editedText: string
  sections: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput
  jobCategory: string
}

function buildEditedTextFromSections(sections: ResumeSections): string {
  const parts: string[] = []
  if (sections.summary) parts.push(sections.summary)
  if (sections.experience) parts.push(sections.experience)
  if (sections.education) parts.push(sections.education)
  if (sections.skills) parts.push(sections.skills)
  if (sections.projects) parts.push(...sections.projects)
  if (sections.certifications) parts.push(sections.certifications)
  if (sections.activities) parts.push(sections.activities)
  return parts.join('\n\n')
}

export { buildEditedTextFromSections }

export const resumeRepository = {
  async create(data: CreateResumeData): Promise<Resume> {
    try {
      return await prisma.resume.create({ data })
    } catch (err) {
      throw new AppError(500, 'DB 생성 오류', 'INTERNAL_ERROR')
    }
  },

  async findAllByUserId(userId: string): Promise<ResumeWithAnalysis[]> {
    try {
      return await prisma.resume.findMany({
        where: { userId },
        include: { analysis: true },
        orderBy: { createdAt: 'desc' },
      })
    } catch (err) {
      throw new AppError(500, 'DB 조회 오류', 'INTERNAL_ERROR')
    }
  },

  async findById(id: string): Promise<ResumeWithAnalysis | null> {
    try {
      return await prisma.resume.findUnique({
        where: { id },
        include: { analysis: true },
      })
    } catch (err) {
      throw new AppError(500, 'DB 조회 오류', 'INTERNAL_ERROR')
    }
  },

  async getNextVersion(userId: string): Promise<number> {
    try {
      const latest = await prisma.resume.findFirst({
        where: { userId },
        orderBy: { version: 'desc' },
        select: { version: true },
      })
      return (latest?.version ?? 0) + 1
    } catch (err) {
      throw new AppError(500, 'DB 조회 오류', 'INTERNAL_ERROR')
    }
  },

  async updateEditedText(
    resumeId: string,
    userId: string,
    editedText: string,
  ): Promise<Resume> {
    try {
      const resume = await prisma.resume.findUnique({ where: { id: resumeId } })

      if (!resume) {
        throw new AppError(404, '이력서를 찾을 수 없습니다', 'NOT_FOUND')
      }

      if (resume.userId !== userId) {
        throw new AppError(403, '접근 권한이 없습니다', 'FORBIDDEN')
      }

      return await prisma.resume.update({
        where: { id: resumeId },
        data: { editedText },
      })
    } catch (err) {
      if (err instanceof AppError) throw err
      throw new AppError(500, 'DB 업데이트 오류', 'INTERNAL_ERROR')
    }
  },

  async updateSections(
    resumeId: string,
    userId: string,
    sections: ResumeSections,
  ): Promise<Resume> {
    try {
      const resume = await prisma.resume.findUnique({ where: { id: resumeId } })

      if (!resume) {
        throw new AppError(404, '이력서를 찾을 수 없습니다', 'NOT_FOUND')
      }

      if (resume.userId !== userId) {
        throw new AppError(403, '접근 권한이 없습니다', 'FORBIDDEN')
      }

      const editedText = buildEditedTextFromSections(sections)

      return await prisma.resume.update({
        where: { id: resumeId },
        data: { sections: sections as Prisma.InputJsonValue, editedText },
      })
    } catch (err) {
      if (err instanceof AppError) throw err
      throw new AppError(500, 'DB 업데이트 오류', 'INTERNAL_ERROR')
    }
  },
}
