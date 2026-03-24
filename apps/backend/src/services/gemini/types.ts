import { ScoreDetail, Improvement, Penalty, ResumeSections, AnalysisResult } from '@resumate/types'

export type CategoryGuideEntry = {
  criteria: string[]
  keywords: string[]
  newGradFocus: string
  newGradScoreGuide: string
}

export type ScoreCalculationEntry = Record<string, number>

export type RawAnalysis = {
  scoreCalculation: {
    expertise: ScoreCalculationEntry
    experience: ScoreCalculationEntry
    achievement: ScoreCalculationEntry
    communication: ScoreCalculationEntry
    structure: ScoreCalculationEntry
  }
  scores: ScoreDetail
  strengths: string[]
  improvements: Improvement[]
  penalties?: Penalty[]
  oneLiner: string
}

export type RawExtract = RawAnalysis & {
  extractedText: string
  sections: Record<string, unknown>
}

export type ExtractResult = {
  extractedText: string
  sections: ResumeSections
  analysis: AnalysisResult
}
