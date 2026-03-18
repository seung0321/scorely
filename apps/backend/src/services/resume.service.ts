import { JobCategory, AnalysisResult, ResumeVersion, ResumeSections } from '@resumate/types'
import { resumeRepository, buildEditedTextFromSections } from '../repositories/resume.repository'
import { analysisRepository } from '../repositories/analysis.repository'
import { uploadToS3, deleteFromS3, validatePdfFile } from '../utils/s3'
import { extractTextAndAnalyze, analyzeResume } from './gemini.service'
import { AppError } from '../middlewares/errorHandler'
import { Analysis, Prisma } from '@prisma/client'

function toAnalysisResult(analysis: Analysis): AnalysisResult {
  const strengths = analysis.strengths as string[]
  const improvements = analysis.improvements as {
    category: string
    issue: string
    suggestion: string
  }[]

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
    oneLiner: analysis.oneLiner,
  }
}

function toResumeVersion(resume: {
  id: string
  version: number
  jobCategory: string
  extractedText: string
  sections: unknown
  createdAt: Date
  analysis: Analysis | null
}): ResumeVersion {
  return {
    id: resume.id,
    version: resume.version,
    jobCategory: resume.jobCategory as JobCategory,
    extractedText: resume.extractedText,
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

      const version = await resumeRepository.getNextVersion(userId)

      const resume = await resumeRepository.create({
        userId,
        version,
        s3Key,
        extractedText,
        editedText: buildEditedTextFromSections(sections),
        sections: sections as Prisma.InputJsonValue,
        jobCategory,
      })

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
        oneLiner: analysis.oneLiner,
      })

      return {
        resumeId: resume.id,
        version: resume.version,
        extractedText,
        sections,
        analysis,
      }
    } catch (err) {
      await deleteFromS3(s3Key)
      if (err instanceof AppError) throw err
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
  ): Promise<{ analysis: AnalysisResult; version: number }> {
    const existing = await resumeRepository.findById(resumeId)

    if (!existing) {
      throw new AppError(404, '이력서를 찾을 수 없습니다', 'NOT_FOUND')
    }

    if (existing.userId !== userId) {
      throw new AppError(403, '접근 권한이 없습니다', 'FORBIDDEN')
    }

    const targetCategory = (jobCategory ?? existing.jobCategory) as JobCategory
    const analysis = await analyzeResume(existing.editedText, targetCategory)

    const nextVersion = await resumeRepository.getNextVersion(userId)

    const newResume = await resumeRepository.create({
      userId,
      version: nextVersion,
      s3Key: existing.s3Key,
      extractedText: existing.editedText,
      editedText: existing.editedText,
      sections: (existing.sections as Prisma.InputJsonValue) ?? null,
      jobCategory: targetCategory,
    })

    await analysisRepository.create({
      resumeId: newResume.id,
      expertiseScore: analysis.scores.expertise,
      experienceScore: analysis.scores.experience,
      achievementScore: analysis.scores.achievement,
      communicationScore: analysis.scores.communication,
      structureScore: analysis.scores.structure,
      totalScore: analysis.totalScore,
      strengths: analysis.strengths,
      improvements: analysis.improvements,
      oneLiner: analysis.oneLiner,
    })

    return { analysis, version: newResume.version }
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
