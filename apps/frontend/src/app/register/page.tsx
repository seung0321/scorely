'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth, getApiErrorMessage } from '@/contexts/AuthContext'

interface FieldErrors {
  name?: string
  email?: string
  password?: string
  passwordConfirm?: string
  api?: string
}

export default function RegisterPage() {
  const { register, user, loading } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) router.replace('/upload')
  }, [user, loading, router])

  const validate = (): boolean => {
    const next: FieldErrors = {}
    if (name.length < 2) next.name = '이름은 2자 이상이어야 합니다.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = '올바른 이메일 형식을 입력하세요.'
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
    setIsSubmitting(true)
    try {
      await register({ name, email, password })
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none transition-colors ${
                  errors.email ? 'border-red-400' : 'border-gray-300 focus:border-primary-500'
                }`}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

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

            {errors.api && (
              <p className="text-sm text-red-600 text-center">{errors.api}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white py-3 rounded-lg text-sm font-semibold transition-colors"
            >
              {isSubmitting ? '가입 중...' : '회원가입'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm">
            <Link href="/login" className="text-primary-600 font-medium hover:underline">
              이미 계정이 있으신가요? 로그인
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          가입 시{' '}
          <a href="#" className="underline">서비스 이용약관</a>에 동의하게 됩니다
        </p>
      </div>
    </div>
  )
}
