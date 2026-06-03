import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PostJoinSteps from './PostJoinSteps'

interface Props {
  params: Promise<{ codigo: string }>
}

async function joinLeague(leagueId: string, userId: string) {
  'use server'
  const supabase = await createClient()
  await supabase.from('league_members').upsert(
    { league_id: leagueId, user_id: userId },
    { onConflict: 'league_id,user_id' }
  )
  redirect('/dashboard')
}

export default async function EntrarPage({ params }: Props) {
  const { codigo } = await params
  const code = codigo.toUpperCase()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Busca bolão + owner
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
            className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition">
            Criar meu bolão
          </Link>
        </div>
      </div>
    )
  }

  // Busca membros + nome do owner (primeiro membro = owner)
  const [
    { count: memberCount },
    { data: members },
    { data: ownerParticipant },
  ] = await Promise.all([
    supabase.from('league_members').select('*', { count: 'exact', head: true }).eq('league_id', league.id),
    supabase.from('league_members')
      .select('user_id, participants(name)')
      .eq('league_id', league.id)
      .limit(6),
    supabase.from('participants').select('name').eq('user_id', league.owner_id).single(),
  ])

  const entryFee  = (league.entry_fee ?? 0) as number
  const totalMembers = memberCount ?? 0
  const prizePool = entryFee > 0 ? (totalMembers * entryFee) / 100 : 0
  const ownerName = ownerParticipant?.name?.split(' ')[0] ?? 'Alguém'

  // Initials de até 5 membros para prova social
  const memberInitials = ((members as unknown as Array<{ user_id: string; participants: { name: string } | null }>) ?? [])
    .map(m => m.participants?.name?.charAt(0)?.toUpperCase() ?? '?')
    .slice(0, 5)

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-green-600 to-green-800 px-4 py-10">
        <div className="w-full max-w-sm mx-auto space-y-5">
          {/* Header viral */}
          <div className="text-center text-white space-y-2">
            <p className="text-green-200 text-sm font-medium">
              {ownerName} te convidou para o bolão
            </p>
            <h1 className="text-3xl font-black">{league.name}</h1>
          </div>

          {/* Stats rápidos */}
          <div className="bg-white/15 rounded-2xl p-5 space-y-4">
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

            {/* Prova social — avatares */}
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
                    : 'seja o primeiro a entrar!'}
                </p>
              </div>
            )}
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <Link
              href={`/cadastro?next=/entrar/${code}`}
              className="block w-full bg-white text-green-700 font-black py-4 rounded-2xl text-center text-xl shadow-lg active:opacity-80"
            >
              Entrar no bolão ⚽
            </Link>
            <p className="text-center text-green-100 text-sm">
              Já tem conta?{' '}
              <Link href={`/login?next=/entrar/${code}`} className="font-bold underline">
                Fazer login
              </Link>
            </p>
          </div>

          {/* Código visível */}
          <div className="text-center">
            <p className="text-green-200 text-xs">Código do bolão</p>
            <p className="font-mono font-black text-white text-2xl tracking-widest">{league.code}</p>
          </div>
        </div>
      </div>
    )
  }

  // Usuário logado — verifica se já é membro
  const { data: existing } = await supabase
    .from('league_members')
    .select('id')
    .eq('league_id', league.id)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    redirect('/dashboard')
  }

  const joinAction = joinLeague.bind(null, league.id, user.id)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-800 px-4 py-10">
      <PostJoinSteps
        leagueName={league.name}
        leagueCode={league.code}
        memberCount={totalMembers}
        joinAction={joinAction}
      />
    </div>
  )
}
