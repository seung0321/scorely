import { FastifyInstance } from 'fastify'
import { authMiddleware } from '../middlewares/auth.middleware'
import { emailVerifiedMiddleware } from '../middlewares/email-verified.middleware'
import { analysisService } from '../services/analysis.service'
import { success } from '../utils/apiResponse'
import { JwtPayload } from '../types/fastify'

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

export async function analysisRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/analysis/history
  app.get('/history', {
    schema: {
      tags: ['Analysis'],
      summary: '점수 히스토리 조회 (차트용)',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  version: { type: 'number' },
                  totalScore: { type: 'number' },
                  createdAt: { type: 'string' },
                  jobCategory: { type: 'string' },
                },
              },
            },
          },
        },
        401: errorResponseSchema,
      },
    },
    preHandler: [authMiddleware, emailVerifiedMiddleware],
  }, async (request, reply) => {
    const { userId } = request.user as JwtPayload
    const history = await analysisService.getScoreHistory(userId)
    return reply.send(success(history))
  })
}
