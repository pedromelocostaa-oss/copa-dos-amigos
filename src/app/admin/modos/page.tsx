import { createClient } from '@/lib/supabase/server'
import ModosAdminClient from './ModosAdminClient'

export default async function ModosAdminPage() {
  const supabase = await createClient()

  const { data: leagues } = await supabase
    .from('leagues')
    .select('id, name, code, enabled_modes')
    .order('created_at', { ascending: false })

  return <ModosAdminClient leagues={leagues ?? []} />
}
