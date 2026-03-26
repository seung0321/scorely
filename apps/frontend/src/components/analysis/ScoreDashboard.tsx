'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { AnalysisResult, JobCategory, JOB_CATEGORIES } from '@scorely/types'
import LoadingSpinner from '@/components/common/LoadingSpinner'

const RadarChart = dynamic(() => import('./RadarChart'), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center"><LoadingSpinner size="sm" /></div>,
})

const scoreLabels: Record<keyof AnalysisResult['scores'], string> = {
  expertise: '전문성',
  experience: '실무경험',
  achievement: '성과',
  communication: '협업',
  structure: '구성',
}

interface ScoreDashboardProps {
  analysis: AnalysisResult | null
  version: number
  previousScore?: number
  currentJobCategory: JobCategory
  isLoading: boolean
  isSaving: boolean
  onReanalyze: (jobCategory: JobCategory) => Promise<void>
}

export default function ScoreDashboard({
  analysis,
  version,
  previousScore,
  currentJobCategory,
  isLoading,
  isSaving,
  onReanalyze,
}: ScoreDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<JobCategory>(currentJobCategory)
  const [isReanalyzing, setIsReanalyzing] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleReanalyze = async () => {
    setIsReanalyzing(true)
    try {
      await onReanalyze(selectedCategory)
    } finally {
      setIsReanalyzing(false)
    }
  }

  const scoreDiff =
    previousScore !== undefined && analysis
      ? analysis.totalScore - previousScore
      : null

  return (
    <div className="bg-white border-b border-gray-200 flex-shrink-0">

      {/* ── 항상 고정 컨트롤 바 ── */}
      <div className="flex items-center justify-between gap-2 px-4 py-2 flex-wrap">

        {/* 왼쪽: 재분석 컨트롤 */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as JobCategory)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-primary-400"
          >
            {JOB_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <button
            onClick={handleReanalyze}
            disabled={isReanalyzing || isSaving}
            className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            {isReanalyzing ? (
              <>
                <LoadingSpinner size="sm" className="inline-flex" />
                분석 중...
              </>
            ) : (
              '재분석하기'
            )}
          </button>

          {isSaving && <span className="text-xs text-gray-400">저장 중...</span>}
        </div>

        {/* 오른쪽: 히스토리 + 접기 버튼 */}
        <div className="flex items-center gap-3">
          <a href="/history" className="text-xs text-primary-600 hover:underline whitespace-nowrap">
            히스토리 →
          </a>
          {analysis && (
            <button
              type="button"
              onClick={() => setIsCollapsed((v) => !v)}
              className="text-xs font-medium px-2.5 py-1 rounded-lg border border-gray-300 text-gray-600 hover:border-primary-400 hover:text-primary-600 transition-colors whitespace-nowrap"
            >
              {isCollapsed ? '펼치기 ▼' : '접기 ▲'}
            </button>
          )}
        </div>
      </div>

      {/* ── 접히는 상단 패널 (h-96 = 384px) ── */}
      {!isCollapsed && (
        <div className="flex border-t border-gray-100" style={{ height: '384px' }}>

          {/* 좌: 종합점수 + 레이더차트 */}
          <div className="w-64 flex-shrink-0 flex flex-col items-center p-4 gap-2">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : analysis ? (
              <>
                {/* 종합점수 */}
                <div className="text-center flex-shrink-0">
                  <div className="flex items-end justify-center gap-0.5">
                    <span className="text-4xl font-bold text-primary-600 leading-none">
                      {analysis.totalScore}
                    </span>
                    <span className="text-sm text-gray-400 mb-0.5">/100</span>
                  </div>
                  {scoreDiff !== null && (
                    <span className={`text-xs font-semibold ${scoreDiff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {scoreDiff >= 0 ? `▲ +${scoreDiff}점` : `▼ ${scoreDiff}점`}
                    </span>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">v{version}</p>
                </div>

                {/* 레이더차트 — 남은 높이 전부 사용 */}
                <div className="w-full flex-1 min-h-0">
                  <RadarChart scores={analysis.scores} />
                </div>
              </>
            ) : (
              <p className="text-xs text-gray-400">분석 없음</p>
            )}
          </div>

          <div className="w-px bg-gray-100 flex-shrink-0" />

          {/* 우: 점수바(2열) + 강점/감점/개선사항 */}
          {analysis && (
            <div className="flex-1 flex flex-col overflow-hidden">

              {/* 점수바 — 2열 그리드으로 높이 절약 */}
              <div className="px-4 pt-3 pb-2 grid grid-cols-2 gap-x-6 gap-y-1.5 flex-shrink-0">
                {(Object.keys(scoreLabels) as (keyof AnalysisResult['scores'])[]).map((key) => {
                  const score = analysis.scores[key]
                  const isLow = score < 65
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-14 flex-shrink-0">{scoreLabels[key]}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-0">
                        <div
                          className={`h-1.5 rounded-full transition-all ${isLow ? 'bg-orange-400' : 'bg-primary-500'}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-600 w-5 text-right flex-shrink-0">{score}</span>
                    </div>
                  )
                })}
              </div>

              <div className="h-px bg-gray-100 mx-4 flex-shrink-0" />

              {/* 강점(좌) | 감점+개선사항(우) 2열 */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">

                  {/* 좌: 강점 */}
                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                      강점
                    </p>
                    {analysis.strengths.map((s, i) => (
                      <div key={i} className="bg-green-50 border border-green-100 rounded-lg px-2.5 py-2 text-xs text-green-800 leading-snug">
                        {s}
                      </div>
                    ))}
                  </div>

                  {/* 우: 감점(있는 경우) + 개선사항 */}
                  <div className="flex flex-col gap-1.5">
                    {analysis.penalties.length > 0 && (
                      <>
                        <p className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                          감점
                        </p>
                        {analysis.penalties.map((p, i) => (
                          <div key={i} className="bg-red-50 border-l-2 border-red-400 rounded-lg px-2.5 py-2">
                            <span className="text-xs font-semibold text-red-600">{p.category} -{p.deduction}점</span>
                            <p className="text-xs text-red-700 mt-0.5 leading-snug">{p.reason}</p>
                          </div>
                        ))}
                        <div className="h-px bg-gray-100" />
                      </>
                    )}
                    <p className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
                      개선사항
                    </p>
                    {analysis.improvements.map((item, i) => (
                      <div key={i} className="bg-orange-50 border-l-2 border-orange-400 rounded-lg px-2.5 py-2">
                        <span className="text-xs font-semibold text-orange-600">{item.category}</span>
                        <p className="text-xs text-gray-700 mt-0.5 leading-snug">{item.issue}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 한 줄 총평 — 전체 너비 */}
                <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  <span className="text-xs text-gray-400">총평 </span>
                  <span className="text-xs text-gray-700 font-medium">"{analysis.oneLiner}"</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
