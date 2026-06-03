import { createClient } from '@/lib/supabase/server'
import PalpitesClient from './PalpitesClient'
import { filterMatchesByScope } from '@/types'
import type { Bolao } from '@/types'

export default async function PalpitesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: participant }, { data: allMatches }, { data: predictions }] = await Promise.all([
    supabase.from('participants').select('*, boloes(*)').eq('user_id', user?.id).single(),
    supabase.from('matches').select('*').order('match_date', { ascending: true }),
    supabase.from('predictions').select('*').eq('user_id', user?.id),
  ])

  const bolao = participant?.boloes as Bolao | null
  const matches = bolao
    ? filterMatchesByScope(allMatches ?? [], bolao.scope, bolao.scope_config as Record<string, unknown>)
    : (allMatches ?? [])

  return (
    <PalpitesClient
      matches={matches}
      predictions={predictions ?? []}
      userId={user?.id ?? ''}
      bolaoName={bolao?.name}
      bolaoScope={bolao?.scope}
    />
  )
}
