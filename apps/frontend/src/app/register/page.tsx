'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth, getApiErrorMessage } from '@/contexts/AuthContext'
import api from '@/lib/api'

type EmailVerifyState = 'idle' | 'sending' | 'sent' | 'verified'

interface FieldErrors {
  name?: string
  email?: string
  code?: string
  password?: string
  passwordConfirm?: string
  terms?: string
  privacy?: string
  api?: string
}

export default function RegisterPage() {
  const { register, loginWithGoogle, user, loading } = useAuth()
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [agreedPrivacy, setAgreedPrivacy] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [emailVerifyState, setEmailVerifyState] = useState<EmailVerifyState>('idle')
  const [resendCooldown, setResendCooldown] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!loading && user) router.replace('/upload')
  }, [user, loading, router])

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current)
    }
  }, [])

  const startCooldown = () => {
    setResendCooldown(60)
    cooldownRef.current = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) {
          clearInterval(cooldownRef.current!)
          return 0
        }
        return c - 1
      })
    }, 1000)
  }

  const handleSendCode = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors((prev) => ({ ...prev, email: '올바른 이메일 형식을 입력하세요.' }))
      return
    }
    setErrors((prev) => ({ ...prev, email: undefined, code: undefined }))
    setEmailVerifyState('sending')
    try {
      await api.post('/api/auth/send-email-code', { email })
      setEmailVerifyState('sent')
      startCooldown()
    } catch (err) {
      setErrors((prev) => ({ ...prev, email: getApiErrorMessage(err) }))
      setEmailVerifyState('idle')
    }
  }

  const handleCheckCode = async () => {
    if (code.length !== 6) {
      setErrors((prev) => ({ ...prev, code: '6자리 인증 코드를 입력해주세요.' }))
      return
    }
    setErrors((prev) => ({ ...prev, code: undefined }))
    try {
      await api.post('/api/auth/check-email-code', { email, code })
      setEmailVerifyState('verified')
      if (cooldownRef.current) clearInterval(cooldownRef.current)
    } catch (err) {
      setErrors((prev) => ({ ...prev, code: getApiErrorMessage(err) }))
    }
  }

  const validate = (): boolean => {
    const next: FieldErrors = {}
    if (name.length < 2) next.name = '이름은 2자 이상이어야 합니다.'
    if (emailVerifyState !== 'verified') next.email = '이메일 인증을 완료해주세요.'
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
    if (!agreedTerms) next.terms = '이용약관에 동의해주세요.'
    if (!agreedPrivacy) next.privacy = '개인정보 수집·이용에 동의해주세요.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    try {
      await register({ name, email, password, code })
      router.push('/upload')
    } catch (err) {
      setErrors({ api: getApiErrorMessage(err) })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-primary-600">Scorely</Link>
          <h1 className="text-xl font-bold text-gray-900 mt-3">회원가입</h1>
          <p className="text-sm text-gray-500 mt-1">무료로 시작하세요</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none transition-colors ${
                  errors.name ? 'border-red-400' : 'border-gray-300 focus:border-primary-500'
                }`}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            {/* 이메일 + 인증번호 보내기 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">이메일</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (emailVerifyState !== 'idle') setEmailVerifyState('idle')
                    setCode('')
                  }}
                  disabled={emailVerifyState === 'verified'}
                  placeholder="example@email.com"
                  className={`flex-1 border rounded-lg px-4 py-3 text-sm focus:outline-none transition-colors disabled:bg-gray-50 ${
                    errors.email ? 'border-red-400' : 'border-gray-300 focus:border-primary-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={emailVerifyState === 'sending' || emailVerifyState === 'verified' || resendCooldown > 0}
                  className="shrink-0 px-3 py-2 text-xs font-medium border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 disabled:border-gray-300 disabled:text-gray-400 transition-colors"
                >
                  {emailVerifyState === 'sending'
                    ? '전송 중...'
                    : emailVerifyState === 'verified'
                    ? '인증완료'
                    : resendCooldown > 0
                    ? `재전송 (${resendCooldown}s)`
                    : emailVerifyState === 'sent'
                    ? '재전송'
                    : '인증번호 보내기'}
                </button>
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              {emailVerifyState === 'verified' && (
                <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  이메일 인증이 완료되었습니다
                </p>
              )}
            </div>

            {/* 인증코드 입력 (코드 발송 후 표시) */}
            {(emailVerifyState === 'sent') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">인증번호</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                      setErrors((prev) => ({ ...prev, code: undefined }))
                    }}
                    placeholder="6자리 인증번호 입력"
                    className={`flex-1 border rounded-lg px-4 py-3 text-sm focus:outline-none transition-colors ${
                      errors.code ? 'border-red-400' : 'border-gray-300 focus:border-primary-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleCheckCode}
                    className="shrink-0 px-3 py-2 text-xs font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    인증하기
                  </button>
                </div>
                {errors.code && <p className="mt-1 text-xs text-red-600">{errors.code}</p>}
                <p className="mt-1 text-xs text-gray-400">이메일로 발송된 6자리 코드를 입력하세요 (10분 유효)</p>
              </div>
            )}

            {/* 비밀번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="영문 + 숫자 + 특수문자 포함 8자 이상"
                className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none transition-colors ${
                  errors.password ? 'border-red-400' : 'border-gray-300 focus:border-primary-500'
                }`}
              />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">비밀번호 확인</label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none transition-colors ${
                  errors.passwordConfirm ? 'border-red-400' : 'border-gray-300 focus:border-primary-500'
                }`}
              />
              {errors.passwordConfirm && <p className="mt-1 text-xs text-red-600">{errors.passwordConfirm}</p>}
            </div>

            {/* 동의 체크박스 */}
            <div className="space-y-2 pt-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  <Link href="/terms" target="_blank" className="text-primary-600 underline">이용약관</Link>에 동의합니다 (필수)
                </span>
              </label>
              {errors.terms && <p className="ml-6 text-xs text-red-600">{errors.terms}</p>}

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedPrivacy}
                  onChange={(e) => setAgreedPrivacy(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  <Link href="/privacy" target="_blank" className="text-primary-600 underline">개인정보 수집·이용</Link>에 동의합니다 (필수)
                </span>
              </label>
              {errors.privacy && <p className="ml-6 text-xs text-red-600">{errors.privacy}</p>}
            </div>

            {errors.api && (
              <p className="text-sm text-red-600 text-center">{errors.api}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || emailVerifyState !== 'verified'}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white py-3 rounded-lg text-sm font-semibold transition-colors"
            >
              {isSubmitting ? '가입 중...' : '회원가입'}
            </button>
          </form>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">또는</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            type="button"
            onClick={loginWithGoogle}
            className="mt-4 w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google로 계속하기
          </button>

          <p className="mt-4 text-center text-sm">
            <Link href="/login" className="text-primary-600 font-medium hover:underline">
              이미 계정이 있으신가요? 로그인
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          <Link href="/terms" className="underline hover:text-gray-600">이용약관</Link>
          {' · '}
          <Link href="/privacy" className="underline hover:text-gray-600">개인정보처리방침</Link>
        </p>
      </div>
    </div>
  )
}
