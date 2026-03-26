import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { JobCategory, JOB_CATEGORIES, ResumeSections, RECOMMENDABLE_SECTION_TYPES } from '@scorely/types'
import { authMiddleware } from '../middlewares/auth.middleware'
import { createRateLimitMiddleware } from '../middlewares/rate-limit.middleware'
import { resumeService } from '../services/resume.service'
import { recommendSection } from '../services/gemini'
import { success } from '../utils/apiResponse'
import { AppError } from '../middlewares/errorHandler'
import { JwtPayload } from '../types/fastify'

const analysisRateLimit = createRateLimitMiddleware({
  category: 'analysis',
  maxRequests: 5,
  windowMs: 5 * 60 * 60 * 1000,
})

const recommendRateLimit = createRateLimitMiddleware({
  category: 'recommend',
  maxRequests: 10,
  windowMs: 5 * 60 * 60 * 1000,
})


const sectionRecommendSchema = z.object({
  sectionType: z.enum(RECOMMENDABLE_SECTION_TYPES),
  content: z.string().min(1, '내용을 입력해주세요'),
  jobCategory: z.enum(JOB_CATEGORIES),
})

const saveTextSchema = z.object({
  editedText: z.string().min(1, '텍스트를 입력해주세요'),
})

const reanalyzeSchema = z.object({
  jobCategory: z.enum(JOB_CATEGORIES).optional(),
})

const errorResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
}

const analysisResultSchema = {
  type: 'object',
  properties: {
    scores: {
      type: 'object',
      properties: {
        expertise: { type: 'number' },
        experience: { type: 'number' },
        achievement: { type: 'number' },
        communication: { type: 'number' },
        structure: { type: 'number' },
      },
    },
    totalScore: { type: 'number' },
    strengths: { type: 'array', items: { type: 'string' } },
    improvements: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          issue: { type: 'string' },
          suggestion: { type: 'string' },
        },
      },
    },
    penalties: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          reason: { type: 'string' },
          deduction: { type: 'number' },
        },
      },
    },
    oneLiner: { type: 'string' },
  },
}

const resumeSectionsSchema = {
  type: 'object',
  nullable: true,
  properties: {
    summary: { type: 'string' },
    experience: { type: 'string' },
    education: { type: 'string' },
    training: { type: 'string' },
    skills: { type: 'string' },
    projects: { type: 'array', items: { type: 'string' } },
    certifications: { type: 'string' },
    activities: { type: 'string' },
    awards: { type: 'string' },
  },
}

const resumeVersionSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    version: { type: 'number' },
    jobCategory: { type: 'string' },
    experienceLevel: { type: 'string' },
    extractedText: { type: 'string' },
    editedText: { type: 'string' },
    sections: resumeSectionsSchema,
    createdAt: { type: 'string' },
    analysis: analysisResultSchema,
  },
}

export async function resumeRoutes(app: FastifyInstance): Promise<void> {
  // DELETE /api/resume/all — /:resumeId 라우트보다 먼저 등록
  app.delete('/all', {
    schema: {
      tags: ['Resume'],
      summary: '이력서 전체 삭제',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
        401: errorResponseSchema,
      },
    },
    preHandler: authMiddleware,
  }, async (request, reply) => {
    const { userId } = request.user as JwtPayload
    await resumeService.deleteAllResumes(userId)
    return reply.send(success(null, '모든 이력서가 삭제되었습니다'))
  })

  // POST /api/resume/upload
  app.post('/upload', {
    schema: {
      tags: ['Resume'],
      summary: 'PDF 이력서 업로드 및 분석',
      security: [{ bearerAuth: [] }],
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                resumeId: { type: 'string' },
                version: { type: 'number' },
                extractedText: { type: 'string' },
                sections: resumeSectionsSchema,
                analysis: analysisResultSchema,
              },
            },
          },
        },
        400: errorResponseSchema,
        401: errorResponseSchema,
      },
    },
    preHandler: [authMiddleware, analysisRateLimit],
  }, async (request, reply) => {
    const { userId } = request.user as JwtPayload

    const data = await request.file()

    if (!data) {
      throw new AppError(400, '파일을 업로드해주세요', 'VALIDATION_ERROR')
    }

    const chunks: Buffer[] = []
    for await (const chunk of data.file) {
      chunks.push(chunk)
    }
    const fileBuffer = Buffer.concat(chunks)

    const jobCategoryField = (data.fields['jobCategory'] as { value?: string } | undefined)?.value
    if (!jobCategoryField || !(JOB_CATEGORIES as readonly string[]).includes(jobCategoryField)) {
      throw new AppError(400, '올바른 직군을 선택해주세요', 'VALIDATION_ERROR')
    }

    const result = await resumeService.uploadAndAnalyze(
      userId,
      fileBuffer,
      data.mimetype,
      fileBuffer.length,
      data.filename,
      jobCategoryField as JobCategory,
    )

    return reply.status(201).send(success(result, '이력서가 성공적으로 분석되었습니다'))
  })

  // PATCH /api/resume/:resumeId/text
  app.patch('/:resumeId/text', {
    schema: {
      tags: ['Resume'],
      summary: '이력서 텍스트 자동 저장',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['resumeId'],
        properties: {
          resumeId: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        required: ['editedText'],
        properties: {
          editedText: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                resumeId: { type: 'string' },
                editedText: { type: 'string' },
              },
            },
          },
        },
        400: errorResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    preHandler: authMiddleware,
  }, async (request, reply) => {
    const { userId } = request.user as JwtPayload
    const { resumeId } = request.params as { resumeId: string }

    const parsed = saveTextSchema.safeParse(request.body)
    if (!parsed.success) {
      throw new AppError(
        400,
        parsed.error.errors[0]?.message ?? '입력값이 올바르지 않습니다',
        'VALIDATION_ERROR',
      )
    }

    const result = await resumeService.saveEditedText(resumeId, userId, parsed.data.editedText)
    return reply.send(success(result))
  })

  // PATCH /api/resume/:resumeId/sections
  app.patch('/:resumeId/sections', {
    schema: {
      tags: ['Resume'],
      summary: '이력서 섹션 저장',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['resumeId'],
        properties: {
          resumeId: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          experience: { type: 'string' },
          education: { type: 'string' },
          training: { type: 'string' },
          skills: { type: 'string' },
          projects: { type: 'array', items: { type: 'string' } },
          certifications: { type: 'string' },
          activities: { type: 'string' },
          awards: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                resumeId: { type: 'string' },
                sections: { type: 'object' },
              },
            },
          },
        },
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    preHandler: authMiddleware,
  }, async (request, reply) => {
    const { userId } = request.user as JwtPayload
    const { resumeId } = request.params as { resumeId: string }
    const sections = request.body as ResumeSections
    const result = await resumeService.saveSections(resumeId, userId, sections)
    return reply.send(success(result))
  })

  // POST /api/resume/:resumeId/reanalyze
  app.post('/:resumeId/reanalyze', {
    schema: {
      tags: ['Resume'],
      summary: '이력서 재분석 (새 버전 생성)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['resumeId'],
        properties: {
          resumeId: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        properties: {
          jobCategory: {
            type: 'string',
            enum: JOB_CATEGORIES,
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                analysis: analysisResultSchema,
                version: { type: 'number' },
                newResumeId: { type: 'string' },
              },
            },
          },
        },
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    preHandler: [authMiddleware, analysisRateLimit],
  }, async (request, reply) => {
    const { userId } = request.user as JwtPayload
    const { resumeId } = request.params as { resumeId: string }

    const parsed = reanalyzeSchema.safeParse(request.body)
    if (!parsed.success) {
      throw new AppError(
        400,
        parsed.error.errors[0]?.message ?? '입력값이 올바르지 않습니다',
        'VALIDATION_ERROR',
      )
    }

    const result = await resumeService.reanalyze(resumeId, userId, parsed.data.jobCategory)
    return reply.send(success(result, '재분석이 완료되었습니다'))
  })

  // DELETE /api/resume/:resumeId
  app.delete('/:resumeId', {
    schema: {
      tags: ['Resume'],
      summary: '이력서 삭제',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['resumeId'],
        properties: {
          resumeId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
          },
        },
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    preHandler: authMiddleware,
  }, async (request, reply) => {
    const { userId } = request.user as JwtPayload
    const { resumeId } = request.params as { resumeId: string }
    await resumeService.deleteResume(resumeId, userId)
    return reply.send(success(null, '이력서가 삭제되었습니다'))
  })

  // GET /api/resume/history
  app.get('/history', {
    schema: {
      tags: ['Resume'],
      summary: '이력서 버전 목록 조회',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: resumeVersionSchema,
            },
          },
        },
        401: errorResponseSchema,
      },
    },
    preHandler: authMiddleware,
  }, async (request, reply) => {
    const { userId } = request.user as JwtPayload
    const history = await resumeService.getHistory(userId)
    return reply.send(success(history))
  })

  // POST /api/resume/:resumeId/section-recommend
  app.post('/:resumeId/section-recommend', {
    schema: {
      tags: ['Resume'],
      summary: '섹션별 AI 추천 텍스트 생성',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['resumeId'],
        properties: {
          resumeId: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        required: ['sectionType', 'content', 'jobCategory'],
        properties: {
          sectionType: { type: 'string', enum: [...RECOMMENDABLE_SECTION_TYPES] },
          content: { type: 'string' },
          jobCategory: { type: 'string', enum: JOB_CATEGORIES },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                recommendedText: { type: 'string' },
              },
            },
          },
        },
        400: errorResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    preHandler: [authMiddleware, recommendRateLimit],
  }, async (request, reply) => {
    const { userId } = request.user as JwtPayload
    const { resumeId } = request.params as { resumeId: string }

    const parsed = sectionRecommendSchema.safeParse(request.body)
    if (!parsed.success) {
      throw new AppError(
        400,
        parsed.error.errors[0]?.message ?? '입력값이 올바르지 않습니다',
        'VALIDATION_ERROR',
      )
    }

    const resume = await resumeService.getDetail(resumeId, userId)

    const { sectionType, content, jobCategory } = parsed.data
    const context = resume.analysis
      ? {
          improvements: resume.analysis.improvements,
          penalties: resume.analysis.penalties,
        }
      : undefined
    const recommendedText = await recommendSection(sectionType, content, jobCategory, context)
    return reply.send(success({ recommendedText }))
  })

  // GET /api/resume/:resumeId
  app.get('/:resumeId', {
    schema: {
      tags: ['Resume'],
      summary: '이력서 상세 조회',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['resumeId'],
        properties: {
          resumeId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: resumeVersionSchema,
          },
        },
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    preHandler: authMiddleware,
  }, async (request, reply) => {
    const { userId } = request.user as JwtPayload
    const { resumeId } = request.params as { resumeId: string }
    const resume = await resumeService.getDetail(resumeId, userId)
    return reply.send(success(resume))
  })
}
