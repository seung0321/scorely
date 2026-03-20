import { AnalysisResult, JobCategory, ExperienceLevel, ResumeVersion, ResumeSections } from '@resumate/types'
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
  async function upload(file: File, jobCategory: JobCategory, experienceLevel: ExperienceLevel): Promise<UploadResult> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('jobCategory', jobCategory)
    formData.append('experienceLevel', experienceLevel)
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

  async function reanalyze(resumeId: string, jobCategory?: JobCategory, experienceLevel?: ExperienceLevel): Promise<ReanalyzeResult> {
    const body: { jobCategory?: JobCategory; experienceLevel?: ExperienceLevel } = {}
    if (jobCategory) body.jobCategory = jobCategory
    if (experienceLevel) body.experienceLevel = experienceLevel
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

  return { upload, getHistory, getDetail, saveText, saveSections, reanalyze, getScoreHistory, deleteResume }
}
