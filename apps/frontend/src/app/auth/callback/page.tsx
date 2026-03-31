'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { setToken, setRefreshToken } from '@/lib/auth'
import api from '@/lib/api'
import { User } from '@scorely/types'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    const token = searchParams.get('token')
    const refreshToken = searchParams.get('refreshToken')
    const error = searchParams.get('error')

    if (error || !token || !refreshToken) {
      router.replace('/login?error=oauth_failed')
      return
    }

    setToken(token)
    setRefreshToken(refreshToken)

    // user 상태 갱신을 위해 /me 호출 후 이동
    api.get<{ success: true; data: User }>('/api/auth/me')
      .then(() => {
        router.replace('/history')
      })
      .catch(() => {
        router.replace('/login?error=oauth_failed')
      })
  }, [searchParams, router])

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-r-transparent" />
        <p className="mt-4 text-sm text-gray-500">로그인 처리 중...</p>
      </div>
    </div>
  )
}
