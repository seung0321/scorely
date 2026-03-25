import { GoogleGenAI } from '@google/genai'
import { JobCategory, AnalysisResult, ResumeSections, RecommendableSectionType } from '@scorely/types'
import { env } from '../../config/env'
import { AppError } from '../../middlewares/errorHandler'
import { ExtractResult } from './types'
import { buildPrompt, buildExtractPrompt, buildSectionRecommendPrompt, RecommendContext } from './prompt-builder'
import { parseAndValidate, parseExtractResponse } from './response-parser'

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })
const MODEL = 'gemini-2.5-flash'

const RETRY_HINT = '\n\n이전 응답이 JSON 파싱에 실패했습니다. 반드시 순수 JSON만 반환하세요. 마크다운, 코드블록, 설명 텍스트 없이 JSON만 출력하세요.'

export async function analyzeResume(
  resumeText: string,
  jobCategory: JobCategory,
  sections?: ResumeSections,
): Promise<AnalysisResult> {
  const prompt = buildPrompt(jobCategory, resumeText, sections)

  try {
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { temperature: 0 },
    })
    const raw = result.text ?? ''

    try {
      return parseAndValidate(raw)
    } catch {
      const retryResult = await ai.models.generateContent({
        model: MODEL,
        contents: prompt + RETRY_HINT,
        config: { temperature: 0 },
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

export async function recommendSection(
  sectionType: RecommendableSectionType,
  content: string,
  jobCategory: JobCategory,
  context?: RecommendContext,
): Promise<string> {
  const prompt = buildSectionRecommendPrompt(sectionType, content, jobCategory, context)

  try {
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { temperature: 0 },
    })
    const text = result.text?.trim() ?? ''

    if (!text) {
      const retryResult = await ai.models.generateContent({
        model: MODEL,
        contents: prompt + RETRY_HINT,
        config: { temperature: 0 },
      })
      const retryText = retryResult.text?.trim() ?? ''
      if (!retryText) {
        throw new AppError(500, 'AI 추천 텍스트 생성에 실패했습니다', 'AI_ERROR')
      }
      return retryText
    }

    return text
  } catch (err) {
    if (err instanceof AppError) throw err
    throw new AppError(500, 'AI 섹션 추천 중 오류가 발생했습니다', 'AI_ERROR')
  }
}

export async function extractTextAndAnalyze(
  pdfBuffer: Buffer,
  jobCategory: JobCategory,
): Promise<ExtractResult> {
  const prompt = buildExtractPrompt(jobCategory)
  const pdfBase64 = pdfBuffer.toString('base64')

  const attemptExtract = async (hint = ''): Promise<ExtractResult> => {
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: pdfBase64,
          },
        },
        { text: prompt + hint },
      ],
      config: { temperature: 0 },
    })
    const raw = result.text ?? ''
    return parseExtractResponse(raw)
  }

  try {
    try {
      return await attemptExtract()
    } catch (firstErr) {
      console.error('[Gemini 1차 시도 실패]', firstErr)
      return await attemptExtract(RETRY_HINT)
    }
  } catch (err) {
    console.error('[Gemini PDF 분석 최종 실패]', err)
    if (err instanceof AppError) throw err
    throw new AppError(500, 'PDF 분석 중 오류가 발생했습니다', 'AI_ERROR')
  }
}
