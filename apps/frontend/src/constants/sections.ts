import { ResumeSections } from '@resumate/types'

export const SECTION_LABELS: Record<keyof ResumeSections, string> = {
  summary: '간략 소개',
  coverLetter: '자기소개서',
  experience: '경력',
  education: '학력',
  training: '교육 이수',
  skills: '스킬',
  projects: '프로젝트',
  certifications: '자격증',
  activities: '대외활동',
  awards: '수상',
}

export const SECTION_ORDER: (keyof ResumeSections)[] = [
  'summary', 'experience', 'education', 'training', 'projects',
  'skills', 'certifications', 'activities', 'awards', 'coverLetter',
]

export const RECOMMENDABLE_SECTIONS = new Set<keyof ResumeSections>([
  'summary', 'experience', 'projects', 'awards', 'education', 'activities',
])
