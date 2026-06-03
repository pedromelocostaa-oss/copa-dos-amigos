import { createClient } from '@/lib/supabase/server'
import PalpitesClient from './PalpitesClient'
import { filterMatchesByScope } from '@/types'
import type { Bolao } from '@/types'

interface Props {
  searchParams: Promise<{ bolao?: string }>
}

export default async function PalpitesPage({ searchParams }: Props) {
  const { bolao: bolaoParam } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Busca todos os bolões do usuário
  const { data: memberRows } = await supabase
    .from('bolao_members')
    .select('bolao_id, boloes(id,name,scope,scope_config,has_artilheiro)')
    .eq('user_id', user?.id)

  interface MemberRow { bolao_id: string; boloes: Bolao }
  const memberships = (memberRows as unknown as MemberRow[]) ?? []
  const boloes = memberships.map(m => m.boloes).filter(Boolean)

  // Bolão selecionado: via query param ou o primeiro da lista
  const selectedBolao = boloes.find(b => b.id === bolaoParam) ?? boloes[0] ?? null

  const [{ data: allMatches }, { data: predictions }] = await Promise.all([
    supabase.from('matches').select('*').order('match_date', { ascending: true }),
    supabase.from('predictions').select('*').eq('user_id', user?.id),
  ])

  const matches = selectedBolao
    ? filterMatchesByScope(
        allMatches ?? [],
        selectedBolao.scope,
        selectedBolao.scope_config as Record<string, unknown>
      )
    : (allMatches ?? [])

  return (
    <PalpitesClient
      matches={matches}
      predictions={predictions ?? []}
      userId={user?.id ?? ''}
      boloes={boloes}
      selectedBolaoId={selectedBolao?.id}
      hasArtilheiro={selectedBolao?.has_artilheiro ?? false}
    />
  )
}
