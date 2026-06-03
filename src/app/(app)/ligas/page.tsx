import { createClient } from '@/lib/supabase/server'
import LigasClient from './LigasClient'

export default async function LigasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: leagues } = await supabase
    .from('leagues')
    .select('*, league_members(count)')
    .order('created_at', { ascending: false })

  const { data: myMemberships } = await supabase
    .from('league_members')
    .select('league_id')
    .eq('user_id', user?.id)

  const myLeagueIds = new Set(myMemberships?.map(m => m.league_id) ?? [])

  return (
    <LigasClient
      leagues={leagues ?? []}
      myLeagueIds={myLeagueIds}
      userId={user?.id ?? ''}
    />
  )
}
