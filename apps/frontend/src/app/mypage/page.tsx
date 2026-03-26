'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RateLimitStatus } from '@scorely/types'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import { removeToken, removeRefreshToken } from '@/lib/auth'
import ConfirmModal from '@/components/common/ConfirmModal'
import LoadingSpinner from '@/components/common/LoadingSpinner'

function formatTimeRemaining(resetAt: string | null): string {
  if (!resetAt) return ''
  const diff = new Date(resetAt).getTime() - Date.now()
  if (diff <= 0) return '곧 초기화됩니다'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.ceil((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 0) return `${hours}시간 ${minutes}분 후 초기화`
  return `${minutes}분 후 초기화`
}

export default function MyPage() {
  const { isReady } = useRequireAuth()
  const { user, logout } = useAuth()
  const router = useRouter()

  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteAllModal, setDeleteAllModal] = useState(false)
  const [withdrawModal, setWithdrawModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchRateLimitStatus = useCallback(async () => {
    try {
      const res = await api.get<{ success: true; data: RateLimitStatus }>(
        '/api/auth/rate-limit-status',
      )
      setRateLimitStatus(res.data.data)
    } catch {
      // 조회 실패해도 페이지는 정상 표시
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isReady) {
      fetchRateLimitStatus()
    }
  }, [isReady, fetchRateLimitStatus])

  // 1분마다 카운트다운 갱신
  useEffect(() => {
    if (!rateLimitStatus) return
    const interval = setInterval(() => {
      setRateLimitStatus((prev) => (prev ? { ...prev } : null))
    }, 60000)
    return () => clearInterval(interval)
  }, [rateLimitStatus])

  const handleDeleteAll = async () => {
    setActionLoading(true)
    try {
      await api.delete('/api/resume/all')
      setDeleteAllModal(false)
      alert('모든 이력서가 삭제되었습니다.')
    } catch {
      alert('이력서 삭제 중 오류가 발생했습니다.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleWithdraw = async () => {
    setActionLoading(true)
    try {
      await api.delete('/api/auth/account')
      removeToken()
      removeRefreshToken()
      setWithdrawModal(false)
      await logout()
      router.push('/')
    } catch {
      alert('회원 탈퇴 중 오류가 발생했습니다.')
      setActionLoading(false)
    }
  }

  if (!isReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const analysis = rateLimitStatus?.analysis
  const recommend = rateLimitStatus?.recommend

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">내 정보</h1>

        {/* 사용자 정보 */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">사용자 정보</h2>
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <span className="text-gray-500 w-20">이름</span>
              <span className="text-gray-900 font-medium">{user?.name}</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="text-gray-500 w-20">이메일</span>
              <span className="text-gray-900 font-medium">{user?.email}</span>
            </div>
          </div>
        </section>

        {/* AI 사용량 */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">AI 사용량</h2>
          <div className="space-y-5">
            {/* 이력서 분석 */}
            <UsageBar
              label="이력서 분석"
              used={analysis?.used ?? 0}
              max={analysis?.max ?? 5}
              resetAt={analysis?.resetAt ?? null}
              color="blue"
            />
            {/* AI 텍스트 추천 */}
            <UsageBar
              label="AI 텍스트 추천"
              used={recommend?.used ?? 0}
              max={recommend?.max ?? 10}
              resetAt={recommend?.resetAt ?? null}
              color="violet"
            />
          </div>
        </section>

        {/* 데이터 관리 */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">데이터 관리</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setDeleteAllModal(true)}
              className="px-4 py-2.5 text-sm font-medium text-red-600 border border-red-300 hover:bg-red-50 rounded-lg transition-colors"
            >
              이력서 전체 삭제
            </button>
            <button
              onClick={() => setWithdrawModal(true)}
              className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              회원 탈퇴
            </button>
          </div>
        </section>
      </div>

      <ConfirmModal
        isOpen={deleteAllModal}
        title="이력서 전체 삭제"
        message="정말로 모든 이력서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText={actionLoading ? '삭제 중...' : '삭제'}
        variant="danger"
        onConfirm={handleDeleteAll}
        onCancel={() => setDeleteAllModal(false)}
      />

      <ConfirmModal
        isOpen={withdrawModal}
        title="회원 탈퇴"
        message="정말로 탈퇴하시겠습니까? 모든 데이터가 삭제되며 복구할 수 없습니다."
        confirmText={actionLoading ? '처리 중...' : '탈퇴'}
        variant="danger"
        onConfirm={handleWithdraw}
        onCancel={() => setWithdrawModal(false)}
      />
    </div>
  )
}

function UsageBar({
  label,
  used,
  max,
  resetAt,
  color,
}: {
  label: string
  used: number
  max: number
  resetAt: string | null
  color: 'blue' | 'violet'
}) {
  const percentage = Math.min((used / max) * 100, 100)
  const remaining = Math.max(max - used, 0)

  const barColor =
    color === 'blue'
      ? 'bg-blue-500'
      : 'bg-violet-500'

  const bgColor =
    color === 'blue'
      ? 'bg-blue-100'
      : 'bg-violet-100'

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-gray-700">
          {label} ({used}/{max})
        </span>
        <span className="text-sm text-gray-500">{remaining}회 남음</span>
      </div>
      <div className={`w-full h-2.5 rounded-full ${bgColor}`}>
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {resetAt && (
        <p className="text-xs text-gray-400 mt-1">
          {formatTimeRemaining(resetAt)}
        </p>
      )}
    </div>
  )
}
