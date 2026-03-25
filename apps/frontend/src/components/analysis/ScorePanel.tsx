'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { AnalysisResult, JobCategory } from '@resumate/types'
import FeedbackList from './FeedbackList'
import LoadingSpinner from '@/components/common/LoadingSpinner'

const RadarChart = dynamic(() => import('./RadarChart'), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center"><LoadingSpinner /></div>,
})

const JOB_CATEGORIES: JobCategory[] = [
  'IT개발·데이터',
  '디자인',
  '마케팅·광고',
  '경영·기획',
  '영업·판매',
  '회계·세무·재무',
  '인사·노무',
  '의료·제약',
  '금융·보험',
  '연구·R&D',
  '교육',
  '생산·제조',
  '기타',
]

interface ScorePanelProps {
  analysis: AnalysisResult | null
  version: number
  previousScore?: number
  currentJobCategory: JobCategory
  isLoading: boolean
  isSaving: boolean
  onReanalyze: (jobCategory: JobCategory) => Promise<void>
}

const scoreLabels: Record<keyof AnalysisResult['scores'], string> = {
  expertise: '전문성',
  experience: '실무 경험',
  achievement: '성과 수치화',
  communication: '협업/커뮤니케이션',
  structure: '이력서 구성',
}

export default function ScorePanel({
  analysis,
  version,
  previousScore,
  currentJobCategory,
  isLoading,
  isSaving,
  onReanalyze,
}: ScorePanelProps) {
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
    <div className="space-y-4">
      {/* 종합 점수 + 접기 버튼 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-gray-500">종합 점수</p>
          {analysis && (
            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
            >
              {isCollapsed ? '펼치기 ▼' : '접기 ▲'}
            </button>
          )}
        </div>
        {isLoading ? (
          <LoadingSpinner className="py-4" />
        ) : analysis ? (
          <>
            <div className="flex items-end justify-center gap-1">
              <span className="text-5xl font-bold text-primary-600">{analysis.totalScore}</span>
              <span className="text-lg text-gray-400 mb-1">/ 100</span>
            </div>
            {scoreDiff !== null && (
              <span
                className={`inline-block mt-1 text-sm font-semibold px-2 py-0.5 rounded-full ${
                  scoreDiff >= 0
                    ? 'bg-green-50 text-green-600'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {scoreDiff >= 0 ? `▲ +${scoreDiff}점 개선됨` : `▼ ${scoreDiff}점`}
              </span>
            )}
            <p className="text-xs text-gray-400 mt-1">v{version}</p>
          </>
        ) : (
          <p className="text-gray-400 text-sm py-4">분석 결과 없음</p>
        )}
      </div>

      {/* 접기/펼치기 대상 영역 */}
      {!isCollapsed && analysis && (
        <>
          {/* 레이더 차트 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <RadarChart scores={analysis.scores} />
          </div>

          {/* 카테고리별 점수 바 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
            {(Object.keys(scoreLabels) as (keyof AnalysisResult['scores'])[]).map((key) => {
              const score = analysis.scores[key]
              const isLow = score < 65
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{scoreLabels[key]}</span>
                    <span className="font-semibold">{score}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isLow ? 'bg-orange-400' : 'bg-primary-600'
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* 강점 / 감점 / 개선사항 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <FeedbackList
              strengths={analysis.strengths}
              improvements={analysis.improvements}
              penalties={analysis.penalties}
              oneLiner={analysis.oneLiner}
            />
          </div>
        </>
      )}

      {/* 재분석 영역 — 항상 표시 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as JobCategory)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-primary-500"
          >
            {JOB_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button
            onClick={handleReanalyze}
            disabled={isReanalyzing || isSaving}
            className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
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
        </div>
        {isSaving && (
          <p className="text-xs text-gray-400 text-center">저장 중... 완료 후 재분석 가능합니다</p>
        )}
      </div>

      <a href="/history" className="block text-center text-sm text-primary-600 hover:underline">
        전체 버전 히스토리 보기 →
      </a>
    </div>
  )
}
