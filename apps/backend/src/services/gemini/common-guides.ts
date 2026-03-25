import { JobCategory } from '@resumate/types'

export const CATEGORY_PENALTY: Partial<Record<JobCategory, string>> = {
  'IT개발·데이터': `[IT개발·데이터 전용]
□ 직군 관련 기술스택이 이력서에 전혀 없음:           expertise에서 -15
□ 모든 프로젝트에 문제→해결→결과 서술이 전혀 없음:   achievement에서 -15
□ 미완성·TODO로 명시된 프로젝트만 있음:             achievement에서 -10`,

  '디자인': `[디자인 전용]
□ 모든 작업물 설명에 과정(리서치→설계→결과)이 전혀 없음: achievement에서 -15
□ 작업물이 단순 모방/따라하기로 명시됨:                  achievement에서 -10
□ 디자인 툴(Figma, XD, Illustrator 등)이 전혀 미명시:   expertise에서 -15`,

  '마케팅·광고': `[마케팅·광고 전용]
□ 캠페인 성과 수치(ROAS/CPA/CTR 등)가 이력서 전체에 전혀 없음: achievement에서 -15
□ 운영한 채널·플랫폼이 전혀 미명시:                              expertise에서 -10`,

  '경영·기획': `[경영·기획 전용]
□ 기획 산출물(기획서·제안서·로드맵 등) 언급이 전혀 없음: achievement에서 -10
□ 의사결정 근거·배경 서술이 전혀 없음:                    experience에서 -10`,

  '영업·판매': `[영업·판매 전용]
□ 영업 실적 수치(매출·달성률·계약 건수 등)가 전혀 없음: achievement에서 -15
□ 담당 제품·서비스·고객층이 전혀 미언급:                 experience에서 -5`,

  '회계·세무·재무': `[회계·세무·재무 전용]
□ 사용한 회계·ERP 시스템이 전혀 미명시:            expertise에서 -10
□ 처리 규모(금액·건수 등) 수치가 전혀 없음:        achievement에서 -10`,
}

export function getCategoryPenaltyGuide(jobCategory: JobCategory): string {
  const specific = CATEGORY_PENALTY[jobCategory] ?? ''
  return `
■ 감점 항목 (해당 카테고리 점수에서 차감, 0점 미만 불가)
[공통]
□ 경험의 70% 이상이 지원 직군과 무관:   experience에서 -20
${specific}`
}

export function getCommonScoreGuide(): string {
  return `
■ communication (협업/커뮤니케이션, 최대 100점)
[공통]
□ 팀 프로젝트/협업 경험 명시:          Y → +25 / N → +0
□ 협업 방식 서술 수준 (하나만 선택):
   단순 "팀원으로 참여": +0
   역할/기여 명확히 서술: +20
   갈등 해결 또는 주도적 역할 서술: +35
□ 비직군 구성원과의 소통 경험:          Y → +15 / N → +0
  (개발자↔기획자, 디자이너↔개발자 등)
□ 커뮤니케이션 도구/방식 언급:          Y → +10 / N → +0
  (Slack, Notion, 회의, 코드리뷰 등)
[신입 전용]
□ 팀 프로젝트에서 의견 조율 경험 서술:  Y → +15 / N → +0
최대(신입): 25+35+15+10+15 = 100점

■ structure (이력서 구성/가독성, 최대 100점)
[공통 - 신입/경력 모두 동일]
□ 섹션 구분이 명확한가:               Y → +20 / N → +0
  (경력, 프로젝트, 기술스택 등 구분)
□ 날짜/기간 명시:                     Y → +20 / N → +0
□ 각 항목에 역할/기여도 명시:          Y → +20 / N → +0
□ 문장이 간결하고 핵심 중심:           Y → +20 / N → +0
□ 전체 분량 적절 (1~2페이지 수준):     Y → +20 / N → +0
최대: 100점`
}
