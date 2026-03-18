export type JobCategory =
  | 'IT개발·데이터'
  | '디자인'
  | '마케팅·광고'
  | '경영·기획'
  | '영업·판매'
  | '회계·세무·재무'
  | '인사·노무'
  | '의료·제약'
  | '금융·보험'
  | '연구·R&D'
  | '교육'
  | '생산·제조'
  | '기타'

export interface ScoreDetail {
  expertise: number
  experience: number
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

export interface ResumeSections {
  summary?: string
  experience?: string
  education?: string
  training?: string
  skills?: string
  projects?: string[]
  certifications?: string
  activities?: string
  awards?: string
}

export interface ResumeVersion {
  id: string
  version: number
  jobCategory: JobCategory
  extractedText: string      // 에디터에 표시할 텍스트
  sections: ResumeSections | null
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
