'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth, getApiErrorMessage } from '@/contexts/AuthContext'
import api from '@/lib/api'

export default function VerifyEmailPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
    if (!loading && user?.emailVerified) router.replace('/upload')
  }, [user, loading, router])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const handleDigitChange = (index: number, value: string) => {
    const v = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = v
    setDigits(next)
    setError(null)
    if (v && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
    // 6자리 모두 입력되면 자동 제출
    if (v && index === 5) {
      const code = next.join('')
      if (code.length === 6) submitCode(code)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setDigits(pasted.split(''))
      inputRefs.current[5]?.focus()
      submitCode(pasted)
    }
  }

  const submitCode = async (code: string) => {
    setError(null)
    setIsSubmitting(true)
    try {
      await api.post('/api/auth/verify-email', { code })
      // 인증 성공 후 me 재조회를 위해 새로고침
      window.location.href = '/upload'
    } catch (err) {
      setError(getApiErrorMessage(err))
      setDigits(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const code = digits.join('')
    if (code.length !== 6) {
      setError('6자리 인증 코드를 모두 입력해주세요')
      return
    }
    submitCode(code)
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setResendMessage(null)
    setError(null)
    try {
      await api.post('/api/auth/resend-verification')
      setResendCooldown(60)
      setResendMessage('인증 코드가 재전송되었습니다')
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-r-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-primary-600">Scorely</Link>
          <h1 className="text-xl font-bold text-gray-900 mt-3">이메일 인증</h1>
          <p className="text-sm text-gray-500 mt-1">
            {user?.email}으로 인증 코드를 보냈습니다
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <form onSubmit={handleSubmit}>
            <div onPaste={handlePaste} className="flex gap-1.5 sm:gap-2 justify-center mb-6">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold border rounded-lg focus:outline-none transition-colors ${
                    error
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-gray-300 focus:border-primary-500'
                  }`}
                />
              ))}
            </div>

            {error && (
              <p className="text-center text-sm text-red-600 mb-4">{error}</p>
            )}
            {resendMessage && (
              <p className="text-center text-sm text-green-600 mb-4">{resendMessage}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || digits.join('').length !== 6}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white py-3 rounded-lg text-sm font-semibold transition-colors"
            >
              {isSubmitting ? '확인 중...' : '인증 확인'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-sm text-gray-500">코드를 받지 못하셨나요? </span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="text-sm text-primary-600 hover:underline disabled:text-gray-400 disabled:no-underline"
            >
              {resendCooldown > 0 ? `재전송 (${resendCooldown}초)` : '재전송'}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          © 2025 Scorely. All rights reserved.
        </p>
      </div>
    </div>
  )
}
