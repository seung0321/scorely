import { analysisRepository } from '../repositories/analysis.repository'

export const analysisService = {
  async getScoreHistory(userId: string) {
    return analysisRepository.findScoreHistoryByUserId(userId)
  },
}
