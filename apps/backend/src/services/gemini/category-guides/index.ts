import { JobCategory } from '@scorely/types'
import { CategoryGuideEntry } from '../types'
import { itDevGuide } from './it-dev'
import { designGuide } from './design'
import { marketingGuide } from './marketing'
import { businessGuide } from './business'
import { salesGuide } from './sales'
import { accountingGuide } from './accounting'
import { hrGuide } from './hr'
import { medicalGuide } from './medical'
import { financeGuide } from './finance'
import { researchGuide } from './research'
import { educationGuide } from './education'
import { manufacturingGuide } from './manufacturing'
import { etcGuide } from './etc'

export const CATEGORY_GUIDE: Record<JobCategory, CategoryGuideEntry> = {
  'IT개발·데이터': itDevGuide,
  '디자인': designGuide,
  '마케팅·광고': marketingGuide,
  '경영·기획': businessGuide,
  '영업·판매': salesGuide,
  '회계·세무·재무': accountingGuide,
  '인사·노무': hrGuide,
  '의료·제약': medicalGuide,
  '금융·보험': financeGuide,
  '연구·R&D': researchGuide,
  '교육': educationGuide,
  '생산·제조': manufacturingGuide,
  '기타': etcGuide,
}
