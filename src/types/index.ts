export type PaymentStatus = 'pendente' | 'pago' | 'isento'

export interface Participant {
  id: string
  name: string
  email: string
  avatar_url?: string
  payment_status: PaymentStatus
  created_at: string
  is_admin: boolean
}

export interface Match {
  id: string
  home_team: string
  away_team: string
  home_flag: string
  away_flag: string
  match_date: string
  stage: string
  home_score?: number
  away_score?: number
  is_finished: boolean
}

export interface Prediction {
  id: string
  user_id: string
  match_id: string
  home_score: number
  away_score: number
  created_at: string
  points?: number
  match?: Match
  participant?: Participant
}

export interface RankingEntry {
  position: number
  participant: Participant
  total_points: number
  exact_scores: number
  correct_results: number
  last_prediction_at: string
}

export interface League {
  id: string
  name: string
  code: string
  owner_id: string
  created_at: string
  member_count?: number
}

export interface Prize {
  position: number
  label: string
  percentage: number
  amount: number
}
