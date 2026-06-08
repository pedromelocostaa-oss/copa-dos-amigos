import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import EntrarInlineForm from './EntrarInlineForm'

interface Props {
  params: Promise<{ codigo: string }>
}

// Server Action — entra e vai direto pra palpites (para usuário já logado)
async function doJoin(leagueId: string, userId: string) {
  'use server'
  const supabase = await createClient()
  await supabase.from('league_members').upsert(
    { league_id: leagueId, user_id: userId },
    { onConflict: 'league_id,user_id' }
  )
  redirect('/palpites')
}

export default async function EntrarPage({ params }: Props) {
  const { codigo } = await params
  const code = codigo.toUpperCase()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Busca bolão
  const { data: league } = await supabase
    .from('leagues')
    .select('id, name, code, owner_id, entry_fee')
    .eq('code', code)
    .single()

  if (!league) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-800 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center space-y-4">
          <div className="text-5xl">😕</div>
          <h1 className="text-xl font-bold text-gray-900">Bolão não encontrado</h1>
          <p className="text-gray-500 text-sm">
            O código <strong className="font-mono">{code}</strong> não existe ou foi desativado.
          </p>
          <Link href="/onboarding"
            className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition min-h-[48px] flex items-center justify-center">
            Criar meu bolão
          </Link>
        </div>
      </div>
    )
  }

  // Dados do bolão para o preview
  const [
    { count: memberCount },
    { data: members },
    { data: ownerParticipant },
  ] = await Promise.all([
    supabase.from('league_members').select('*', { count: 'exact', head: true }).eq('league_id', league.id),
    supabase.from('league_members').select('user_id, participants(name)').eq('league_id', league.id).limit(6),
    supabase.from('participants').select('name').eq('user_id', league.owner_id).single(),
  ])

  const entryFee = (league.entry_fee ?? 0) as number
  const totalMembers = memberCount ?? 0
  const prizePool = entryFee > 0 ? (totalMembers * entryFee) / 100 : 0
  const ownerName = ownerParticipant?.name?.split(' ')[0] ?? 'Alguém'

  type MemberRow = { user_id: string; participants: { name: string } | null }
  const memberInitials = ((members as unknown as MemberRow[]) ?? [])
    .map(m => m.participants?.name?.charAt(0)?.toUpperCase() ?? '?')
    .slice(0, 5)

  // Usuário logado já é membro → vai direto pro dashboard
  if (user) {
    const { data: existing } = await supabase
      .from('league_members')
      .select('id')
      .eq('league_id', league.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) redirect('/dashboard')
  }

  const PreviewCard = () => (
    <div className="w-full max-w-sm mx-auto space-y-4">
      {/* Header */}
      <div className="text-center text-white space-y-1">
        <p className="text-green-200 text-sm font-medium">
          {ownerName} te convidou para o bolão
        </p>
        <h1 className="text-3xl font-black">{league.name}</h1>
      </div>

      {/* Stats */}
      <div className="bg-white/15 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-black text-white">{totalMembers}</p>
            <p className="text-xs text-green-200">participantes</p>
          </div>
          {entryFee > 0 ? (
            <div>
              <p className="text-2xl font-black text-white">R${(entryFee / 100).toFixed(0)}</p>
              <p className="text-xs text-green-200">por pessoa</p>
            </div>
          ) : (
            <div>
              <p className="text-2xl font-black text-white">Free</p>
              <p className="text-xs text-green-200">gratuito</p>
            </div>
          )}
          {prizePool > 0 ? (
            <div>
              <p className="text-2xl font-black text-yellow-300">R${prizePool.toFixed(0)}</p>
              <p className="text-xs text-green-200">em prêmios</p>
            </div>
          ) : (
            <div>
              <p className="text-2xl font-black text-white">⚽</p>
              <p className="text-xs text-green-200">diversão</p>
            </div>
          )}
        </div>

        {memberInitials.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {memberInitials.map((ini, i) => (
                <div key={i}
                  className="w-8 h-8 bg-green-600 border-2 border-white rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {ini}
                </div>
              ))}
              {totalMembers > 5 && (
                <div className="w-8 h-8 bg-white/30 border-2 border-white rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
                  +{totalMembers - 5}
                </div>
              )}
            </div>
            <p className="text-green-100 text-xs">
              {totalMembers > 1
                ? `${totalMembers} pessoas já estão dentro`
                : `${ownerName} está esperando você!`}
            </p>
          </div>
        )}
      </div>
    </div>
  )

  // ── Usuário NÃO logado → formulário inline de cadastro/login ──────
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-green-600 to-green-800 px-4 py-10">
        <div className="w-full max-w-sm mx-auto space-y-5">
          <PreviewCard />
          <EntrarInlineForm
            leagueId={league.id}
            code={code}
            leagueName={league.name}
          />
        </div>
      </div>
    )
  }

  // ── Usuário logado, não-membro — 1 toque ─────────────────────────
  const joinAction = doJoin.bind(null, league.id, user.id)

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-green-600 to-green-800 px-4 py-10">
      <div className="w-full max-w-sm mx-auto space-y-5">
        <PreviewCard />
        <form action={joinAction}>
          <button
            type="submit"
            className="w-full bg-white text-green-700 font-black py-4 rounded-2xl text-xl shadow-lg active:opacity-80 min-h-[56px]"
          >
            Entrar no bolão ⚽
          </button>
        </form>
        <Link href="/dashboard"
          className="block text-center text-green-200/70 text-sm py-2 min-h-[44px] flex items-center justify-center">
          Ir para o dashboard →
        </Link>
      </div>
    </div>
  )
}
