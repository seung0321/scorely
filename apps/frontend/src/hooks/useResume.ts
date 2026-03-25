import { AnalysisResult, JobCategory, ResumeVersion, ResumeSections, SectionRecommendResult, RecommendableSectionType } from '@scorely/types'
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
  newResumeId: string
}

interface ScoreHistoryItem {
  version: number
  totalScore: number
  createdAt: string
  jobCategory: string
}

export function useResume() {
  async function upload(file: File, jobCategory: JobCategory): Promise<UploadResult> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('jobCategory', jobCategory)
    formData.append('experienceLevel', '신입')
    const res = await api.post<{ success: true; data: UploadResult }>(
      '/api/resume/upload',
      formData,
      { headers: { 'Content-Type': undefined } }
    )
    return res.data.data
  }

  async function getHistory(): Promise<ResumeVersion[]> {
    const res = await api.get<{ success: true; data: ResumeVersion[] }>('/api/resume/history')
    return res.data.data
  }

  async function getDetail(id: string): Promise<ResumeVersion> {
    const res = await api.get<{ success: true; data: ResumeVersion }>(`/api/resume/${id}`)
    return res.data.data
  }

  async function saveText(resumeId: string, editedText: string): Promise<void> {
    await api.patch(`/api/resume/${resumeId}/text`, { editedText })
  }

  async function reanalyze(resumeId: string, jobCategory?: JobCategory): Promise<ReanalyzeResult> {
    const body: { jobCategory?: JobCategory } = {}
    if (jobCategory) body.jobCategory = jobCategory
    const res = await api.post<{ success: true; data: ReanalyzeResult }>(
      `/api/resume/${resumeId}/reanalyze`,
      body,
    )
    return res.data.data
  }

  async function saveSections(resumeId: string, sections: ResumeSections): Promise<void> {
    await api.patch(`/api/resume/${resumeId}/sections`, sections)
  }

  async function getScoreHistory(): Promise<ScoreHistoryItem[]> {
    const res = await api.get<{ success: true; data: ScoreHistoryItem[] }>('/api/analysis/history')
    return res.data.data
  }

  async function deleteResume(id: string): Promise<void> {
    await api.delete(`/api/resume/${id}`)
  }

  async function sectionRecommend(
    resumeId: string,
    sectionType: RecommendableSectionType,
    content: string,
    jobCategory: JobCategory,
  ): Promise<SectionRecommendResult> {
    const res = await api.post<{ success: true; data: SectionRecommendResult }>(
      `/api/resume/${resumeId}/section-recommend`,
      { sectionType, content, jobCategory },
    )
    return res.data.data
  }

  return { upload, getHistory, getDetail, saveText, saveSections, reanalyze, getScoreHistory, deleteResume, sectionRecommend }
}
