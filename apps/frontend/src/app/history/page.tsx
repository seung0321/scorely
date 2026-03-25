'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ResumeVersion } from '@scorely/types'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useResume } from '@/hooks/useResume'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'

const HistoryChart = dynamic(() => import('@/components/resume/HistoryChart'), {
  ssr: false,
  loading: () => (
    <div className="h-48 flex items-center justify-center">
      <LoadingSpinner />
    </div>
  ),
})

interface ScoreHistoryItem {
  version: number
  totalScore: number
  createdAt: string
  jobCategory: string
}

export default function HistoryPage() {
  const { isReady } = useRequireAuth()
  const { getHistory, getScoreHistory, deleteResume } = useResume()

  const [versions, setVersions] = useState<ResumeVersion[]>([])
  const [scoreHistory, setScoreHistory] = useState<ScoreHistoryItem[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!isReady) return
    try {
      setPageLoading(true)
      const [historyData, scoreData] = await Promise.all([getHistory(), getScoreHistory()])
      setVersions(historyData)
      setScoreHistory(scoreData)
    } catch {
      setError('데이터를 불러오는 데 실패했습니다.')
    } finally {
      setPageLoading(false)
    }
  }, [isReady]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDelete = async (id: string) => {
    if (!confirm('이 이력서를 삭제하시겠습니까? 복구할 수 없습니다.')) return
    setDeletingId(id)
    try {
      await deleteResume(id)
      await fetchData()
    } catch {
      setError('삭제에 실패했습니다.')
    } finally {
      setDeletingId(null)
    }
  }

  if (!isReady || pageLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">분석 히스토리</h1>
            <p className="text-sm text-gray-500 mt-1">지금까지 업로드한 이력서의 점수 변화를 확인하세요.</p>
          </div>
          <Link
            href="/upload"
            className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + 새 이력서 업로드
          </Link>
        </div>

        {error && <ErrorMessage message={error} onRetry={fetchData} />}

        {versions.length === 0 && !error ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-4xl mb-4">📄</p>
            <p className="text-gray-700 font-medium mb-2">아직 분석 기록이 없어요.</p>
            <p className="text-sm text-gray-500 mb-6">이력서를 업로드해보세요!</p>
            <Link
              href="/upload"
              className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
            >
              이력서 업로드
            </Link>
          </div>
        ) : (
          <>
            {/* 점수 추이 차트 */}
            {scoreHistory.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-gray-800">점수 변화 추이</h2>
                  <span className="text-xs text-gray-400">최근 {scoreHistory.length}개 버전 기준</span>
                </div>
                <HistoryChart data={scoreHistory} />
              </div>
            )}

            {/* 버전 목록 */}
            <div>
              <h2 className="text-base font-semibold text-gray-800 mb-3">버전별 기록</h2>
              <div className="space-y-3">
                {versions.map((v, i) => {
                  const isLatest = i === 0
                  const prevVersion = versions[i + 1]
                  const scoreDiff =
                    v.analysis && prevVersion?.analysis
                      ? v.analysis.totalScore - prevVersion.analysis.totalScore
                      : null

                  return (
                    <div
                      key={v.id}
                      className={`bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4 ${
                        isLatest ? 'bg-primary-50 border-primary-200' : ''
                      }`}
                    >
                      {/* 버전 배지 */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          isLatest ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        v{v.version}
                      </div>

                      {/* 정보 */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{v.jobCategory}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(v.createdAt).toLocaleDateString('ko-KR')}
                        </p>
                      </div>

                      {/* 점수 */}
                      <div className="text-right flex-shrink-0">
                        <p className={`text-xl font-bold ${isLatest ? 'text-primary-600' : 'text-gray-800'}`}>
                          {v.analysis?.totalScore ?? '-'}점
                        </p>
                        {scoreDiff !== null && (
                          <p
                            className={`text-xs font-medium ${
                              scoreDiff >= 0 ? 'text-green-600' : 'text-red-500'
                            }`}
                          >
                            {scoreDiff >= 0 ? `+${scoreDiff}점` : `${scoreDiff}점`}
                          </p>
                        )}
                      </div>

                      {/* 버튼 */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link
                          href={`/analysis/${v.id}`}
                          className="border border-gray-300 hover:border-primary-400 text-gray-600 hover:text-primary-600 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                        >
                          자세히 보기 →
                        </Link>
                        <button
                          onClick={() => handleDelete(v.id)}
                          disabled={deletingId === v.id}
                          className="border border-red-200 hover:border-red-400 text-red-400 hover:text-red-600 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {deletingId === v.id ? '삭제 중...' : '삭제'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* 푸터 */}
        <p className="text-center text-xs text-gray-400 pb-4">
          © 2025 Scorely AI Resume Service. All rights reserved.
        </p>
      </div>
    </div>
  )
}
