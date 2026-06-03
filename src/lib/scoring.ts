import type { Prediction, Match } from '@/types'

export function calculatePoints(prediction: Prediction, match: Match): number {
  if (!match.is_finished || match.home_score === undefined || match.away_score === undefined) {
    return 0
  }

  const exactScore =
    prediction.home_score === match.home_score &&
    prediction.away_score === match.away_score

  if (exactScore) return 10

  const predictedResult = Math.sign(prediction.home_score - prediction.away_score)
  const actualResult = Math.sign(match.home_score - match.away_score)

  if (predictedResult === actualResult) return 5

  return 0
}

export function calculatePrizes(totalParticipants: number, pricePerPerson: number) {
  const pool = totalParticipants * pricePerPerson
  return [
    { position: 1, label: 'Ouro', percentage: 70, amount: pool * 0.7 },
    { position: 2, label: 'Prata', percentage: 20, amount: pool * 0.2 },
    { position: 3, label: 'Bronze', percentage: 10, amount: pool * 0.1 },
  ]
}
