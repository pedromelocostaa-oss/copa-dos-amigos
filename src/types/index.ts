export type PaymentStatus = 'pendente' | 'pago' | 'isento'

// BolaoScope removido (P2.2): escopo estava implementado só no frontend mas sem
// suporte na view league_ranking — mantendo simples até migração boloes completa
// export type BolaoScope = ...

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
  scope: string  // manter como string (BolaoScope removido - P2.2)
  scope_config: Record<string, unknown>
  has_artilheiro: boolean
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
  entry_fee: number
  enabled_modes: EnabledModes
  created_at: string
  member_count?: number
}

// W3.1 — Modos pagos
export type BetMode = 'campeao' | 'artilheiro' | 'classificados'

export interface EnabledModes {
  campeao?: boolean
  artilheiro?: boolean
  classificados?: boolean
}

export interface ExtraPrediction {
  id: string
  league_id: string
  user_id: string
  mode: BetMode
  /** campeao: {team: string, iso: string}
   *  artilheiro: {player: string, team: string}
   *  classificados: {A: [string, string], B: [...], ...} */
  selection: Record<string, unknown>
  points: number | null
  created_at: string
  updated_at: string
}

export interface ModePurchase {
  id: string
  league_id: string
  mode: BetMode | 'bundle'
  amount: number
  provider: string
  provider_payment_id?: string
  status: 'pending' | 'approved' | 'failed'
  created_at: string
}

// Constantes de pontuação dos modos (configuráveis)
export const MODE_POINTS = {
  campeao: 50,
  artilheiro: 30,
  classificados_per_team: 10, // por seleção correta que se classificou
} as const

// Preços em centavos
export const MODE_PRICES = {
  campeao: 990,
  artilheiro: 990,
  classificados: 990,
  bundle: 1990,
} as const

export const MODE_LABELS: Record<BetMode, { title: string; description: string; icon: string }> = {
  campeao:       { title: 'Campeão da Copa',       description: 'Quem leva a taça?',                icon: '🏆' },
  artilheiro:    { title: 'Artilheiro',             description: 'Quem vai ser o artilheiro?',       icon: '⚽' },
  classificados: { title: 'Seleções Classificadas', description: 'Quem avança em cada grupo?',       icon: '🎯' },
}

export interface Prize {
  position: number
  label: string
  percentage: number
  amount: number
}

// P2.2: função mantida por compatibilidade mas scope sempre 'todos' até migração boloes
export function filterMatchesByScope(matches: Match[], scope: string, scopeConfig: Record<string, unknown>): Match[] {
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
    default:
      return matches
  }
}
