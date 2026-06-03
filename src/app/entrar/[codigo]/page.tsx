import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: Promise<{ codigo: string }>
}

async function joinBolao(bolaoId: string, userId: string) {
  'use server'
  const supabase = await createClient()
  await supabase.from('bolao_members').upsert(
    { bolao_id: bolaoId, user_id: userId, payment_status: 'pendente' },
    { onConflict: 'bolao_id,user_id' }
  )
  await supabase.from('participants').update({ active_bolao_id: bolaoId }).eq('user_id', userId)
  redirect('/dashboard')
}

export default async function EntrarPage({ params }: Props) {
  const { codigo } = await params
  const code = codigo.toUpperCase()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: bolao } = await supabase
    .from('boloes')
    .select('*')
    .eq('code', code)
    .single()

  if (!bolao) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-800 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center space-y-4">
          <div className="text-5xl">😕</div>
          <h1 className="text-xl font-bold text-gray-900">Bolão não encontrado</h1>
          <p className="text-gray-500 text-sm">O código <strong className="font-mono">{code}</strong> não existe ou foi desativado.</p>
          <Link href="/onboarding"
            className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition">
            Criar meu bolão
          </Link>
        </div>
      </div>
    )
  }

  const { count: memberCount } = await supabase
    .from('bolao_members')
    .select('*', { count: 'exact', head: true })
    .eq('bolao_id', bolao.id)

  const scopeLabel: Record<string, string> = {
    todos: 'Todos os 104 jogos',
    fase_grupos: 'Fase de grupos (72 jogos)',
    mata_mata: 'Mata-mata (32 jogos)',
    times_especificos: 'Times específicos',
    jogos_especificos: 'Jogos específicos',
    artilheiro: 'Artilheiro da Copa',
  }

  // Usuário não está logado — mostra preview
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-800 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="text-5xl">⚽</div>
            <h1 className="text-2xl font-bold text-gray-900">{bolao.name}</h1>
            <p className="text-gray-500 text-sm">Você foi convidado para este bolão</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{memberCount ?? 0}</p>
              <p className="text-xs text-gray-500">participantes</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-sm font-bold text-green-700">
                {bolao.entry_fee > 0 ? `R$${(bolao.entry_fee / 100).toFixed(0)}` : 'Gratuito'}
              </p>
              <p className="text-xs text-gray-500">entrada</p>
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-3 text-sm text-green-800">
            <span className="font-medium">Escopo: </span>{scopeLabel[bolao.scope] ?? bolao.scope}
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

  // Usuário logado — verifica se já é membro
  const { data: existing } = await supabase
    .from('bolao_members')
    .select('id')
    .eq('bolao_id', bolao.id)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    // Só atualiza o bolão ativo e redireciona
    await supabase.from('participants').update({ active_bolao_id: bolao.id }).eq('user_id', user.id)
    redirect('/dashboard')
  }

  const joinWithId = joinBolao.bind(null, bolao.id, user.id)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-800 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="text-5xl">⚽</div>
          <h1 className="text-2xl font-bold text-gray-900">{bolao.name}</h1>
          <p className="text-gray-500 text-sm">Você foi convidado para este bolão</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{memberCount ?? 0}</p>
            <p className="text-xs text-gray-500">participantes</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-sm font-bold text-green-700">
              {bolao.entry_fee > 0 ? `R$${(bolao.entry_fee / 100).toFixed(0)}` : 'Gratuito'}
            </p>
            <p className="text-xs text-gray-500">entrada</p>
          </div>
        </div>

        <div className="bg-green-50 rounded-xl p-3 text-sm text-green-800">
          <span className="font-medium">Escopo: </span>{scopeLabel[bolao.scope] ?? bolao.scope}
        </div>

        <form action={joinWithId}>
          <button type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition text-lg">
            Entrar no bolão ⚽
          </button>
        </form>
      </div>
    </div>
  )
}
