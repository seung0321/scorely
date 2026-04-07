import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { createAuthService } from '../services/auth.service'
import { authMiddleware } from '../middlewares/auth.middleware'
import { getRateLimitStatus, getClientIp } from '../middlewares/rate-limit.middleware'
import { success } from '../utils/apiResponse'
import { AppError } from '../middlewares/errorHandler'
import { JwtPayload } from '../types/fastify'
import { env } from '../config/env'
import { FastifyRequest } from 'fastify'

const registerSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(/[a-zA-Z]/, '비밀번호에 영문자를 포함해주세요')
    .regex(/[0-9]/, '비밀번호에 숫자를 포함해주세요')
    .regex(/[^a-zA-Z0-9]/, '비밀번호에 특수문자를 포함해주세요'),
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
  code: z.string().length(6, '6자리 인증 코드를 입력해주세요'),
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

const sendEmailCodeSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
})

const checkEmailCodeSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  code: z.string().length(6, '6자리 인증 코드를 입력해주세요'),
})

const forgotPasswordSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, '토큰이 필요합니다'),
  password: z.string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(/[a-zA-Z]/, '비밀번호에 영문자를 포함해주세요')
    .regex(/[0-9]/, '비밀번호에 숫자를 포함해주세요')
    .regex(/[^a-zA-Z0-9]/, '비밀번호에 특수문자를 포함해주세요'),
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

  // request에서 백엔드 콜백 URL 자동 추출 (BACKEND_URL env 불필요)
  function getCallbackUrl(request: FastifyRequest): string {
    const proto = (request.headers['x-forwarded-proto'] as string)?.split(',')[0]?.trim() ?? request.protocol
    const host = (request.headers['x-forwarded-host'] as string)?.split(',')[0]?.trim()
      ?? request.headers.host
      ?? request.hostname
    return `${proto}://${host}/api/auth/google/callback`
  }

  // GET /api/auth/google — Google OAuth 시작
  app.get('/google', {
    schema: {
      tags: ['Auth'],
      summary: 'Google OAuth 로그인 시작',
      response: {
        302: { type: 'string' },
      },
    },
  }, async (request, reply) => {
    if (!env.GOOGLE_CLIENT_ID) {
      throw new AppError(500, 'Google OAuth가 설정되지 않았습니다', 'INTERNAL_ERROR')
    }

    const redirectUri = getCallbackUrl(request)
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
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
      const redirectUri = getCallbackUrl(request)
      const result = await authService.googleCallback(code, redirectUri)
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

  // POST /api/auth/send-email-code — 회원가입 전 이메일 인증코드 발송
  app.post('/send-email-code', {
    schema: {
      tags: ['Auth'],
      summary: '회원가입 전 이메일 인증코드 발송',
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
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
        400: errorResponseSchema,
        429: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const parsed = sendEmailCodeSchema.safeParse(request.body)
    if (!parsed.success) {
      throw new AppError(400, parsed.error.errors[0]?.message ?? '입력값이 올바르지 않습니다', 'VALIDATION_ERROR')
    }
    await authService.sendEmailCode(parsed.data.email)
    return reply.send(success(null, '인증 코드가 발송되었습니다'))
  })

  // POST /api/auth/check-email-code — 회원가입 전 이메일 인증코드 확인
  app.post('/check-email-code', {
    schema: {
      tags: ['Auth'],
      summary: '회원가입 전 이메일 인증코드 확인',
      body: {
        type: 'object',
        required: ['email', 'code'],
        properties: {
          email: { type: 'string', format: 'email' },
          code: { type: 'string', minLength: 6, maxLength: 6 },
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
        400: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const parsed = checkEmailCodeSchema.safeParse(request.body)
    if (!parsed.success) {
      throw new AppError(400, parsed.error.errors[0]?.message ?? '입력값이 올바르지 않습니다', 'VALIDATION_ERROR')
    }
    await authService.checkEmailCode(parsed.data.email, parsed.data.code)
    return reply.send(success(null, '이메일 인증이 완료되었습니다'))
  })

  // POST /api/auth/forgot-password — 비밀번호 재설정 요청
  app.post('/forgot-password', {
    schema: {
      tags: ['Auth'],
      summary: '비밀번호 재설정 요청',
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
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
        400: errorResponseSchema,
        404: errorResponseSchema,
        429: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const parsed = forgotPasswordSchema.safeParse(request.body)
    if (!parsed.success) {
      throw new AppError(400, parsed.error.errors[0]?.message ?? '입력값이 올바르지 않습니다', 'VALIDATION_ERROR')
    }
    await authService.requestPasswordReset(parsed.data.email)
    return reply.send(success(null, '비밀번호 재설정 링크를 이메일로 보냈습니다'))
  })

  // POST /api/auth/reset-password — 비밀번호 재설정
  app.post('/reset-password', {
    schema: {
      tags: ['Auth'],
      summary: '비밀번호 재설정',
      body: {
        type: 'object',
        required: ['token', 'password'],
        properties: {
          token: { type: 'string' },
          password: { type: 'string', minLength: 8 },
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
        400: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const parsed = resetPasswordSchema.safeParse(request.body)
    if (!parsed.success) {
      throw new AppError(400, parsed.error.errors[0]?.message ?? '입력값이 올바르지 않습니다', 'VALIDATION_ERROR')
    }
    await authService.resetPassword(parsed.data.token, parsed.data.password)
    return reply.send(success(null, '비밀번호가 성공적으로 변경되었습니다'))
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
