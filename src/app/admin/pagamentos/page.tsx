import { createClient } from '@/lib/supabase/server'
import PagamentosClient from './PagamentosClient'

export default async function PagamentosPage() {
  const supabase = await createClient()
  const { data: participants } = await supabase
    .from('participants')
    .select('*')
    .order('name')

  return <PagamentosClient participants={participants ?? []} />
}
