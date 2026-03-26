import { FastifyRequest, FastifyReply } from 'fastify'
import { AppError } from './errorHandler'

type RateLimitCategory = 'analysis' | 'recommend'

interface RateLimitConfig {
  category: RateLimitCategory
  maxRequests: number
  windowMs: number
}

interface RateLimitEntry {
  count: number
  firstUsedAt: number
}

const store = new Map<string, RateLimitEntry>()

const WINDOW_MS = 5 * 60 * 60 * 1000 // 5시간

// 만료된 항목 주기적 정리 (1시간마다)
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now - entry.firstUsedAt >= WINDOW_MS) {
      store.delete(key)
    }
  }
}, 60 * 60 * 1000)

function getClientIp(request: FastifyRequest): string {
  const forwarded = request.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].split(',')[0].trim()
  }
  return request.ip
}

export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const ip = getClientIp(request)
    const key = `${ip}:${config.category}`
    const now = Date.now()

    let entry = store.get(key)

    // 윈도우 만료 시 리셋
    if (entry && now - entry.firstUsedAt >= config.windowMs) {
      store.delete(key)
      entry = undefined
    }

    // 첫 사용 시점부터 카운트 시작
    if (!entry) {
      entry = { count: 1, firstUsedAt: now }
      store.set(key, entry)

      void reply.header('X-RateLimit-Limit', String(config.maxRequests))
      void reply.header('X-RateLimit-Remaining', String(config.maxRequests - 1))
      void reply.header('X-RateLimit-Reset', new Date(now + config.windowMs).toISOString())
      return
    }

    // 횟수 초과 체크
    if (entry.count >= config.maxRequests) {
      const resetAt = entry.firstUsedAt + config.windowMs
      const resetInMin = Math.ceil((resetAt - now) / 60000)

      void reply.header('X-RateLimit-Limit', String(config.maxRequests))
      void reply.header('X-RateLimit-Remaining', '0')
      void reply.header('X-RateLimit-Reset', new Date(resetAt).toISOString())

      const label = config.category === 'analysis' ? 'AI 분석' : 'AI 추천'
      throw new AppError(
        429,
        `${label} 요청 횟수(${config.maxRequests}회)를 초과했습니다. ${resetInMin}분 후에 다시 시도해주세요.`,
        'RATE_LIMIT_EXCEEDED',
      )
    }

    entry.count++
    const resetAt = entry.firstUsedAt + config.windowMs

    void reply.header('X-RateLimit-Limit', String(config.maxRequests))
    void reply.header('X-RateLimit-Remaining', String(config.maxRequests - entry.count))
    void reply.header('X-RateLimit-Reset', new Date(resetAt).toISOString())
  }
}

/** 내 정보 페이지에서 사용량 조회용 */
export function getRateLimitStatus(ip: string): {
  analysis: { used: number; max: number; resetAt: string | null }
  recommend: { used: number; max: number; resetAt: string | null }
} {
  const now = Date.now()

  function getStatus(category: RateLimitCategory, max: number) {
    const entry = store.get(`${ip}:${category}`)
    if (!entry || now - entry.firstUsedAt >= WINDOW_MS) {
      return { used: 0, max, resetAt: null }
    }
    return {
      used: entry.count,
      max,
      resetAt: new Date(entry.firstUsedAt + WINDOW_MS).toISOString(),
    }
  }

  return {
    analysis: getStatus('analysis', 5),
    recommend: getStatus('recommend', 10),
  }
}

export { getClientIp }
