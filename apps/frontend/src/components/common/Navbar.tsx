'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function Navbar() {
  const { user, logout, loading } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-primary-600 font-bold text-xl">
            Scorely
          </Link>

          {!loading && (
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Link
                    href="/history"
                    className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                  >
                    내 이력서
                  </Link>
                  <Link
                    href="/upload"
                    className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                  >
                    업로드
                  </Link>
                  <Link
                    href="/mypage"
                    className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                  >
                    내 정보
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/register"
                    className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    시작하기
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
