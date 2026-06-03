import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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

  const { data: league } = await supabase
    .from('leagues')
    .select('id, name, code, owner_id')
    .eq('code', code)
    .single()

  if (!league) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-800 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center space-y-4">
          <div className="text-5xl">😕</div>
          <h1 className="text-xl font-bold text-gray-900">Bolão não encontrado</h1>
          <p className="text-gray-500 text-sm">O código <strong className="font-mono">{code}</strong> não existe.</p>
          <Link href="/onboarding"
            className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition">
            Criar meu bolão
          </Link>
        </div>
      </div>
    )
  }

  // Busca qtd de membros
  const { count: memberCount } = await supabase
    .from('league_members')
    .select('*', { count: 'exact', head: true })
    .eq('league_id', league.id)

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-800 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="text-5xl">⚽</div>
            <h1 className="text-2xl font-bold text-gray-900">{league.name}</h1>
            <p className="text-gray-500 text-sm">Você foi convidado para este bolão</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 flex justify-around">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-700">{memberCount ?? 0}</p>
              <p className="text-xs text-gray-500">participantes</p>
            </div>
            <div className="text-center">
              <p className="font-mono font-bold text-green-700 text-xl">{league.code}</p>
              <p className="text-xs text-gray-500">código</p>
            </div>
          </div>
          <div className="space-y-3">
            <Link href={`/cadastro?next=/entrar/${code}`}
              className="block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl text-center transition text-lg">
              Entrar no bolão ⚽
            </Link>
            <p className="text-center text-sm text-gray-500">
              Já tem conta?{' '}
              <Link href={`/login?next=/entrar/${code}`} className="text-green-600 font-medium hover:underline">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Verifica se já é membro
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-800 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="text-5xl">⚽</div>
          <h1 className="text-2xl font-bold text-gray-900">{league.name}</h1>
          <p className="text-gray-500 text-sm">Você foi convidado para este bolão</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 flex justify-around">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-700">{memberCount ?? 0}</p>
            <p className="text-xs text-gray-500">participantes</p>
          </div>
          <div className="text-center">
            <p className="font-mono font-bold text-green-700 text-xl">{league.code}</p>
            <p className="text-xs text-gray-500">código</p>
          </div>
        </div>
        <form action={joinAction}>
          <button type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition text-lg">
            Entrar no bolão ⚽
          </button>
        </form>
      </div>
    </div>
  )
}
