import { createClient } from '@/lib/supabase/server'
import ParticipantesClient from './ParticipantesClient'

export default async function ParticipantesPage() {
  const supabase = await createClient()
  const { data: participants } = await supabase
    .from('participants')
    .select('*')
    .order('created_at', { ascending: false })

  return <ParticipantesClient participants={participants ?? []} />
}
