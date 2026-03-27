'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Logo from '@/components/common/Logo'

export default function Navbar() {
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
    router.push('/')
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Logo size="sm" />
          </Link>

          {!loading && (
            <>
              {/* PC 메뉴 */}
              <div className="hidden sm:flex items-center gap-3">
                {user ? (
                  <>
                    <Link href="/history" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                      내 이력서
                    </Link>
                    <Link href="/upload" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                      업로드
                    </Link>
                    <Link href="/mypage" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
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
                    <Link href="/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
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

              {/* 모바일 햄버거 버튼 */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="sm:hidden p-2 text-gray-600 hover:text-gray-900"
                aria-label="메뉴"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 모바일 드롭다운 메뉴 */}
      {menuOpen && !loading && (
        <div className="sm:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3 space-y-1">
            {user ? (
              <>
                <Link
                  href="/history"
                  onClick={() => setMenuOpen(false)}
                  className="block py-2 text-sm text-gray-700 hover:text-gray-900 font-medium"
                >
                  내 이력서
                </Link>
                <Link
                  href="/upload"
                  onClick={() => setMenuOpen(false)}
                  className="block py-2 text-sm text-gray-700 hover:text-gray-900 font-medium"
                >
                  업로드
                </Link>
                <Link
                  href="/mypage"
                  onClick={() => setMenuOpen(false)}
                  className="block py-2 text-sm text-gray-700 hover:text-gray-900 font-medium"
                >
                  내 정보
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left py-2 text-sm text-gray-500 hover:text-gray-800 font-medium"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block py-2 text-sm text-gray-700 hover:text-gray-900 font-medium"
                >
                  로그인
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="block py-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  시작하기
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
