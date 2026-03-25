'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { AnalysisResult, JobCategory, ResumeVersion, RecommendableSectionType, RECOMMENDABLE_SECTION_TYPES } from '@scorely/types'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useResume } from '@/hooks/useResume'
import { getApiErrorMessage } from '@/contexts/AuthContext'
import ScoreDashboard from '@/components/analysis/ScoreDashboard'
import RecommendPanel, { RecommendState } from '@/components/analysis/RecommendPanel'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'

const ResumeEditor = dynamic(() => import('@/components/editor/ResumeEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-white rounded-xl">
      <LoadingSpinner size="lg" />
    </div>
  ),
})

export default function AnalysisPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const { isReady } = useRequireAuth()
  const { getDetail, reanalyze, sectionRecommend } = useResume()
  const router = useRouter()

  const [resume, setResume] = useState<ResumeVersion | null>(null)
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null)
  const [currentVersion, setCurrentVersion] = useState(0)
  const [previousScore, setPreviousScore] = useState<number | undefined>(undefined)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editorSaveStatus, setEditorSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const [recommend, setRecommend] = useState<RecommendState>({
    sectionType: '',
    status: 'idle',
    recommendedText: '',
    errorMessage: '',
  })
  const [activeRecommendSection, setActiveRecommendSection] = useState('')
  const [sectionOverrides, setSectionOverrides] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isReady || !id) return
    const fetchResume = async () => {
      try {
        setPageLoading(true)
        const data = await getDetail(id)
        setResume(data)
        setCurrentAnalysis(data.analysis)
        setCurrentVersion(data.version)
      } catch (err) {
        setError(getApiErrorMessage(err))
      } finally {
        setPageLoading(false)
      }
    }
    fetchResume()
  }, [id, isReady]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleReanalyze = useCallback(
    async (jobCategory: JobCategory) => {
      if (!resume) return
      try {
        const prevScore = currentAnalysis?.totalScore
        const result = await reanalyze(resume.id, jobCategory)
        setPreviousScore(prevScore)
        setCurrentAnalysis(result.analysis)
        setCurrentVersion(result.version)
        router.replace(`/analysis/${result.newResumeId}`)
      } catch (err) {
        throw new Error(getApiErrorMessage(err))
      }
    },
    [resume, currentAnalysis] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const handleSectionRecommend = useCallback(
    async (sectionType: string, content: string) => {
      if (!resume) return

      // projects-0 → projects 로 변환 (API 타입 매핑)
      const apiSectionType: RecommendableSectionType = sectionType.startsWith('projects-')
        ? 'projects'
        : sectionType as RecommendableSectionType

      if (!(RECOMMENDABLE_SECTION_TYPES as readonly string[]).includes(apiSectionType)) return

      setActiveRecommendSection(sectionType)
      setRecommend({ sectionType, status: 'loading', recommendedText: '', errorMessage: '' })

      try {
        const result = await sectionRecommend(resume.id, apiSectionType, content, resume.jobCategory)
        setRecommend({ sectionType, status: 'done', recommendedText: result.recommendedText, errorMessage: '' })
      } catch (err) {
        setRecommend({ sectionType, status: 'error', recommendedText: '', errorMessage: getApiErrorMessage(err) })
      } finally {
        setActiveRecommendSection('')
      }
    },
    [resume, sectionRecommend],
  )

  const handleApplyRecommendation = useCallback((sectionType: string, text: string) => {
    setSectionOverrides((prev) => ({ ...prev, [sectionType]: text }))
    setRecommend({ sectionType: '', status: 'idle', recommendedText: '', errorMessage: '' })
  }, [])

  if (!isReady || pageLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-500">이력서를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <ErrorMessage message={error} onRetry={() => router.refresh()} />
          <Link href="/history" className="block mt-4 text-center text-sm text-primary-600 hover:underline">
            히스토리로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  if (!resume) return null

  return (
    <div className="min-h-[calc(100vh-64px)] lg:h-[calc(100vh-64px)] flex flex-col bg-gray-100">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-gray-900">이력서 분석 결과</h1>
          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">
            V{currentVersion}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">
            {resume.jobCategory}
          </span>
          <span className="text-xs">
            {new Date(resume.createdAt).toLocaleDateString('ko-KR')}
          </span>
        </div>
      </div>

      {/* 상단 대시보드 */}
      <ScoreDashboard
        analysis={currentAnalysis}
        version={currentVersion}
        previousScore={previousScore}
        currentJobCategory={resume.jobCategory}
        isLoading={false}
        isSaving={editorSaveStatus === 'saving'}
        onReanalyze={handleReanalyze}
      />

      {/* 에디터 + 추천 패널 */}
      <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden">
        {/* 에디터 */}
        <div className="flex-1 lg:overflow-y-auto p-4 min-w-0">
          <ResumeEditor
            resumeId={resume.id}
            sections={resume.sections ?? {}}
            extractedText={resume.editedText ?? resume.extractedText}
            onSaveStatusChange={setEditorSaveStatus}
            activeRecommendSection={activeRecommendSection}
            onSectionRecommend={handleSectionRecommend}
            sectionOverrides={sectionOverrides}
          />
        </div>

        {/* AI 추천 패널 */}
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 lg:overflow-hidden border-t lg:border-t-0 lg:border-l border-gray-200">
          <RecommendPanel
            state={recommend}
            onApply={handleApplyRecommendation}
          />
        </div>
      </div>
    </div>
  )
}
