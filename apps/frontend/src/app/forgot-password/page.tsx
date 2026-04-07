'use client'

import { useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { getApiErrorMessage } from '@/contexts/AuthContext'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('이메일을 입력해주세요')
      return
    }
    setError(null)
    setIsSubmitting(true)
    try {
      await api.post('/api/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-primary-600">Scorely</Link>
          <h1 className="text-xl font-bold text-gray-900 mt-3">비밀번호 찾기</h1>
          <p className="text-sm text-gray-500 mt-1">가입한 이메일로 재설정 링크를 보내드립니다</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">이메일을 확인해주세요</p>
              <p className="text-sm text-gray-500">비밀번호 재설정 링크를 이메일로 보냈습니다.<br />링크는 15분간 유효합니다.</p>
              <Link
                href="/login"
                className="mt-6 inline-block text-sm text-primary-600 hover:underline"
              >
                로그인으로 돌아가기
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="가입한 이메일을 입력하세요"
                  required
                  className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none transition-colors ${
                    error ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-primary-500'
                  }`}
                />
                {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white py-3 rounded-lg text-sm font-semibold transition-colors"
              >
                {isSubmitting ? '전송 중...' : '재설정 링크 보내기'}
              </button>

              <p className="text-center text-sm text-gray-500">
                <Link href="/login" className="text-primary-600 hover:underline">
                  로그인으로 돌아가기
                </Link>
              </p>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          © 2025 Scorely. All rights reserved.
        </p>
      </div>
    </div>
  )
}
