'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { getApiErrorMessage } from '@/contexts/AuthContext'

interface FieldErrors {
  password?: string
  passwordConfirm?: string
  api?: string
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  if (!token) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-red-600 mb-4">유효하지 않은 접근입니다.</p>
        <Link href="/forgot-password" className="text-sm text-primary-600 hover:underline">
          비밀번호 찾기로 이동
        </Link>
      </div>
    )
  }

  const validate = (): boolean => {
    const next: FieldErrors = {}
    if (password.length < 8) {
      next.password = '비밀번호는 8자 이상이어야 합니다.'
    } else if (!/[a-zA-Z]/.test(password)) {
      next.password = '영문자를 포함해주세요.'
    } else if (!/[0-9]/.test(password)) {
      next.password = '숫자를 포함해주세요.'
    } else if (!/[^a-zA-Z0-9]/.test(password)) {
      next.password = '특수문자를 포함해주세요.'
    }
    if (password !== passwordConfirm) next.passwordConfirm = '비밀번호가 일치하지 않습니다.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setErrors({})
    setIsSubmitting(true)
    try {
      await api.post('/api/auth/reset-password', { token, password })
      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch (err) {
      setErrors({ api: getApiErrorMessage(err) })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-900 mb-1">비밀번호가 변경되었습니다</p>
        <p className="text-sm text-gray-500">잠시 후 로그인 페이지로 이동합니다...</p>
        <Link href="/login" className="mt-6 inline-block text-sm text-primary-600 hover:underline">
          지금 로그인하기
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">새 비밀번호</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="새 비밀번호 (8자 이상, 영문+숫자+특수문자)"
          required
          className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none transition-colors ${
            errors.password ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-primary-500'
          }`}
        />
        {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">비밀번호 확인</label>
        <input
          type="password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          placeholder="비밀번호를 다시 입력하세요"
          required
          className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none transition-colors ${
            errors.passwordConfirm ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-primary-500'
          }`}
        />
        {errors.passwordConfirm && <p className="mt-1.5 text-xs text-red-600">{errors.passwordConfirm}</p>}
      </div>

      {errors.api && (
        <p className="text-sm text-red-600 text-center">{errors.api}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white py-3 rounded-lg text-sm font-semibold transition-colors"
      >
        {isSubmitting ? '변경 중...' : '비밀번호 변경'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-primary-600">Scorely</Link>
          <h1 className="text-xl font-bold text-gray-900 mt-3">비밀번호 재설정</h1>
          <p className="text-sm text-gray-500 mt-1">새로운 비밀번호를 입력해주세요</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <Suspense
            fallback={
              <div className="flex justify-center py-4">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-primary-600 border-r-transparent" />
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          © 2025 Scorely. All rights reserved.
        </p>
      </div>
    </div>
  )
}
