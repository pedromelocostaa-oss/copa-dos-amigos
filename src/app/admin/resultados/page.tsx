import { createClient } from '@/lib/supabase/server'
import ResultadosClient from './ResultadosClient'

export default async function ResultadosPage() {
  const supabase = await createClient()
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('match_date', { ascending: true })

  return <ResultadosClient matches={matches ?? []} />
}
