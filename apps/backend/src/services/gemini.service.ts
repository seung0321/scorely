import { GoogleGenerativeAI } from '@google/generative-ai'
import { JobCategory, AnalysisResult, Improvement, ScoreDetail } from '@resumate/types'
import { env } from '../config/env'
import { AppError } from '../middlewares/errorHandler'

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

type JobCriteriaEntry = {
  criteria: string[]
  keywords: string[]
}

const JOB_CRITERIA: Record<JobCategory, JobCriteriaEntry> = {
  '백엔드 개발자': {
    criteria: ['기술 스택 적합도', '프로젝트 경험', '성과 수치화', '협업/커뮤니케이션', '이력서 구성/가독성'],
    keywords: ['Node.js', 'API 설계', 'DB', '서버', '배포', '트랜잭션', '성능 최적화', 'CI/CD'],
  },
  '프론트엔드 개발자': {
    criteria: ['기술 스택 적합도', 'UI/UX 구현 경험', '성과 수치화', '협업/커뮤니케이션', '이력서 구성/가독성'],
    keywords: ['React', 'Vue', 'CSS', '웹 성능', '반응형', '접근성', '상태관리'],
  },
  '기획자': {
    criteria: ['기획/서비스 경험', '데이터 분석 역량', '커뮤니케이션', '프로젝트 관리', '이력서 구성/가독성'],
    keywords: ['PRD', '유저리서치', 'KPI', '와이어프레임', 'A/B테스트', '로드맵'],
  },
  '마케터': {
    criteria: ['캠페인 경험', '데이터 분석 역량', '성과 수치화', '채널 운영 경험', '이력서 구성/가독성'],
    keywords: ['ROAS', 'CPA', 'SNS', '콘텐츠', '퍼포먼스 마케팅', '그로스 해킹'],
  },
  '디자이너': {
    criteria: ['포트폴리오 경험', '툴 숙련도', 'UX 이해도', '협업/커뮤니케이션', '이력서 구성/가독성'],
    keywords: ['Figma', '사용자경험', '브랜딩', '프로토타입', '디자인 시스템'],
  },
  '데이터 분석가': {
    criteria: ['분석 프로젝트 경험', '기술 스택 적합도', '성과 수치화', '시각화 역량', '이력서 구성/가독성'],
    keywords: ['Python', 'SQL', '태블로', '통계', '머신러닝', '대시보드'],
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
  const { criteria, keywords } = JOB_CRITERIA[jobCategory]
  const criteriaList = criteria.map((c) => `- ${c}`).join('\n')
  const keywordList = keywords.join(', ')

  return `당신은 10년 경력의 채용 전문가입니다.
아래 이력서 텍스트를 '${jobCategory}' 직군 기준으로 분석해주세요.

분석 기준 (각 0~100점):
${criteriaList}

핵심 키워드: ${keywordList}

반드시 아래 JSON 형식으로만 응답하세요. 마크다운이나 코드블록 없이 JSON만 출력하세요.

{
  "scores": {
    "tech": 숫자,
    "project": 숫자,
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
    scores.tech,
    scores.project,
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
    const result = await model.generateContent(prompt)
    const raw = result.response.text()

    try {
      return parseAndValidate(raw)
    } catch {
      // 1회 재시도
      const retryResult = await model.generateContent(prompt)
      const retryRaw = retryResult.response.text()
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
  analysis: AnalysisResult
}

export async function extractTextAndAnalyze(
  pdfBuffer: Buffer,
  jobCategory: JobCategory,
): Promise<ExtractResult> {
  const { criteria, keywords } = JOB_CRITERIA[jobCategory]
  const criteriaList = criteria.map((c) => `- ${c}`).join('\n')
  const keywordList = keywords.join(', ')

  const prompt = `당신은 10년 경력의 채용 전문가입니다.
첨부된 PDF 이력서에서 텍스트를 추출하고, '${jobCategory}' 직군 기준으로 분석해주세요.

분석 기준 (각 0~100점):
${criteriaList}

핵심 키워드: ${keywordList}

반드시 아래 JSON 형식으로만 응답하세요. 마크다운이나 코드블록 없이 JSON만 출력하세요.

{
  "extractedText": "PDF에서 추출한 전체 텍스트",
  "scores": {
    "tech": 숫자,
    "project": 숫자,
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
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: pdfBase64,
        },
      },
    ])
    const raw = result.response.text()
    const cleaned = raw
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim()

    type RawExtract = RawAnalysis & { extractedText: string }
    const parsed: RawExtract = JSON.parse(cleaned) as RawExtract

    const scores = parsed.scores
    const allScores = [
      scores.tech,
      scores.project,
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
    } catch {
      return await attemptExtract()
    }
  } catch (err) {
    if (err instanceof AppError) throw err
    throw new AppError(500, 'PDF 분석 중 오류가 발생했습니다', 'AI_ERROR')
  }
}
