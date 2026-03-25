import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { env } from './config/env'
import { registerErrorHandler } from './middlewares/errorHandler'
import { authRoutes } from './routes/auth.route'
import { resumeRoutes } from './routes/resume.route'
import { analysisRoutes } from './routes/analysis.route'

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true })

  await app.register(cors, {
    origin: env.FRONTEND_URL.includes(',')
      ? env.FRONTEND_URL.split(',').map((s) => s.trim())
      : env.FRONTEND_URL,
    credentials: true,
  })

  await app.register(jwt, {
    secret: env.JWT_SECRET,
  })

  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  })

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Scorely API',
        description: 'AI 기반 이력서 분석 서비스 API',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  })

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  })

  registerErrorHandler(app)

  app.get('/health', {
    schema: {
      tags: ['Health'],
      summary: '서버 상태 확인',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
          },
        },
      },
    },
  }, async () => {
    return { status: 'ok' }
  })

  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(resumeRoutes, { prefix: '/api/resume' })
  await app.register(analysisRoutes, { prefix: '/api/analysis' })

  return app
}
