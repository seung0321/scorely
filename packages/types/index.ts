export const JOB_CATEGORIES = [
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
] as const

export type JobCategory = (typeof JOB_CATEGORIES)[number]

export const EXPERIENCE_LEVELS = ['신입'] as const
export type ExperienceLevel = '신입'

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

export interface Penalty {
  category: string
  reason: string
  deduction: number
}

export interface AnalysisResult {
  scores: ScoreDetail
  totalScore: number
  strengths: string[]
  improvements: Improvement[]
  penalties: Penalty[]
  oneLiner: string
}

export interface ResumeSections {
  summary?: string
  coverLetter?: string
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
  experienceLevel: ExperienceLevel
  extractedText: string
  editedText?: string
  sections: ResumeSections | null
  createdAt: string
  analysis: AnalysisResult | null
}

export interface User {
  id: string
  email: string
  name: string
  googleId?: string | null
}

export const RECOMMENDABLE_SECTION_TYPES = ['summary', 'experience', 'projects', 'awards', 'education', 'activities'] as const
export type RecommendableSectionType = (typeof RECOMMENDABLE_SECTION_TYPES)[number]

export interface SectionRecommendRequest {
  sectionType: RecommendableSectionType
  content: string
  jobCategory: JobCategory
}

export interface SectionRecommendResult {
  recommendedText: string
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

export interface RateLimitInfo {
  used: number
  max: number
  resetAt: string | null
}

export interface RateLimitStatus {
  analysis: RateLimitInfo
  recommend: RateLimitInfo
}
