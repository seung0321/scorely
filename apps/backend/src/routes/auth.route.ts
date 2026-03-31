import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { createAuthService } from '../services/auth.service'
import { authMiddleware } from '../middlewares/auth.middleware'
import { getRateLimitStatus, getClientIp } from '../middlewares/rate-limit.middleware'
import { success } from '../utils/apiResponse'
import { AppError } from '../middlewares/errorHandler'
import { JwtPayload } from '../types/fastify'
import { env } from '../config/env'

const registerSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(/[a-zA-Z]/, '비밀번호에 영문자를 포함해주세요')
    .regex(/[0-9]/, '비밀번호에 숫자를 포함해주세요')
    .regex(/[^a-zA-Z0-9]/, '비밀번호에 특수문자를 포함해주세요'),
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
})

const loginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
})

const refreshSchema = z.object({
  refreshToken: z.string().min(1, '리프레시 토큰을 입력해주세요'),
})

const logoutSchema = z.object({
  refreshToken: z.string().min(1, '리프레시 토큰을 입력해주세요'),
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
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
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

  // POST /api/auth/refresh — 토큰 갱신
  app.post('/refresh', {
    schema: {
      tags: ['Auth'],
      summary: '토큰 갱신',
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
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
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
              },
            },
          },
        },
        401: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body)
    if (!parsed.success) {
      throw new AppError(400, '리프레시 토큰이 필요합니다', 'VALIDATION_ERROR')
    }

    const result = await authService.refresh(parsed.data.refreshToken)
    return reply.send(success(result))
  })

  // POST /api/auth/logout — 로그아웃 (RT 삭제)
  app.post('/logout', {
    schema: {
      tags: ['Auth'],
      summary: '로그아웃',
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const parsed = logoutSchema.safeParse(request.body)
    if (parsed.success) {
      await authService.logout(parsed.data.refreshToken)
    }
    return reply.send(success(null, '로그아웃이 완료되었습니다'))
  })

  // GET /api/auth/google — Google OAuth 시작
  app.get('/google', {
    schema: {
      tags: ['Auth'],
      summary: 'Google OAuth 로그인 시작',
      response: {
        302: { type: 'string' },
      },
    },
  }, async (_request, reply) => {
    if (!env.GOOGLE_CLIENT_ID) {
      throw new AppError(500, 'Google OAuth가 설정되지 않았습니다', 'INTERNAL_ERROR')
    }

    const redirectUri = `${env.BACKEND_URL ?? `http://localhost:${env.PORT}`}/api/auth/google/callback`
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    })

    return reply.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
  })

  // GET /api/auth/google/callback — Google OAuth 콜백
  app.get('/google/callback', {
    schema: {
      tags: ['Auth'],
      summary: 'Google OAuth 콜백',
      querystring: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          error: { type: 'string' },
        },
      },
      response: {
        302: { type: 'string' },
      },
    },
  }, async (request, reply) => {
    const { code, error } = request.query as { code?: string; error?: string }
    const frontendUrl = env.FRONTEND_URL.split(',')[0]

    if (error || !code) {
      return reply.redirect(`${frontendUrl}/login?error=oauth_failed`)
    }

    try {
      const result = await authService.googleCallback(code)
      const params = new URLSearchParams({
        token: result.accessToken,
        refreshToken: result.refreshToken,
      })
      return reply.redirect(`${frontendUrl}/auth/callback?${params.toString()}`)
    } catch {
      return reply.redirect(`${frontendUrl}/login?error=oauth_failed`)
    }
  })

  // GET /api/auth/me — 내 정보 조회
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

  // DELETE /api/auth/account — 회원 탈퇴
  app.delete('/account', {
    schema: {
      tags: ['Auth'],
      summary: '회원 탈퇴',
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
    await authService.deleteAccount(userId)
    return reply.send(success(null, '회원 탈퇴가 완료되었습니다'))
  })

  // GET /api/auth/rate-limit-status — Rate limit 사용량 조회
  app.get('/rate-limit-status', {
    schema: {
      tags: ['Auth'],
      summary: 'AI 사용량 조회',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                analysis: {
                  type: 'object',
                  properties: {
                    used: { type: 'number' },
                    max: { type: 'number' },
                    resetAt: { type: 'string', nullable: true },
                  },
                },
                recommend: {
                  type: 'object',
                  properties: {
                    used: { type: 'number' },
                    max: { type: 'number' },
                    resetAt: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
        },
        401: errorResponseSchema,
      },
    },
    preHandler: authMiddleware,
  }, async (request, reply) => {
    const ip = getClientIp(request)
    const status = getRateLimitStatus(ip)
    return reply.send(success(status))
  })
}
