export type PaymentStatus = 'pendente' | 'pago' | 'isento'

export type BolaoScope = 'todos' | 'fase_grupos' | 'mata_mata' | 'times_especificos' | 'jogos_especificos' | 'artilheiro'

export interface Participant {
  id: string
  user_id: string
  name: string
  email: string
  phone?: string
  avatar_url?: string
  payment_status: PaymentStatus
  is_admin: boolean
  active_bolao_id?: string
  created_at: string
}

export interface Match {
  id: string
  home_team: string
  away_team: string
  home_iso: string
  away_iso: string
  match_date: string
  stage: string
  group_name?: string
  city?: string
  stadium?: string
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
  points?: number
  created_at: string
  match?: Match
  participant?: Participant
}

export interface RankingEntry {
  user_id: string
  name: string
  payment_status: PaymentStatus
  total_points: number
  exact_scores: number
  correct_results: number
  last_prediction_at: string
}

export interface Bolao {
  id: string
  name: string
  code: string
  owner_id: string
  scope: BolaoScope
  scope_config: Record<string, unknown>
  entry_fee: number
  prize_config: { distribution: number[] }
  is_active: boolean
  created_at: string
  member_count?: number
}

export interface BolaoMember {
  id: string
  bolao_id: string
  user_id: string
  payment_status: PaymentStatus
  joined_at: string
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

export function filterMatchesByScope(matches: Match[], scope: BolaoScope, scopeConfig: Record<string, unknown>): Match[] {
  switch (scope) {
    case 'todos':
      return matches
    case 'fase_grupos':
      return matches.filter(m => m.stage === 'Fase de Grupos')
    case 'mata_mata':
      return matches.filter(m => m.stage !== 'Fase de Grupos')
    case 'times_especificos': {
      const teams = (scopeConfig.teams as string[]) ?? []
      return matches.filter(m => teams.includes(m.home_team) || teams.includes(m.away_team))
    }
    case 'jogos_especificos': {
      const ids = (scopeConfig.match_ids as string[]) ?? []
      return matches.filter(m => ids.includes(m.id))
    }
    case 'artilheiro':
      return []
    default:
      return matches
  }
}
