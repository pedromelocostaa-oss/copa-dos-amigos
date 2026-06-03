import { createClient } from '@/lib/supabase/server'
import PalpitesClient from './PalpitesClient'

export default async function PalpitesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('match_date', { ascending: true })

  const { data: predictions } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', user?.id)

  const { data: participant } = await supabase
    .from('participants')
    .select('payment_status')
    .eq('user_id', user?.id)
    .single()

  const isPaid = participant?.payment_status === 'pago' || participant?.payment_status === 'isento'

  return (
    <PalpitesClient
      matches={matches ?? []}
      predictions={predictions ?? []}
      userId={user?.id ?? ''}
      isPaid={isPaid}
    />
  )
}
