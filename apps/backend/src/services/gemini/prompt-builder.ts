import { JobCategory, ExperienceLevel, ResumeSections } from '@resumate/types'
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
  experienceLevel: ExperienceLevel,
  sections?: ResumeSections,
): string {
  const guide = CATEGORY_GUIDE[jobCategory]
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const levelFocus = experienceLevel === '신입' ? guide.newGradFocus : guide.experiencedFocus
  const categoryScoreGuide = experienceLevel === '신입' ? guide.newGradScoreGuide : guide.experiencedScoreGuide
  const scoreGuide = categoryScoreGuide + getCommonScoreGuide(experienceLevel) + getCategoryPenaltyGuide(jobCategory)
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
경력 수준: ${experienceLevel}

[${experienceLevel} 평가 포인트]
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
- 개선사항은 이력서에서 실제로 확인된 문제만 지적하세요
- 개선사항에는 반드시 이력서 원문을 근거로 인용하고 구체적 수정 예시를 포함하세요
- "~하면 좋습니다" 같은 일반론 금지, 실제로 없는 내용만 지적하세요
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
  experienceLevel: ExperienceLevel,
): string {
  const guide = CATEGORY_GUIDE[jobCategory]
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const levelFocus = experienceLevel === '신입' ? guide.newGradFocus : guide.experiencedFocus
  const categoryScoreGuide = experienceLevel === '신입' ? guide.newGradScoreGuide : guide.experiencedScoreGuide
  const scoreGuide = categoryScoreGuide + getCommonScoreGuide(experienceLevel) + getCategoryPenaltyGuide(jobCategory)
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
경력 수준: ${experienceLevel}

[${experienceLevel} 평가 포인트]
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
