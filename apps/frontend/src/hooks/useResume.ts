import { useCallback } from 'react'
import { AnalysisResult, JobCategory, ResumeVersion, ResumeSections } from '@resumate/types'
import api from '@/lib/api'

interface UploadResult {
  resumeId: string
  version: number
  extractedText: string
  sections: ResumeSections
  analysis: AnalysisResult
}

interface ReanalyzeResult {
  analysis: AnalysisResult
  version: number
}

interface ScoreHistoryItem {
  version: number
  totalScore: number
  createdAt: string
  jobCategory: string
}

export function useResume() {
  const upload = useCallback(async (file: File, jobCategory: JobCategory): Promise<UploadResult> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('jobCategory', jobCategory)
    const res = await api.post<{ success: true; data: UploadResult }>(
      '/api/resume/upload',
      formData,
      { headers: { 'Content-Type': undefined } }
    )
    return res.data.data
  }, [])

  const getHistory = useCallback(async (): Promise<ResumeVersion[]> => {
    const res = await api.get<{ success: true; data: ResumeVersion[] }>('/api/resume/history')
    return res.data.data
  }, [])

  const getDetail = useCallback(async (id: string): Promise<ResumeVersion> => {
    const res = await api.get<{ success: true; data: ResumeVersion }>(`/api/resume/${id}`)
    return res.data.data
  }, [])

  const saveText = useCallback(async (resumeId: string, editedText: string): Promise<void> => {
    await api.patch(`/api/resume/${resumeId}/text`, { editedText })
  }, [])

  const reanalyze = useCallback(
    async (resumeId: string, jobCategory?: JobCategory): Promise<ReanalyzeResult> => {
      const res = await api.post<{ success: true; data: ReanalyzeResult }>(
        `/api/resume/${resumeId}/reanalyze`,
        jobCategory ? { jobCategory } : {}
      )
      return res.data.data
    },
    []
  )

  const saveSections = useCallback(async (resumeId: string, sections: ResumeSections): Promise<void> => {
    await api.patch(`/api/resume/${resumeId}/sections`, sections)
  }, [])

  const getScoreHistory = useCallback(async (): Promise<ScoreHistoryItem[]> => {
    const res = await api.get<{ success: true; data: ScoreHistoryItem[] }>('/api/analysis/history')
    return res.data.data
  }, [])

  return { upload, getHistory, getDetail, saveText, saveSections, reanalyze, getScoreHistory }
}
