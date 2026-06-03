import { createClient } from '@/lib/supabase/server'
import ShareButton from '@/components/ui/ShareButton'
import Link from 'next/link'
import FlagImage from '@/components/ui/FlagImage'
import type { Bolao, BolaoMember } from '@/types'

const SCOPE_LABEL: Record<string, string> = {
  todos:             '🌍 Todos os jogos (104)',
  fase_grupos:       '📋 Fase de grupos (72)',
  mata_mata:         '⚔️ Mata-mata (32)',
  times_especificos: '🏳️ Times específicos',
  jogos_especificos: '📌 Jogos específicos',
  artilheiro:        '🥅 Artilheiro',
}

interface MemberRow extends BolaoMember {
  participants: { name: string; email: string } | null
}

export default async function BolaoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: participant } = await supabase
    .from('participants')
    .select('*, boloes(*)')
    .eq('user_id', user?.id)
    .single()

  const bolao = participant?.boloes as Bolao | null
  const isOwner = bolao?.owner_id === user?.id
  const isAdmin = participant?.is_admin

  if (!bolao) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <p className="text-gray-400">Você não está em nenhum bolão.</p>
        <Link href="/onboarding"
          className="bg-green-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-green-700 transition">
          Criar ou entrar em um bolão
        </Link>
      </div>
    )
  }

  const { data: members } = await supabase
    .from('bolao_members')
    .select('*, participants(name, email)')
    .eq('bolao_id', bolao.id)
    .order('joined_at', { ascending: true }) as { data: MemberRow[] | null }

  const { count: paidCount } = await supabase
    .from('bolao_members')
    .select('*', { count: 'exact', head: true })
    .eq('bolao_id', bolao.id)
    .in('payment_status', ['pago', 'isento'])

  const prize = bolao.entry_fee > 0 ? ((members?.length ?? 0) * bolao.entry_fee) / 100 : null
  const scopeTeams = (bolao.scope_config as { teams?: string[] })?.teams ?? []

  const paymentBadge: Record<string, string> = {
    pago:     'bg-green-100 text-green-700',
    pendente: 'bg-yellow-100 text-yellow-700',
    isento:   'bg-blue-100 text-blue-700',
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{bolao.name}</h1>
          <p className="text-sm text-gray-500">{members?.length ?? 0} participantes</p>
        </div>
        {(isOwner || isAdmin) && (
          <Link href="/admin"
            className="text-xs text-green-600 font-medium border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-50 transition">
            Admin →
          </Link>
        )}
      </div>

      {/* Código + compartilhar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Código de convite</p>
            <p className="font-mono font-bold text-3xl tracking-widest text-green-700 mt-0.5">{bolao.code}</p>
          </div>
          {prize !== null && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Prêmio estimado</p>
              <p className="font-bold text-lg text-green-700">R${prize.toFixed(0)}</p>
              <p className="text-xs text-gray-400">{paidCount ?? 0} pagos</p>
            </div>
          )}
        </div>
        <ShareButton bolaoCode={bolao.code} bolaoName={bolao.name} />
      </div>

      {/* Escopo */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
        <p className="text-sm font-semibold text-gray-700">Escopo do bolão</p>
        <p className="text-green-700 font-medium">{SCOPE_LABEL[bolao.scope] ?? bolao.scope}</p>
        {bolao.scope === 'times_especificos' && scopeTeams.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {scopeTeams.map((team: string) => (
              <span key={team} className="bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-lg">
                {team}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Lista de membros */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">Participantes</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {!members?.length ? (
            <p className="text-gray-400 text-sm p-4">Nenhum membro ainda.</p>
          ) : members.map(member => {
            const isMe = member.user_id === user?.id
            const showStatus = isOwner || isAdmin || isMe
            return (
              <div key={member.id}
                className={`flex items-center px-4 py-3 gap-3 ${isMe ? 'bg-green-50' : ''}`}>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                  {member.participants?.name?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate text-sm">
                    {member.participants?.name ?? 'Desconhecido'}
                    {isMe && <span className="ml-1 text-xs text-green-600">(você)</span>}
                  </p>
                  {(isOwner || isAdmin) && (
                    <p className="text-xs text-gray-400 truncate">{member.participants?.email}</p>
                  )}
                </div>
                {showStatus && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize shrink-0 ${paymentBadge[member.payment_status] ?? ''}`}>
                    {member.payment_status}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Botão convidar */}
      <div className="pb-4">
        <p className="text-sm text-gray-500 text-center mb-3">
          Convide mais amigos compartilhando o código <strong className="font-mono text-green-700">{bolao.code}</strong>
        </p>
        <ShareButton bolaoCode={bolao.code} bolaoName={bolao.name}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition text-base min-h-[48px]">
          📲 Convidar amigos
        </ShareButton>
      </div>
    </div>
  )
}
