import { GoogleGenAI } from '@google/genai'
import { JobCategory, AnalysisResult, Improvement, ScoreDetail, ResumeSections } from '@resumate/types'
import { env } from '../config/env'
import { AppError } from '../middlewares/errorHandler'

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })
const MODEL = 'gemini-2.5-flash'

type CategoryGuideEntry = {
  criteria: string[]
  keywords: string[]
}

const CATEGORY_GUIDE: Record<JobCategory, CategoryGuideEntry> = {
  'IT개발·데이터': {
    criteria: ['기술 스택 적합도', '프로젝트·실무 경험', '성과 수치화', '협업/커뮤니케이션', '이력서 구성/가독성'],
    keywords: ['GitHub', 'API 설계', '클라우드(AWS/GCP/Azure)', 'CI/CD', '데이터베이스', '알고리즘', '성능 최적화', 'Python', 'Java', 'SQL'],
  },
  '디자인': {
    criteria: ['툴 숙련도 및 디자인 역량', '포트폴리오·실무 경험', '성과 수치화(전환율·사용성 개선)', '협업/커뮤니케이션', '이력서·포트폴리오 구성'],
    keywords: ['Figma', 'Adobe XD', 'Illustrator', 'Photoshop', 'UX 리서치', '디자인 시스템', '브랜딩', '프로토타입'],
  },
  '마케팅·광고': {
    criteria: ['마케팅 채널 전문성', '캠페인·광고 집행 경험', '성과 수치화(ROAS·CPA·전환율)', '협업/커뮤니케이션', '이력서 구성/가독성'],
    keywords: ['ROAS', 'CPA', 'CTR', 'SEO', 'SEM', '퍼포먼스 마케팅', 'SNS 운영', 'Google Analytics', '그로스 해킹'],
  },
  '경영·기획': {
    criteria: ['전략·기획 전문성', '프로젝트·사업 관리 경험', '성과 수치화(매출·효율 개선)', '이해관계자 커뮤니케이션', '이력서 구성/가독성'],
    keywords: ['사업계획서', 'KPI', 'OKR', '로드맵', '시장 조사', 'PMO', '예산 관리', '프로세스 개선'],
  },
  '영업·판매': {
    criteria: ['영업 도메인 전문성', '영업·거래처 관리 경험', '매출·달성률 수치화', '고객·파트너 커뮤니케이션', '이력서 구성/가독성'],
    keywords: ['매출 목표 달성', '신규 고객 개척', 'B2B', 'B2C', 'CRM', '거래처 관리', '협상', '계약 체결'],
  },
  '회계·세무·재무': {
    criteria: ['회계·세무 전문 지식', '재무 실무 경험', '성과 수치화(비용 절감·재무 개선)', '유관부서 커뮤니케이션', '이력서 구성/가독성'],
    keywords: ['재무제표', '세무신고', '원가 분석', 'ERP', 'IFRS', '결산', '예산 편성', '공인회계사(CPA)', '세무사'],
  },
  '인사·노무': {
    criteria: ['인사·노무 전문 지식', 'HR 실무 경험', '성과 수치화(채용 효율·이직률)', '구성원·경영진 커뮤니케이션', '이력서 구성/가독성'],
    keywords: ['채용', '온보딩', '노무관리', '급여 처리', '성과평가', '조직문화', '근로기준법', 'HR 시스템'],
  },
  '의료·제약': {
    criteria: ['의료·제약 전문 지식 및 자격', '임상·현장 실무 경험', '성과 수치화(환자 지표·임상 결과)', '다직종 협업/커뮤니케이션', '이력서 구성/가독성'],
    keywords: ['임상 경험', 'GMP', '의약품 허가', '전자의무기록(EMR)', '의료기기', '임상시험(CRA/CRC)', '간호사', '의사면허'],
  },
  '금융·보험': {
    criteria: ['금융·보험 전문 지식 및 자격', '금융 상품·리스크 관리 경험', '성과 수치화(운용 수익·손해율)', '고객·내부 커뮤니케이션', '이력서 구성/가독성'],
    keywords: ['자산운용', '리스크 관리', '여신 심사', '보험 언더라이팅', 'CFA', 'FRM', '파생상품', 'AML'],
  },
  '연구·R&D': {
    criteria: ['연구 분야 전문성 및 논문·특허', '연구 프로젝트·실험 경험', '성과 수치화(논문 피인용·특허 등록)', '연구팀 협업/커뮤니케이션', '이력서 구성/가독성'],
    keywords: ['논문', '특허', 'R&D 과제', '실험 설계', '데이터 분석', '연구비 수주', '학술 발표', '기술이전'],
  },
  '교육': {
    criteria: ['교과 전문성 및 교원 자격', '교육 현장·강의 경험', '성과 수치화(합격률·수강생 만족도)', '학습자·학부모 커뮤니케이션', '이력서 구성/가독성'],
    keywords: ['정교사 자격증', '커리큘럼 개발', 'LMS', '성적 향상', '수업 설계', '에듀테크', '교재 개발'],
  },
  '생산·제조': {
    criteria: ['생산·공정 전문 기술', '제조 현장 실무 경험', '성과 수치화(불량률·생산성 개선)', '현장·유관부서 커뮤니케이션', '이력서 구성/가독성'],
    keywords: ['생산 계획', '품질 관리(QC/QA)', 'ISO', '설비 보전', '6시그마', '린 제조', 'SCM', '안전관리'],
  },
  '기타': {
    criteria: ['직무 관련 전문 역량', '관련 실무 경험', '성과 수치화', '조직 내 커뮤니케이션', '이력서 구성/가독성'],
    keywords: ['자격증', '직무 교육', '프로젝트 참여', '팀워크', '문제 해결', '목표 달성', '외국어'],
  },
}

type RawAnalysis = {
  scores: ScoreDetail
  totalScore: number
  strengths: string[]
  improvements: Improvement[]
  oneLiner: string
}

function buildPrompt(jobCategory: JobCategory, resumeText: string): string {
  const { criteria, keywords } = CATEGORY_GUIDE[jobCategory]
  const criteriaList = criteria.map((c) => `- ${c}`).join('\n')
  const keywordList = keywords.join(', ')

  const etcInstruction =
    jobCategory === '기타'
      ? '\n이력서를 먼저 분석해서 직무를 스스로 파악한 후 그에 맞는 기준으로 평가하세요.\n'
      : ''

  return `당신은 10년 경력의 채용 전문가입니다.${etcInstruction}
아래 이력서 텍스트를 '${jobCategory}' 직군 기준으로 분석해주세요.

분석 기준 (각 0~100점):
${criteriaList}

핵심 키워드: ${keywordList}

반드시 아래 JSON 형식으로만 응답하세요. 마크다운이나 코드블록 없이 JSON만 출력하세요.

{
  "scores": {
    "expertise": 숫자,
    "experience": 숫자,
    "achievement": 숫자,
    "communication": 숫자,
    "structure": 숫자
  },
  "totalScore": 숫자,
  "strengths": ["강점1", "강점2", "강점3"],
  "improvements": [
    {
      "category": "카테고리명",
      "issue": "구체적인 문제점",
      "suggestion": "구체적인 개선 방안 (예시 포함)"
    }
  ],
  "oneLiner": "한 줄 총평"
}

[이력서 내용]
${resumeText}`
}

function parseAndValidate(raw: string): AnalysisResult {
  const cleaned = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()

  const parsed: RawAnalysis = JSON.parse(cleaned) as RawAnalysis

  const scores = parsed.scores
  const allScores = [
    scores.expertise,
    scores.experience,
    scores.achievement,
    scores.communication,
    scores.structure,
  ]

  for (const score of allScores) {
    if (typeof score !== 'number' || score < 0 || score > 100) {
      throw new Error('점수 범위 오류')
    }
  }

  const totalScore = Math.round(
    allScores.reduce((sum, s) => sum + s, 0) / allScores.length,
  )

  return {
    scores,
    totalScore,
    strengths: parsed.strengths,
    improvements: parsed.improvements,
    oneLiner: parsed.oneLiner,
  }
}

export async function analyzeResume(
  resumeText: string,
  jobCategory: JobCategory,
): Promise<AnalysisResult> {
  const prompt = buildPrompt(jobCategory, resumeText)

  try {
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    })
    const raw = result.text ?? ''

    try {
      return parseAndValidate(raw)
    } catch {
      // 1회 재시도
      const retryResult = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
      })
      const retryRaw = retryResult.text ?? ''
      try {
        return parseAndValidate(retryRaw)
      } catch {
        throw new AppError(500, 'AI 응답 파싱에 실패했습니다', 'AI_ERROR')
      }
    }
  } catch (err) {
    if (err instanceof AppError) throw err
    throw new AppError(500, 'AI 분석 중 오류가 발생했습니다', 'AI_ERROR')
  }
}

type ExtractResult = {
  extractedText: string
  sections: ResumeSections
  analysis: AnalysisResult
}

export async function extractTextAndAnalyze(
  pdfBuffer: Buffer,
  jobCategory: JobCategory,
): Promise<ExtractResult> {
  const { criteria, keywords } = CATEGORY_GUIDE[jobCategory]
  const criteriaList = criteria.map((c) => `- ${c}`).join('\n')
  const keywordList = keywords.join(', ')

  const etcInstruction =
    jobCategory === '기타'
      ? '\n이력서를 먼저 분석해서 직무를 스스로 파악한 후 그에 맞는 기준으로 평가하세요.\n'
      : ''

  const prompt = `당신은 10년 경력의 채용 전문가입니다.${etcInstruction}
첨부된 PDF 이력서에서 텍스트를 추출하고, '${jobCategory}' 직군 기준으로 분석해주세요.

분석 기준 (각 0~100점):
${criteriaList}

핵심 키워드: ${keywordList}

반드시 아래 JSON 형식으로만 응답하세요. 마크다운이나 코드블록 없이 JSON만 출력하세요.

섹션 분류 기준:
- summary: 자기소개, 간략소개, 소개, About me, 프로필
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
    "summary": "...",
    "experience": "...",
    "projects": ["프로젝트1 전체 내용", "프로젝트2 전체 내용"]
  },
  "scores": {
    "expertise": 숫자,
    "experience": 숫자,
    "achievement": 숫자,
    "communication": 숫자,
    "structure": 숫자
  },
  "totalScore": 숫자,
  "strengths": ["강점1", "강점2", "강점3"],
  "improvements": [
    {
      "category": "카테고리명",
      "issue": "구체적인 문제점",
      "suggestion": "구체적인 개선 방안 (예시 포함)"
    }
  ],
  "oneLiner": "한 줄 총평"
}`

  const pdfBase64 = pdfBuffer.toString('base64')

  const attemptExtract = async (): Promise<ExtractResult> => {
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: pdfBase64,
          },
        },
        { text: prompt },
      ],
    })
    const raw = result.text ?? ''
    const cleaned = raw
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim()

    type RawExtract = RawAnalysis & { extractedText: string; sections: ResumeSections }
    const parsed: RawExtract = JSON.parse(cleaned) as RawExtract

    console.log('[Gemini sections 원시값]', JSON.stringify(parsed.sections))
    console.log('[Gemini sections 키 목록]', parsed.sections ? Object.keys(parsed.sections) : 'sections 없음')

    const scores = parsed.scores
    const allScores = [
      scores.expertise,
      scores.experience,
      scores.achievement,
      scores.communication,
      scores.structure,
    ]

    for (const score of allScores) {
      if (typeof score !== 'number' || score < 0 || score > 100) {
        throw new Error('점수 범위 오류')
      }
    }

    const totalScore = Math.round(
      allScores.reduce((sum, s) => sum + s, 0) / allScores.length,
    )

    return {
      extractedText: parsed.extractedText,
      sections: parsed.sections ?? {},
      analysis: {
        scores,
        totalScore,
        strengths: parsed.strengths,
        improvements: parsed.improvements,
        oneLiner: parsed.oneLiner,
      },
    }
  }

  try {
    try {
      return await attemptExtract()
    } catch (firstErr) {
      console.error('[Gemini 1차 시도 실패]', firstErr)
      return await attemptExtract()
    }
  } catch (err) {
    console.error('[Gemini PDF 분석 최종 실패]', err)
    if (err instanceof AppError) throw err
    throw new AppError(500, 'PDF 분석 중 오류가 발생했습니다', 'AI_ERROR')
  }
}
