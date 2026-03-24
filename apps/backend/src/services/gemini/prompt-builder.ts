import { JobCategory, ResumeSections, RecommendableSectionType, Improvement, Penalty } from '@resumate/types'
import { CATEGORY_GUIDE } from './category-guides'
import { getCommonScoreGuide, getCategoryPenaltyGuide } from './common-guides'

function hasTextContent(val: unknown): boolean {
  if (!val) return false
  if (Array.isArray(val)) return val.some((item) => String(item).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim().length > 0)
  return String(val).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim().length > 0
}

export function buildPrompt(
  jobCategory: JobCategory,
  resumeText: string,
  sections?: ResumeSections,
): string {
  const guide = CATEGORY_GUIDE[jobCategory]
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const levelFocus = guide.newGradFocus
  const scoreGuide = guide.newGradScoreGuide + getCommonScoreGuide() + getCategoryPenaltyGuide(jobCategory)
  const criteria = guide.criteria.map((c) => `- ${c}`).join('\n')
  const keywords = guide.keywords.join(', ')

  const etcInstruction =
    jobCategory === '기타'
      ? '\n이력서를 먼저 분석해서 직무를 스스로 파악한 후 그에 맞는 기준으로 평가하세요.\n'
      : ''

  const designInstruction =
    jobCategory === '디자인'
      ? `\n[디자인 직군 특이사항]\n- 포트폴리오 이미지는 분석 불가합니다.\n- 이력서 텍스트에서 작업물을 얼마나 잘 서술했는지를 평가하세요.\n- 포트폴리오 링크만 있고 텍스트 설명이 없으면 achievement 감점입니다.\n- 개선사항에 반드시 포함: "포트폴리오의 시각적 완성도는 텍스트로 분석이 어렵습니다. 기획 의도, 문제 해결 과정, 수치 성과를 이력서 본문에 텍스트로 함께 서술하면 더 정확한 평가가 가능합니다."\n`
      : ''

  const sectionBlock = sections
    ? (() => {
        const presentSections = Object.keys(sections).filter(
          (k) => k !== 'coverLetter' && hasTextContent(sections[k as keyof ResumeSections]),
        )
        return presentSections.length > 0
          ? `\n이 이력서에 포함된 섹션: ${presentSections.join(', ')}\n위 섹션 목록에 있는 내용을 "없다"고 지적하지 마세요.\n`
          : ''
      })()
    : ''

  return `당신은 10년 경력의 채용 전문가입니다.${etcInstruction}${designInstruction}
아래 이력서를 '${jobCategory}' 직군 기준으로 분석해주세요.

오늘 날짜: ${today}
경력 수준: 신입

[신입 평가 포인트]
${levelFocus}

[점수 기준표]
${scoreGuide}

[점수 산정 방식 - 가산점 체크리스트]
점수 기준표의 각 항목을 순서대로 판단하고 합산하세요.

규칙:
- Y/N 항목: 이력서에서 실제로 확인되는 경우에만 Y
- "(하나만 선택)" 항목: 가장 잘 해당하는 단계 하나만 선택, 중복 선택 절대 불가
- 합계가 100점을 초과하면 100점으로 캡 처리
- 자기소개서(coverLetter) 내용이 이력서 텍스트에 포함되어 있더라도 분석 및 채점에서 완전히 제외하세요. 이력서의 사실 기반 정보(경력·학력·프로젝트·스킬 등)만으로 평가하세요
- 자기소개서가 포함되어 이력서 분량이 길어 보일 수 있습니다. 이력서 본문의 분량만 기준으로 판단하세요
- 간략소개(summary)는 참고만 하고 점수에 직접 반영 금지
- scoreCalculation에 항목별 점수를 명시한 뒤, 감점 항목은 반드시 음수로 포함한 후 합산하여 "합계" 키에 저장하세요
- scores[key]는 반드시 scoreCalculation[key].합계와 동일해야 합니다 (감점 후 0 미만이면 0으로 캡)
- 감점 항목 해당 시 scoreCalculation에 음수로 반영하고 penalties 배열에 포함하세요
- 감점 후 각 점수가 0점 미만이 되면 0점으로 처리하세요
- 감점 해당 없으면 "penalties": [] 로 반환하세요
${sectionBlock}
[평가 규칙]
- 날짜는 오늘 날짜(${today}) 기준으로 과거/현재/미래를 판단하세요
- 개선사항은 최대 3개 이내로 제시하세요
- 개선사항은 프로젝트·경력·대외활동 등 경험 섹션의 내용 표현 방식에 집중하세요
  (어떻게 썼는지, 무엇이 빠졌는지 — 이미 있는 경험을 더 잘 전달하는 방향)
- 다음은 개선사항으로 제시하지 마세요:
  · GitHub/포트폴리오 링크 없음 (사용자가 스스로 아는 사항)
  · 자격증 없음 (취득하라는 조언은 이력서 개선이 아님)
  · 특정 툴·기술 미명시 (없는 걸 추가하라는 조언은 내용 개선이 아님)
  → 위 항목들은 채점에는 반영되지만 개선사항으로 지적하지 마세요
- 이력서에 실제로 있는 내용을 "없다"고 지적하는 것은 절대 금지입니다
- 어떤 이력서에나 붙일 수 있는 일반론 금지 ("팀 내 갈등 해결 경험이 없습니다" 같은 표현)
  반드시 "XX 프로젝트에서 YY가 없어서 ZZ처럼 추가하면 좋습니다" 형식으로 작성하세요
- issue에는 이력서 원문 해당 부분을 직접 인용하고, suggestion에는 구체적인 수정 예시 문장을 포함하세요
- 이름, 전화번호, 이메일, URL 등 개인정보가 이력서에 포함되어 있어도 strengths, improvements, oneLiner에 인용하거나 언급하지 마세요

분석 기준 (각 0~100점):
${criteria}

핵심 키워드: ${keywords}

반드시 아래 JSON 형식으로만 응답하세요. 마크다운이나 코드블록 없이 JSON만 출력하세요.

{
  "scoreCalculation": {
    "expertise":     { "항목명": 점수, ..., "합계": 합계 },
    "experience":    { "항목명": 점수, ..., "합계": 합계 },
    "achievement":   { "항목명": 점수, ..., "합계": 합계 },
    "communication": { "항목명": 점수, ..., "합계": 합계 },
    "structure":     { "항목명": 점수, ..., "합계": 합계 }
  },
  "scores": {
    "expertise": 숫자,
    "experience": 숫자,
    "achievement": 숫자,
    "communication": 숫자,
    "structure": 숫자
  },
  "strengths": ["강점1", "강점2", "강점3"],
  "improvements": [
    {
      "category": "카테고리명",
      "issue": "이력서 원문 근거와 함께 구체적인 문제점",
      "suggestion": "구체적인 수정 예시 포함한 개선 방안"
    }
  ],
  "penalties": [
    { "category": "achievement", "reason": "감점 사유", "deduction": 15 }
  ],
  "oneLiner": "한 줄 총평"
}

※ scores의 각 값은 반드시 scoreCalculation의 합계와 일치해야 합니다.
※ totalScore는 응답에 포함하지 마세요. 서버에서 5개 점수 평균으로 계산합니다.
※ penalties는 실제로 적용된 감점만 포함하세요. 해당 없으면 반드시 [] 로 반환하세요.

[이력서 내용]
${resumeText}`
}

export function buildExtractPrompt(
  jobCategory: JobCategory,
): string {
  const guide = CATEGORY_GUIDE[jobCategory]
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const levelFocus = guide.newGradFocus
  const scoreGuide = guide.newGradScoreGuide + getCommonScoreGuide() + getCategoryPenaltyGuide(jobCategory)
  const criteriaList = guide.criteria.map((c) => `- ${c}`).join('\n')
  const keywordList = guide.keywords.join(', ')

  const etcInstruction =
    jobCategory === '기타'
      ? '\n이력서를 먼저 분석해서 직무를 스스로 파악한 후 그에 맞는 기준으로 평가하세요.\n'
      : ''

  const designInstruction =
    jobCategory === '디자인'
      ? `\n[디자인 직군 특이사항]\n- 포트폴리오 이미지는 분석 불가합니다.\n- 이력서 텍스트에서 작업물을 얼마나 잘 서술했는지를 평가하세요.\n- 포트폴리오 링크만 있고 텍스트 설명이 없으면 achievement 감점입니다.\n- 개선사항에 반드시 포함: "포트폴리오의 시각적 완성도는 텍스트로 분석이 어렵습니다. 기획 의도, 문제 해결 과정, 수치 성과를 이력서 본문에 텍스트로 함께 서술하면 더 정확한 평가가 가능합니다."\n`
      : ''

  return `당신은 10년 경력의 채용 전문가입니다.${etcInstruction}${designInstruction}
첨부된 PDF 이력서에서 텍스트를 추출하고, '${jobCategory}' 직군 기준으로 분석해주세요.

오늘 날짜: ${today}
경력 수준: 신입

[신입 평가 포인트]
${levelFocus}

[점수 기준표]
${scoreGuide}

[점수 산정 방식 - 가산점 체크리스트]
점수 기준표의 각 항목을 순서대로 판단하고 합산하세요.

규칙:
- Y/N 항목: 이력서에서 실제로 확인되는 경우에만 Y
- "(하나만 선택)" 항목: 가장 잘 해당하는 단계 하나만 선택, 중복 선택 절대 불가
- 합계가 100점을 초과하면 100점으로 캡 처리
- 자기소개서(coverLetter)는 분석 및 채점에서 완전히 제외하세요. 이력서의 사실 기반 정보(경력·학력·프로젝트·스킬 등)만으로 평가하세요
- 자기소개서가 포함되어 이력서 전체 분량이 길어 보일 수 있습니다. 이력서 본문(이력서 섹션)의 분량만 기준으로 판단하고, 자기소개서 분량은 길이 평가에서 제외하세요
- 간략소개(summary)는 참고만 하고 점수에 직접 반영 금지
- PDF에서 추출한 섹션을 직접 확인하고, 실제로 없는 내용만 개선사항으로 지적하세요
- 개선사항은 프로젝트·경력·대외활동 등 경험 섹션의 내용 표현 방식에 집중하세요
  (어떻게 썼는지, 무엇이 빠졌는지 — 이미 있는 경험을 더 잘 전달하는 방향)
- 다음은 개선사항으로 제시하지 마세요:
  · GitHub/포트폴리오 링크 없음 (사용자가 스스로 아는 사항)
  · 자격증 없음 (취득하라는 조언은 이력서 개선이 아님)
  · 특정 툴·기술 미명시 (없는 걸 추가하라는 조언은 내용 개선이 아님)
  → 위 항목들은 채점에는 반영되지만 개선사항으로 지적하지 마세요
- 이력서에 실제로 있는 내용을 "없다"고 지적하는 것은 절대 금지입니다
- 어떤 이력서에나 붙일 수 있는 일반론 금지 ("팀 내 갈등 해결 경험이 없습니다" 같은 표현)
  반드시 "XX 프로젝트에서 YY가 없어서 ZZ처럼 추가하면 좋습니다" 형식으로 작성하세요
- issue에는 이력서 원문 해당 부분을 직접 인용하고, suggestion에는 구체적인 수정 예시 문장을 포함하세요
- scoreCalculation에 항목별 점수를 명시한 뒤, 감점 항목은 반드시 음수로 포함한 후 합산하여 "합계" 키에 저장하세요
- scores[key]는 반드시 scoreCalculation[key].합계와 동일해야 합니다 (감점 후 0 미만이면 0으로 캡)
- 감점 항목 해당 시 scoreCalculation에 음수로 반영하고 penalties 배열에 포함하세요
- 감점 후 각 점수가 0점 미만이 되면 0점으로 처리하세요
- 감점 해당 없으면 "penalties": [] 로 반환하세요

분석 기준 (각 0~100점):
${criteriaList}

핵심 키워드: ${keywordList}

반드시 아래 JSON 형식으로만 응답하세요. 마크다운이나 코드블록 없이 JSON만 출력하세요.

[주의]
이름, 전화번호, 이메일, URL(블로그/깃허브/포트폴리오 링크 포함)은
extractedText에는 포함해도 되지만, sections의 어떤 필드에도 포함하지 마세요.
summary는 자기소개 문장만 작성하고 연락처 블록은 제외하세요.

섹션 분류 기준 (summary vs coverLetter 구분 필수):
- summary: 간략소개, 프로필 요약, About me — 반드시 3~5줄 이내의 짧은 소개 문장만 해당
- coverLetter: 자기소개서 — 성장과정·지원동기·직무역량·입사포부·장단점 등을 포함한 여러 단락(보통 300자 이상)의 서술형 글. 별도 제목(예: "자기소개서", "자소서", "Cover Letter")이 없어도 내용이 서술형 장문이면 coverLetter로 분류하세요
- experience: 경력, Work Experience, 직무경험 (유급 근무 + 인턴 포함)
- education: 학력만 해당 (대학교, 고등학교 등 정규 학교 교육)
- training: 부트캠프 수료, 코딩 교육과정, 온라인 강의 수료, 기업 교육 이수, 어학연수 (예: 코드잇, 패스트캠퍼스, 멋쟁이사자처럼, AWS 교육, Google 교육 등)
- skills: 스킬, 기술스택, 보유기술, Skills, Tech Stack
- projects: 프로젝트, 개인프로젝트, 팀프로젝트, 사이드프로젝트 (배열로)
- certifications: 국가공인 자격증(정보처리기사, 운전면허 등), 어학점수(토익/OPic/JLPT/HSK 등 점수·등급이 명시된 것) — 부트캠프·교육과정 수료는 절대 포함하지 않음
- activities: 대외활동, 교내활동, 봉사활동, 동아리
- awards: 수상, 공모전, 해커톤, 장학금, 수상내역

섹션 규칙:
- 해당 섹션이 없으면 그 키 자체를 JSON에 포함하지 마세요
- 이름, 연락처, 이메일, 전화번호, 주소, URL(블로그/깃허브/포트폴리오)은 어떤 섹션에도 포함하지 마세요
- projects는 반드시 배열로 (프로젝트가 1개면 ["..."])
- education은 정규 학교 교육만, 그 외 모든 교육·수료는 training으로 분류하세요
- 어학점수는 점수·등급이 명시된 것만 certifications, 어학연수(유학, 어학원 등)는 training으로 분류하세요

{
  "extractedText": "PDF에서 추출한 전체 텍스트 (원본 보존용)",
  "sections": {
    "summary": "간략소개 (짧은 경우만)",
    "coverLetter": "자기소개서 전체 내용 (있는 경우만)",
    "experience": "...",
    "projects": ["프로젝트1 전체 내용", "프로젝트2 전체 내용"]
  },
  "scoreCalculation": {
    "expertise":     { "항목명": 점수, ..., "합계": 합계 },
    "experience":    { "항목명": 점수, ..., "합계": 합계 },
    "achievement":   { "항목명": 점수, ..., "합계": 합계 },
    "communication": { "항목명": 점수, ..., "합계": 합계 },
    "structure":     { "항목명": 점수, ..., "합계": 합계 }
  },
  "scores": {
    "expertise": 숫자,
    "experience": 숫자,
    "achievement": 숫자,
    "communication": 숫자,
    "structure": 숫자
  },
  "strengths": ["강점1", "강점2", "강점3"],
  "improvements": [
    {
      "category": "카테고리명",
      "issue": "구체적인 문제점",
      "suggestion": "구체적인 개선 방안 (예시 포함)"
    }
  ],
  "penalties": [
    { "category": "achievement", "reason": "감점 사유", "deduction": 15 }
  ],
  "oneLiner": "한 줄 총평"
}

※ scores의 각 값은 반드시 scoreCalculation의 합계와 일치해야 합니다.
※ totalScore는 응답에 포함하지 마세요. 서버에서 5개 점수 평균으로 계산합니다.
※ penalties는 실제로 적용된 감점만 포함하세요. 해당 없으면 반드시 [] 로 반환하세요.`
}

const SECTION_LABEL_MAP: Record<RecommendableSectionType, string> = {
  summary: '간략소개',
  experience: '경력',
  projects: '프로젝트',
  awards: '수상/공모전',
  education: '학력',
  activities: '대외활동',
}

/** 섹션 타입과 채점 영역 매핑 */
const SECTION_SCORE_MAP: Record<RecommendableSectionType, string[]> = {
  summary: ['communication', 'structure'],
  experience: ['experience', 'communication'],
  projects: ['achievement', 'expertise'],
  awards: ['achievement'],
  education: ['expertise'],
  activities: ['experience'],
}

export interface RecommendContext {
  improvements: Improvement[]
  penalties: Penalty[]
}

export function buildSectionRecommendPrompt(
  sectionType: RecommendableSectionType,
  content: string,
  jobCategory: JobCategory,
  context?: RecommendContext,
): string {
  const sectionLabel = SECTION_LABEL_MAP[sectionType]
  const guide = CATEGORY_GUIDE[jobCategory]

  // 이 섹션과 관련된 채점 영역의 기준표 추출
  const relatedScoreAreas = SECTION_SCORE_MAP[sectionType] ?? []
  const fullScoreGuide = guide.newGradScoreGuide

  const relevantGuide = relatedScoreAreas.length > 0
    ? relatedScoreAreas
        .map((area) => {
          const areaKorean: Record<string, string> = {
            expertise: 'expertise (전문성',
            experience: 'experience (실무경험',
            achievement: 'achievement (성과',
            communication: 'communication (커뮤니케이션',
            structure: 'structure (구조',
          }
          const label = areaKorean[area] ?? area
          // 점수 기준표에서 해당 영역 블록 추출
          const regex = new RegExp(`■\\s*${area}[^■]*`, 's')
          const match = fullScoreGuide.match(regex)
          return match ? match[0].trim() : `■ ${label}): 해당 영역 참고`
        })
        .join('\n\n')
    : ''

  // 현재 분석에서 이 섹션과 관련된 개선사항/감점 추출
  let feedbackBlock = ''
  if (context) {
    const relatedImprovements = context.improvements.filter((imp) =>
      relatedScoreAreas.some((area) =>
        imp.category.toLowerCase().includes(area) ||
        imp.issue.includes(sectionLabel) ||
        imp.suggestion.includes(sectionLabel),
      ),
    )
    const relatedPenalties = context.penalties.filter((p) =>
      relatedScoreAreas.includes(p.category.toLowerCase()),
    )

    if (relatedImprovements.length > 0 || relatedPenalties.length > 0) {
      feedbackBlock = '\n[현재 분석에서 지적된 문제점 — 반드시 이 문제를 해결하세요]\n'
      for (const imp of relatedImprovements) {
        feedbackBlock += `- 문제: ${imp.issue}\n  개선방향: ${imp.suggestion}\n`
      }
      for (const pen of relatedPenalties) {
        feedbackBlock += `- 감점(${pen.category}, -${pen.deduction}점): ${pen.reason}\n`
      }
    }
  }

  const TECH_CATEGORIES: JobCategory[] = ['IT개발·데이터', '연구·R&D']
  const isTechCategory = TECH_CATEGORIES.includes(jobCategory)

  const projectGuide = sectionType === 'projects'
    ? `
[프로젝트 섹션 작성 원칙]
이력서의 프로젝트는 채용 담당자가 빠르게 핵심만 파악할 수 있어야 합니다.
세부 내용은 포트폴리오에서 보여주고, 이력서에는 핵심만 담으세요.

작성 형식:
- 프로젝트명${isTechCategory ? ' / 기술스택 (핵심 기술만, 3~5개)' : ' / 사용 도구 또는 방법론 (핵심만)'}
- 역할: 본인이 담당한 핵심 역할 (1줄)
- 해결한 문제가 여러 개라면 각각 독립적으로 표현하세요 (합치지 마세요)
  각 이슈마다: 문제 → 해결방법 → 결과 구조를 2줄 이내로 압축
${isTechCategory
  ? `  예) 동시 요청 충돌 → Redis 분산 락 적용 → 데이터 정합성 확보
      테스트 부재 → Jest 단위 테스트 도입 → 커버리지 80% 달성`
  : `  예) [업무/기획상 문제] → [해결 방법] → [측정 가능한 결과]`
}

수치 관련 규칙:
- 원본에 있는 수치(%, 건수, 기간 등)는 반드시 유지하고 더 강조하세요
- 수치를 지우거나 약화시키는 것은 절대 금지
- 원본에 없는 수치는 창작하지 마세요

금지 사항:
- "효율 증대", "성과 향상", "품질 개선" 같은 추상적 표현 금지
  → 반드시 원본에 있는 수치나 구체적 행동 결과로 대체
- 단순 기능/작업 나열 금지 ("~를 했습니다" 반복)
- 여러 이슈를 하나로 뭉뚱그려 표현하는 것 금지
`
    : ''

  return `당신은 10년 경력의 채용 전문가입니다.
아래는 '${jobCategory}' 직군 신입 지원자의 이력서 중 '${sectionLabel}' 섹션 내용입니다.

[현재 내용]
${content}
${feedbackBlock}${projectGuide}
[이 섹션과 관련된 채점 기준표]
아래 체크리스트 항목에서 더 높은 점수를 받을 수 있도록 개선하세요.
${relevantGuide}

핵심 키워드: ${guide.keywords.join(', ')}

개선 원칙:
- 기존 사실(경험, 기간, 기술명, 수치 등)은 절대 변경하거나 만들어내지 마세요
- 없는 사실을 만들어내지 마세요 (존재하지 않는 수치, 경험, 기술, URL, 링크 등)
- URL, GitHub 링크, 포트폴리오 링크 등은 원본에 있는 경우에만 유지하고, 없으면 절대 추가하지 마세요
- 원본에 있는 기간(날짜), 팀 구성(몇 인 팀), 역할명은 반드시 그대로 유지하세요 — 삭제 금지
- 채점 기준표의 가산점 항목을 충족할 수 있도록 내용을 보강하세요
- 원본의 수치(%, 건수, ms, 배수 등)는 반드시 유지하거나 더 강조하세요 — 수치 삭제는 절대 금지
- 기존에 있던 키워드, 기술명은 반드시 유지하세요 (삭제 금지)
- 핵심만 간결하게 — 불필요한 수식어, 나열, 장황한 설명은 제거하세요
- 분량보다 밀도가 중요합니다. 짧아도 핵심이 명확하면 됩니다
- "효율 향상", "성능 개선", "품질 강화" 같은 추상적 표현 금지 — 반드시 구체적 수치나 행동 결과로 대체
- 수치가 없을 때는 기여 방식을 간결하게 서술하되, 있는 척 창작하지 마세요

출력 규칙:
- 개선된 텍스트만 출력하세요
- 마크다운, 코드블록, 설명 텍스트, 제목, 인사말 없이 순수 텍스트만 출력하세요
- "개선된 내용:", "아래는 개선된..." 같은 전처리 문구 없이 바로 본문만 출력하세요`
}
