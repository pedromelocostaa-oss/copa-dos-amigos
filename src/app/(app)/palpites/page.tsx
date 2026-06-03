import { createClient } from '@/lib/supabase/server'
import PalpitesClient from './PalpitesClient'

interface Props {
  searchParams: Promise<{ bolao?: string }>
}

export default async function PalpitesPage({ searchParams }: Props) {
  const { bolao: bolaoParam } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Busca todos os bolões do usuário
  const { data: memberRows } = await supabase
    .from('league_members')
    .select('league_id, leagues(id,name)')
    .eq('user_id', user?.id)

  interface MemberRow { league_id: string; leagues: { id: string; name: string } }
  const leagues = ((memberRows as unknown as MemberRow[]) ?? []).map(m => m.leagues).filter(Boolean)
  const selectedLeague = leagues.find(l => l.id === bolaoParam) ?? leagues[0] ?? null

  const [{ data: matches }, { data: predictions }] = await Promise.all([
    supabase.from('matches').select('*').order('match_date', { ascending: true }),
    supabase.from('predictions').select('*').eq('user_id', user?.id),
  ])

  return (
    <PalpitesClient
      matches={matches ?? []}
      predictions={predictions ?? []}
      userId={user?.id ?? ''}
      leagues={leagues}
      selectedLeagueId={selectedLeague?.id}
    />
  )
}
