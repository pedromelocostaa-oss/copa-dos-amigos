import { createClient } from '@/lib/supabase/server'
import LigasClient from './LigasClient'

export default async function LigasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: myMemberships } = await supabase
    .from('league_members')
    .select('league_id')
    .eq('user_id', user?.id)

  const myLeagueIds = myMemberships?.map(m => m.league_id) ?? []

  const { data: leagues } = await supabase
    .from('leagues')
    .select('*, league_members(count)')
    .in('id', myLeagueIds.length ? myLeagueIds : ['00000000-0000-0000-0000-000000000000'])
    .order('created_at', { ascending: false })

  const formatted = (leagues ?? []).map(l => ({
    ...l,
    member_count: l.league_members?.[0]?.count ?? 0,
  }))

  return (
    <LigasClient
      leagues={formatted}
      myLeagueIds={myLeagueIds}
      userId={user?.id ?? ''}
    />
  )
}
