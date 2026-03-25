import { JobCategory, AnalysisResult, ResumeVersion, ResumeSections } from '@resumate/types'
import { z } from 'zod'
import { resumeRepository, buildEditedTextFromSections } from '../repositories/resume.repository'
import { analysisRepository } from '../repositories/analysis.repository'
import { uploadToS3, deleteFromS3, validatePdfFile } from '../utils/s3'
import { extractTextAndAnalyze, analyzeResume } from './gemini'
import { AppError } from '../middlewares/errorHandler'
import { prisma } from '../config/prisma'
import { Analysis, Prisma } from '@prisma/client'

function isPrismaUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === 'P2002'
  )
}

const ImprovementSchema = z.object({
  category: z.string(),
  issue: z.string(),
  suggestion: z.string(),
})

const PenaltySchema = z.object({
  category: z.string(),
  reason: z.string(),
  deduction: z.number(),
})

function toAnalysisResult(analysis: Analysis): AnalysisResult {
  const strengths = z.array(z.string()).parse(analysis.strengths)
  const improvements = z.array(ImprovementSchema).parse(analysis.improvements)
  const penalties = z.array(PenaltySchema).safeParse(analysis.penalties).data ?? []

  return {
    scores: {
      expertise: analysis.expertiseScore,
      experience: analysis.experienceScore,
      achievement: analysis.achievementScore,
      communication: analysis.communicationScore,
      structure: analysis.structureScore,
    },
    totalScore: analysis.totalScore,
    strengths,
    improvements,
    penalties,
    oneLiner: analysis.oneLiner,
  }
}

function toResumeVersion(resume: {
  id: string
  version: number
  jobCategory: string
  experienceLevel: string
  extractedText: string
  editedText: string
  sections: unknown
  createdAt: Date
  analysis: Analysis | null
}): ResumeVersion {
  return {
    id: resume.id,
    version: resume.version,
    jobCategory: resume.jobCategory as JobCategory,
    experienceLevel: '신입',
    extractedText: resume.extractedText,
    editedText: resume.editedText,
    sections: (resume.sections as ResumeSections) ?? null,
    createdAt: resume.createdAt.toISOString(),
    analysis: resume.analysis ? toAnalysisResult(resume.analysis) : null,
  }
}

export const resumeService = {
  async uploadAndAnalyze(
    userId: string,
    fileBuffer: Buffer,
    mimetype: string,
    fileSize: number,
    originalName: string,
    jobCategory: JobCategory,
  ): Promise<{
    resumeId: string
    version: number
    extractedText: string
    sections: ResumeSections
    analysis: AnalysisResult
  }> {
    validatePdfFile(mimetype, fileSize)

    const s3Key = await uploadToS3(fileBuffer, userId, originalName)

    try {
      const { extractedText, sections, analysis } = await extractTextAndAnalyze(fileBuffer, jobCategory)

      const result = await prisma.$transaction(async (tx) => {
        const version = await resumeRepository.getNextVersion(userId, tx)

        const resume = await resumeRepository.create({
          userId,
          version,
          s3Key,
          extractedText,
          editedText: buildEditedTextFromSections(sections),
          sections: sections as Prisma.InputJsonValue,
          jobCategory,
          experienceLevel: '신입' as const,
        }, tx)

        await analysisRepository.create({
          resumeId: resume.id,
          expertiseScore: analysis.scores.expertise,
          experienceScore: analysis.scores.experience,
          achievementScore: analysis.scores.achievement,
          communicationScore: analysis.scores.communication,
          structureScore: analysis.scores.structure,
          totalScore: analysis.totalScore,
          strengths: analysis.strengths,
          improvements: analysis.improvements,
          penalties: analysis.penalties,
          oneLiner: analysis.oneLiner,
        }, tx)

        return { resumeId: resume.id, version: resume.version }
      })

      return {
        resumeId: result.resumeId,
        version: result.version,
        extractedText,
        sections,
        analysis,
      }
    } catch (err) {
      console.error('[uploadAndAnalyze] 원본 에러:', err)
      await deleteFromS3(s3Key)
      if (err instanceof AppError) throw err
      if (isPrismaUniqueConstraintError(err)) {
        throw new AppError(409, '버전 충돌이 발생했습니다. 다시 시도해주세요.', 'VALIDATION_ERROR')
      }
      throw new AppError(500, '이력서 처리 중 오류가 발생했습니다', 'INTERNAL_ERROR')
    }
  },

  async saveSections(
    resumeId: string,
    userId: string,
    sections: ResumeSections,
  ): Promise<{ resumeId: string; sections: ResumeSections }> {
    const updated = await resumeRepository.updateSections(resumeId, userId, sections)
    return { resumeId: updated.id, sections: updated.sections as ResumeSections }
  },

  async saveEditedText(
    resumeId: string,
    userId: string,
    editedText: string,
  ): Promise<{ resumeId: string; editedText: string }> {
    const updated = await resumeRepository.updateEditedText(resumeId, userId, editedText)
    return { resumeId: updated.id, editedText: updated.editedText }
  },

  async reanalyze(
    resumeId: string,
    userId: string,
    jobCategory?: JobCategory,
  ): Promise<{ analysis: AnalysisResult; version: number; newResumeId: string }> {
    const existing = await resumeRepository.findById(resumeId)

    if (!existing) {
      throw new AppError(404, '이력서를 찾을 수 없습니다', 'NOT_FOUND')
    }

    if (existing.userId !== userId) {
      throw new AppError(403, '접근 권한이 없습니다', 'FORBIDDEN')
    }

    const targetCategory = (jobCategory ?? existing.jobCategory) as JobCategory
    // 재분석 시 sections는 전달하지 않음 — editedText가 유일한 진실의 원천
    // 유저가 텍스트를 수정/삭제했을 때 DB의 sections(최초 업로드 기준)가 잘못된 힌트를 주어
    // Gemini가 빈 내용에도 높은 점수를 줄 수 있는 문제 방지
    const analysis = await analyzeResume(
      existing.editedText,
      targetCategory,
    )

    const MAX_RETRIES = 1
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const newResume = await prisma.$transaction(async (tx) => {
          const nextVersion = await resumeRepository.getNextVersion(userId, tx)

          const resume = await resumeRepository.create({
            userId,
            version: nextVersion,
            s3Key: existing.s3Key,
            extractedText: existing.editedText,
            editedText: existing.editedText,
            sections: (existing.sections as Prisma.InputJsonValue) ?? null,
            jobCategory: targetCategory,
            experienceLevel: '신입' as const,
          }, tx)

          await analysisRepository.create({
            resumeId: resume.id,
            expertiseScore: analysis.scores.expertise,
            experienceScore: analysis.scores.experience,
            achievementScore: analysis.scores.achievement,
            communicationScore: analysis.scores.communication,
            structureScore: analysis.scores.structure,
            totalScore: analysis.totalScore,
            strengths: analysis.strengths,
            improvements: analysis.improvements,
            penalties: analysis.penalties,
            oneLiner: analysis.oneLiner,
          }, tx)

          return resume
        })

        return { analysis, version: newResume.version, newResumeId: newResume.id }
      } catch (err) {
        if (isPrismaUniqueConstraintError(err) && attempt < MAX_RETRIES) {
          continue
        }
        if (err instanceof AppError) throw err
        if (isPrismaUniqueConstraintError(err)) {
          throw new AppError(409, '버전 충돌이 발생했습니다. 다시 시도해주세요.', 'VALIDATION_ERROR')
        }
        throw new AppError(500, '재분석 처리 중 오류가 발생했습니다', 'INTERNAL_ERROR')
      }
    }

    throw new AppError(500, '재분석 처리 중 오류가 발생했습니다', 'INTERNAL_ERROR')
  },

  async deleteResume(resumeId: string, userId: string): Promise<void> {
    const { s3Key } = await resumeRepository.delete(resumeId, userId)
    await deleteFromS3(s3Key)
  },

  async getHistory(userId: string): Promise<ResumeVersion[]> {
    const resumes = await resumeRepository.findAllByUserId(userId)
    return resumes.map(toResumeVersion)
  },

  async getDetail(resumeId: string, userId: string): Promise<ResumeVersion> {
    const resume = await resumeRepository.findById(resumeId)

    if (!resume) {
      throw new AppError(404, '이력서를 찾을 수 없습니다', 'NOT_FOUND')
    }

    if (resume.userId !== userId) {
      throw new AppError(403, '접근 권한이 없습니다', 'FORBIDDEN')
    }

    return toResumeVersion(resume)
  },
}
