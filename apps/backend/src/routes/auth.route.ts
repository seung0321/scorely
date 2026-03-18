import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { createAuthService } from '../services/auth.service'
import { authMiddleware } from '../middlewares/auth.middleware'
import { success } from '../utils/apiResponse'
import { AppError } from '../middlewares/errorHandler'
import { JwtPayload } from '../types/fastify'

const registerSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
})

const loginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
})

const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    email: { type: 'string' },
    name: { type: 'string' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
}

const authResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'object',
      properties: {
        token: { type: 'string' },
        user: userSchema,
      },
    },
    message: { type: 'string' },
  },
}

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

export async function authRoutes(app: FastifyInstance): Promise<void> {
  const authService = createAuthService(app)

  app.post('/register', {
    schema: {
      tags: ['Auth'],
      summary: '회원가입',
      body: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          name: { type: 'string', minLength: 2 },
        },
      },
      response: {
        201: authResponseSchema,
        400: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body)
    if (!parsed.success) {
      throw new AppError(
        400,
        parsed.error.errors[0]?.message ?? '입력값이 올바르지 않습니다',
        'VALIDATION_ERROR',
      )
    }

    const result = await authService.register(parsed.data)
    return reply.status(201).send(success(result, '회원가입이 완료되었습니다'))
  })

  app.post('/login', {
    schema: {
      tags: ['Auth'],
      summary: '로그인',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      response: {
        200: authResponseSchema,
        401: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body)
    if (!parsed.success) {
      throw new AppError(
        400,
        parsed.error.errors[0]?.message ?? '입력값이 올바르지 않습니다',
        'VALIDATION_ERROR',
      )
    }

    const result = await authService.login(parsed.data)
    return reply.send(success(result, '로그인이 완료되었습니다'))
  })

  app.get('/me', {
    schema: {
      tags: ['Auth'],
      summary: '내 정보 조회',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: userSchema,
          },
        },
        401: errorResponseSchema,
      },
    },
    preHandler: authMiddleware,
  }, async (request, reply) => {
    const { userId } = request.user as JwtPayload
    const user = await authService.getMe(userId)
    return reply.send(success(user))
  })
}
