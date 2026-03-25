'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { JobCategory } from '@scorely/types'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useResume } from '@/hooks/useResume'
import { getApiErrorMessage } from '@/contexts/AuthContext'
import UploadDropzone from '@/components/resume/UploadDropzone'
import ErrorMessage from '@/components/common/ErrorMessage'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function UploadPage() {
  const { isReady } = useRequireAuth()
  const { upload } = useResume()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async (file: File, jobCategory: JobCategory) => {
    setError(null)
    setIsLoading(true)
    try {
      const result = await upload(file, jobCategory)
      router.push(`/analysis/${result.resumeId}`)
    } catch (err) {
      setError(getApiErrorMessage(err))
      setIsLoading(false)
    }
  }

  if (!isReady) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-100 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">이력서 업로드</h1>
          <p className="text-sm text-gray-500 mt-2">
            PDF 파일을 업로드하면 AI가 직군에 맞게 분석해드립니다
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          {error && (
            <div className="mb-4">
              <ErrorMessage message={error} onRetry={() => setError(null)} />
            </div>
          )}
          <UploadDropzone onUpload={handleUpload} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}
