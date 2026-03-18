import { FastifyRequest, FastifyReply } from 'fastify'
import { AppError } from './errorHandler'
import { JwtPayload } from '../types/fastify'

export async function authMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify<JwtPayload>()
  } catch {
    throw new AppError(401, '인증이 필요합니다', 'UNAUTHORIZED')
  }
}
