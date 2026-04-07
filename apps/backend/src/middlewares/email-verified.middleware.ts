import { FastifyRequest, FastifyReply } from 'fastify'
import { userRepository } from '../repositories/user.repository'
import { AppError } from './errorHandler'
import { JwtPayload } from '../types/fastify'

export async function emailVerifiedMiddleware(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const { userId } = request.user as JwtPayload
  const user = await userRepository.findById(userId)
  if (!user || !user.emailVerified) {
    throw new AppError(403, '이메일 인증이 필요합니다', 'FORBIDDEN')
  }
}
