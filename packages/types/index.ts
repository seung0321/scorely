export type JobCategory =
  | '백엔드 개발자'
  | '프론트엔드 개발자'
  | '기획자'
  | '마케터'
  | '디자이너'
  | '데이터 분석가'

export interface ScoreDetail {
  tech: number
  project: number
  achievement: number
  communication: number
  structure: number
}

export interface Improvement {
  category: string
  issue: string
  suggestion: string
}

export interface AnalysisResult {
  scores: ScoreDetail
  totalScore: number
  strengths: string[]
  improvements: Improvement[]
  oneLiner: string
}

export interface ResumeVersion {
  id: string
  version: number
  jobCategory: JobCategory
  extractedText: string      // 에디터에 표시할 텍스트
  createdAt: string
  analysis: AnalysisResult | null
}

export interface User {
  id: string
  email: string
  name: string
}

export interface ApiSuccess<T> {
  success: true
  data: T
  message?: string
}

export interface ApiError {
  success: false
  error: { code: string; message: string }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError
