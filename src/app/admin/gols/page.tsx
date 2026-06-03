import { createClient } from '@/lib/supabase/server'
import GolsClient from './GolsClient'

export default async function GolsPage() {
  const supabase = await createClient()

  const { data: matches } = await supabase
    .from('matches')
    .select('id, home_team, away_team, home_iso, away_iso, match_date, is_finished, group_name, home_score, away_score')
    .eq('is_finished', true)
    .order('match_date', { ascending: false })

  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .order('created_at', { ascending: false })

  return <GolsClient matches={matches ?? []} goals={goals ?? []} />
}
