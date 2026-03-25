import { Resume, Analysis, Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { ResumeSections } from '@scorely/types'

type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

type ResumeWithAnalysis = Resume & { analysis: Analysis | null }

type CreateResumeData = {
  userId: string
  version: number
  s3Key: string
  extractedText: string
  editedText: string
  sections: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput
  jobCategory: string
  experienceLevel: string
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function toStr(val: string | string[] | undefined): string {
  if (!val) return ''
  if (Array.isArray(val)) return val.join('\n\n')
  return val
}

function buildEditedTextFromSections(sections: ResumeSections): string {
  const parts: string[] = []
  // coverLetter는 재분석 대상에서 제외 — editedText에 포함하지 않음
  if (sections.summary) parts.push(stripHtml(toStr(sections.summary)))
  if (sections.experience) parts.push(stripHtml(toStr(sections.experience)))
  if (sections.education) parts.push(stripHtml(toStr(sections.education)))
  if (sections.training) parts.push(stripHtml(toStr(sections.training)))
  if (sections.skills) parts.push(stripHtml(toStr(sections.skills)))
  if (sections.projects) parts.push(...sections.projects.map((p) => stripHtml(typeof p === 'string' ? p : JSON.stringify(p))))
  if (sections.certifications) parts.push(stripHtml(toStr(sections.certifications)))
  if (sections.activities) parts.push(stripHtml(toStr(sections.activities)))
  if (sections.awards) parts.push(stripHtml(toStr(sections.awards)))
  return parts.join('\n\n')
}

export { buildEditedTextFromSections }

export const resumeRepository = {
  async create(data: CreateResumeData, tx?: TransactionClient): Promise<Resume> {
    try {
      return await (tx ?? prisma).resume.create({ data })
    } catch (err) {
      console.error('[resumeRepository.create]', err)
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
      console.error('[resumeRepository.findAllByUserId]', err)
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
      console.error('[resumeRepository.findById]', err)
      throw new AppError(500, 'DB 조회 오류', 'INTERNAL_ERROR')
    }
  },

  async getNextVersion(userId: string, tx?: TransactionClient): Promise<number> {
    try {
      const latest = await (tx ?? prisma).resume.findFirst({
        where: { userId },
        orderBy: { version: 'desc' },
        select: { version: true },
      })
      return (latest?.version ?? 0) + 1
    } catch (err) {
      console.error('[resumeRepository.getNextVersion]', err)
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
      console.error('[resumeRepository.updateEditedText]', err)
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
      console.error('[resumeRepository.updateSections]', err)
      throw new AppError(500, 'DB 업데이트 오류', 'INTERNAL_ERROR')
    }
  },

  async delete(id: string, userId: string): Promise<{ s3Key: string }> {
    try {
      const resume = await prisma.resume.findUnique({ where: { id } })

      if (!resume) {
        throw new AppError(404, '이력서를 찾을 수 없습니다', 'NOT_FOUND')
      }

      if (resume.userId !== userId) {
        throw new AppError(403, '접근 권한이 없습니다', 'FORBIDDEN')
      }

      await prisma.resume.delete({ where: { id } })
      return { s3Key: resume.s3Key }
    } catch (err) {
      if (err instanceof AppError) throw err
      console.error('[resumeRepository.delete]', err)
      throw new AppError(500, 'DB 삭제 오류', 'INTERNAL_ERROR')
    }
  },
}
