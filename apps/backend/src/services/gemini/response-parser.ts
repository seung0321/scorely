import { AnalysisResult, ScoreDetail, ResumeSections } from '@resumate/types'
import { RawAnalysis, RawExtract, ExtractResult } from './types'

export function calcTotalScore(scores: ScoreDetail): number {
  const values = [scores.expertise, scores.experience, scores.achievement, scores.communication, scores.structure]
  return Math.round(values.reduce((sum, s) => sum + s, 0) / values.length)
}

export function parseAndValidate(raw: string): AnalysisResult {
  const cleaned = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()

  const parsed: RawAnalysis = JSON.parse(cleaned) as RawAnalysis

  const scores = parsed.scores
  const scoreKeys: (keyof ScoreDetail)[] = ['expertise', 'experience', 'achievement', 'communication', 'structure']

  for (const key of scoreKeys) {
    const score = scores[key]
    if (typeof score !== 'number' || score < 0 || score > 100) {
      throw new Error('점수 범위 오류')
    }
    const calcEntry = parsed.scoreCalculation?.[key]
    if (calcEntry) {
      const calcTotal = typeof calcEntry['합계'] === 'number'
        ? calcEntry['합계']
        : Object.entries(calcEntry).filter(([k]) => k !== '합계').reduce((sum, [, v]) => sum + (typeof v === 'number' ? v : 0), 0)
      if (Math.abs(calcTotal - score) > 2) {
        console.warn(`[점수 불일치 교정] ${key}: calculation=${calcTotal}, score=${score} → ${Math.max(0, Math.min(100, calcTotal))}으로 교정`)
        scores[key] = Math.max(0, Math.min(100, calcTotal))
      }
    }
  }

  const penalties = Array.isArray(parsed.penalties) ? parsed.penalties : []
  const improvements = Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 3) : []

  return {
    scores,
    totalScore: calcTotalScore(scores),
    strengths: parsed.strengths,
    improvements,
    penalties,
    oneLiner: parsed.oneLiner,
  }
}

export function parseExtractResponse(raw: string): ExtractResult {
  const cleaned = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()

  const parsed: RawExtract = JSON.parse(cleaned) as RawExtract

  const STRING_SECTION_KEYS: (keyof ResumeSections)[] = [
    'summary', 'coverLetter', 'experience', 'education', 'training', 'skills', 'certifications', 'activities', 'awards',
  ]
  const rawSections = parsed.sections ?? {}
  for (const key of STRING_SECTION_KEYS) {
    if (Array.isArray(rawSections[key])) {
      rawSections[key] = (rawSections[key] as string[]).join('\n\n')
    }
  }
  if (Array.isArray(rawSections['projects'])) {
    rawSections['projects'] = (rawSections['projects'] as unknown[]).map((p) =>
      typeof p === 'string' ? p : JSON.stringify(p),
    )
  } else if (typeof rawSections['projects'] === 'string') {
    rawSections['projects'] = [rawSections['projects'] as string]
  }
  const sections = rawSections as ResumeSections

  const scores = parsed.scores
  const scoreKeys: (keyof ScoreDetail)[] = ['expertise', 'experience', 'achievement', 'communication', 'structure']

  for (const key of scoreKeys) {
    const score = scores[key]
    if (typeof score !== 'number' || score < 0 || score > 100) {
      throw new Error('점수 범위 오류')
    }
    const calcEntry = parsed.scoreCalculation?.[key]
    if (calcEntry) {
      const calcTotal = typeof calcEntry['합계'] === 'number'
        ? calcEntry['합계']
        : Object.entries(calcEntry).filter(([k]) => k !== '합계').reduce((sum, [, v]) => sum + (typeof v === 'number' ? v : 0), 0)
      if (Math.abs(calcTotal - score) > 2) {
        console.warn(`[점수 불일치] ${key}: calculation=${calcTotal}, score=${score}`)
      }
    }
  }

  return {
    extractedText: parsed.extractedText,
    sections,
    analysis: {
      scores,
      totalScore: calcTotalScore(scores),
      strengths: parsed.strengths,
      improvements: parsed.improvements,
      penalties: Array.isArray(parsed.penalties) ? parsed.penalties : [],
      oneLiner: parsed.oneLiner,
    },
  }
}
