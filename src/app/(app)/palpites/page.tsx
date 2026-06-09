import { createClient } from '@/lib/supabase/server'
import PalpitesClient from './PalpitesClient'

interface Props {
  searchParams: Promise<{ bolao?: string }>
}

export default async function PalpitesPage({ searchParams }: Props) {
  const { bolao: bolaoParam } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Busca bolões do usuário com configurações de regras
  const { data: memberRows } = await supabase
    .from('league_members')
    .select('league_id, leagues(id,name,owner_id,enabled_modes,game_scope,prediction_mode,team_filter_iso,single_match_id)')
    .eq('user_id', user?.id)

  interface MemberRow {
    league_id: string
    leagues: {
      id: string
      name: string
      owner_id: string
      enabled_modes: Record<string, boolean>
      game_scope: string | null
      prediction_mode: string | null
      team_filter_iso: string | null
      single_match_id: string | null
    }
  }
  const leagues = ((memberRows as unknown as MemberRow[]) ?? []).map(m => m.leagues).filter(Boolean)
  const selectedLeague = leagues.find(l => l.id === bolaoParam) ?? leagues[0] ?? null

  const gameScope = (selectedLeague?.game_scope ?? 'all') as 'all' | 'brazil' | 'groups' | 'knockout' | 'team' | 'match'
  const predictionMode = (selectedLeague?.prediction_mode ?? 'score') as 'score' | 'winner'
  const teamFilterIso = selectedLeague?.team_filter_iso ?? null
  const teamFilterIsos: string[] = (selectedLeague as unknown as { team_filter_isos?: string[] })?.team_filter_isos ?? (teamFilterIso ? [teamFilterIso] : [])
  const singleMatchId = selectedLeague?.single_match_id ?? null

  // Monta filtro de partidas baseado no escopo do bolão
  let matchQuery = supabase.from('matches').select('*').order('match_date', { ascending: true })
  if (gameScope === 'brazil') {
    matchQuery = matchQuery.or('home_iso.eq.br,away_iso.eq.br')
  } else if (gameScope === 'groups') {
    matchQuery = matchQuery.eq('stage', 'Fase de Grupos')
  } else if (gameScope === 'knockout') {
    matchQuery = matchQuery.neq('stage', 'Fase de Grupos')
  } else if (gameScope === 'team' && teamFilterIsos.length > 0) {
    const conditions = teamFilterIsos.flatMap(iso => [`home_iso.eq.${iso}`, `away_iso.eq.${iso}`]).join(',')
    matchQuery = matchQuery.or(conditions)
  } else if (gameScope === 'match' && singleMatchId) {
    matchQuery = matchQuery.eq('id', singleMatchId)
  }

  const [{ data: matches }, { data: predictions }, { data: extraPredictions }, { data: firstMatch }] =
    await Promise.all([
      matchQuery,
      supabase.from('predictions').select('*').eq('user_id', user?.id),
      selectedLeague
        ? supabase.from('extra_predictions').select('*').eq('user_id', user?.id).eq('league_id', selectedLeague.id)
        : Promise.resolve({ data: [] }),
      supabase.from('matches').select('match_date').order('match_date', { ascending: true }).limit(1).single(),
    ])

  const tournamentStarted = firstMatch ? new Date(firstMatch.match_date) <= new Date() : false
  const isOwner = selectedLeague?.owner_id === user?.id

  return (
    <PalpitesClient
      matches={matches ?? []}
      predictions={predictions ?? []}
      userId={user?.id ?? ''}
      leagues={leagues}
      selectedLeagueId={selectedLeague?.id}
      enabledModes={(selectedLeague?.enabled_modes ?? {}) as Record<string, boolean>}
      extraPredictions={extraPredictions ?? []}
      isOwner={isOwner}
      tournamentStarted={tournamentStarted}
      predictionMode={predictionMode}
      gameScope={gameScope}
    />
  )
}
