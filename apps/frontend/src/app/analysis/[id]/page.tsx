'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { AnalysisResult, JobCategory, ExperienceLevel, ResumeVersion } from '@resumate/types'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useResume } from '@/hooks/useResume'
import { getApiErrorMessage } from '@/contexts/AuthContext'
import ScorePanel from '@/components/analysis/ScorePanel'
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
  const { getDetail, reanalyze } = useResume()
  const router = useRouter()

  const [resume, setResume] = useState<ResumeVersion | null>(null)
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null)
  const [currentVersion, setCurrentVersion] = useState(0)
  const [previousScore, setPreviousScore] = useState<number | undefined>(undefined)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editorSaveStatus, setEditorSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

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
    async (jobCategory: JobCategory, experienceLevel: ExperienceLevel) => {
      if (!resume) return
      try {
        const prevScore = currentAnalysis?.totalScore
        const result = await reanalyze(resume.id, jobCategory, experienceLevel)
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
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-100">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
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
          <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium">
            {resume.experienceLevel}
          </span>
          <span className="text-xs">
            {new Date(resume.createdAt).toLocaleDateString('ko-KR')}
          </span>
        </div>
      </div>

      {/* 2컬럼 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 왼쪽: 에디터 */}
        <div className="flex-1 overflow-y-auto p-4 min-w-0">
          <ResumeEditor
            resumeId={resume.id}
            sections={resume.sections ?? {}}
            extractedText={resume.editedText ?? resume.extractedText}
            onSaveStatusChange={setEditorSaveStatus}
          />
        </div>

        {/* 오른쪽: 점수 패널 */}
        <div className="w-80 xl:w-96 overflow-y-auto p-4 bg-gray-100 border-l border-gray-200 flex-shrink-0">
          <ScorePanel
            analysis={currentAnalysis}
            version={currentVersion}
            previousScore={previousScore}
            currentJobCategory={resume.jobCategory}
            currentExperienceLevel={resume.experienceLevel}
            isLoading={false}
            isSaving={editorSaveStatus === 'saving'}
            onReanalyze={handleReanalyze}
          />
        </div>
      </div>
    </div>
  )
}
