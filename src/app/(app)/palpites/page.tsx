import { createClient } from '@/lib/supabase/server'
import PalpitesClient from './PalpitesClient'

interface Props {
  searchParams: Promise<{ bolao?: string }>
}

export default async function PalpitesPage({ searchParams }: Props) {
  const { bolao: bolaoParam } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Busca bolões do usuário com enabled_modes
  const { data: memberRows } = await supabase
    .from('league_members')
    .select('league_id, leagues(id,name,owner_id,enabled_modes)')
    .eq('user_id', user?.id)

  interface MemberRow {
    league_id: string
    leagues: { id: string; name: string; owner_id: string; enabled_modes: Record<string, boolean> }
  }
  const leagues = ((memberRows as unknown as MemberRow[]) ?? []).map(m => m.leagues).filter(Boolean)
  const selectedLeague = leagues.find(l => l.id === bolaoParam) ?? leagues[0] ?? null

  const now = new Date().toISOString()

  const [{ data: matches }, { data: predictions }, { data: extraPredictions }, { data: firstMatch }] =
    await Promise.all([
      supabase.from('matches').select('*').order('match_date', { ascending: true }),
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
    />
  )
}
