import { createClient } from '@/lib/supabase/server'
import FlagImage from '@/components/ui/FlagImage'
import ShareButton from '@/components/ui/ShareButton'
import Link from 'next/link'
import type { Bolao } from '@/types'

function calculatePrize(paidCount: number, entryFeeInCents: number) {
  const pool = (paidCount * entryFeeInCents) / 100
  return [
    { position: 1, label: 'Ouro',   emoji: '🥇', percentage: 70, amount: pool * 0.70 },
    { position: 2, label: 'Prata',  emoji: '🥈', percentage: 20, amount: pool * 0.20 },
    { position: 3, label: 'Bronze', emoji: '🥉', percentage: 10, amount: pool * 0.10 },
  ]
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: participant } = await supabase
    .from('participants')
    .select('*, boloes(*)')
    .eq('user_id', user?.id)
    .single()

  const bolao = participant?.boloes as Bolao | null
  const firstName = (participant?.name ?? 'Participante').split(' ')[0]

  if (!bolao) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400">Carregando bolão...</p>
      </div>
    )
  }

  const [
    { data: ranking },
    { count: memberCount },
    { count: paidCount },
    { data: nextMatches },
    { count: myPredictions },
  ] = await Promise.all([
    supabase.from('bolao_ranking')
      .select('*')
      .eq('bolao_id', bolao.id)
      .order('total_points', { ascending: false })
      .order('exact_scores', { ascending: false })
      .limit(3),
    supabase.from('bolao_members').select('*', { count: 'exact', head: true }).eq('bolao_id', bolao.id),
    supabase.from('bolao_members').select('*', { count: 'exact', head: true })
      .eq('bolao_id', bolao.id).in('payment_status', ['pago', 'isento']),
    supabase.from('matches').select('*').eq('is_finished', false)
      .order('match_date', { ascending: true }).limit(5),
    supabase.from('predictions').select('*', { count: 'exact', head: true }).eq('user_id', user?.id),
  ])

  const prizes = calculatePrize(paidCount ?? 0, bolao.entry_fee)
  const medal = (i: number) => ['🥇', '🥈', '🥉'][i] ?? `${i + 1}º`
  const myRank = ranking?.find(r => r.user_id === user?.id)
  const myPosition = myRank ? (ranking?.indexOf(myRank) ?? -1) + 1 : null

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Olá, {firstName} 👋</h1>
          <p className="text-gray-500 text-sm">{bolao.name}</p>
        </div>
        {myPosition && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-center shrink-0">
            <p className="text-xs text-green-600">Sua posição</p>
            <p className="text-xl font-bold text-green-700">{medal(myPosition - 1)}</p>
          </div>
        )}
      </div>

      {/* Código do bolão + Compartilhar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">Código do bolão</p>
            <p className="font-mono font-bold text-lg tracking-widest text-green-700">{bolao.code}</p>
          </div>
          <span className="text-sm text-gray-500">{memberCount ?? 0} participantes</span>
        </div>
        <ShareButton bolaoCode={bolao.code} bolaoName={bolao.name} />
      </div>

      {/* Premiação */}
      {bolao.entry_fee > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {prizes.map(prize => (
            <div key={prize.position} className="bg-white rounded-2xl shadow-sm p-3 border border-gray-100 text-center">
              <div className="text-xl">{prize.emoji}</div>
              <p className="text-gray-400 text-xs mt-0.5">{prize.percentage}%</p>
              <p className="text-base font-bold text-gray-900">R${prize.amount.toFixed(0)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Meus palpites progress */}
      <div className="bg-green-600 rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm font-medium text-green-100">Meus palpites</p>
            <p className="text-2xl font-bold">
              {myPredictions ?? 0} <span className="text-base font-normal text-green-200">registrados</span>
            </p>
          </div>
          <Link href="/palpites"
            className="bg-white text-green-700 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-green-50 transition">
            Palpitar →
          </Link>
        </div>
        <div className="w-full bg-green-700 rounded-full h-1.5 mt-1">
          <div className="bg-white h-1.5 rounded-full"
            style={{ width: `${Math.min(((myPredictions ?? 0) / 72) * 100, 100)}%` }} />
        </div>
      </div>

      {/* Top 3 do bolão */}
      {ranking && ranking.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900 text-sm">Top 3 — {bolao.name}</h2>
            <Link href="/ranking" className="text-green-600 text-sm font-medium">Ver tudo →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {ranking.map((entry, i) => (
              <div key={entry.user_id}
                className={`flex items-center px-4 py-3 gap-3 ${entry.user_id === user?.id ? 'bg-green-50' : ''}`}>
                <span className="text-xl w-7 shrink-0">{medal(i)}</span>
                <span className="flex-1 font-medium text-gray-900 truncate">
                  {entry.name}
                  {entry.user_id === user?.id && <span className="ml-1 text-xs text-green-600">(você)</span>}
                </span>
                <span className="font-bold text-green-700">{entry.total_points} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Próximos jogos */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900 text-sm">Próximos jogos</h2>
          <Link href="/palpites" className="text-green-600 text-sm font-medium">Ver todos →</Link>
        </div>
        {!nextMatches?.length ? (
          <p className="text-gray-400 text-sm p-4">Nenhum jogo agendado.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {nextMatches.map(match => (
              <Link key={match.id} href="/palpites"
                className="flex items-center px-4 py-3 gap-3 hover:bg-gray-50 transition active:bg-gray-100">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FlagImage iso={match.home_iso} name={match.home_team} size={24} />
                  <span className="text-sm font-medium text-gray-800 truncate">{match.home_team}</span>
                </div>
                <div className="text-center shrink-0">
                  <p className="text-xs text-gray-400">
                    {new Date(match.match_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </p>
                  <p className="text-xs font-bold text-gray-500">
                    {new Date(match.match_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                  <span className="text-sm font-medium text-gray-800 truncate text-right">{match.away_team}</span>
                  <FlagImage iso={match.away_iso} name={match.away_team} size={24} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Atalhos desktop */}
      <div className="hidden md:grid grid-cols-4 gap-3">
        {[
          { href: '/palpites', icon: '✏️', label: 'Palpites' },
          { href: '/ranking', icon: '🏆', label: 'Ranking' },
          { href: '/bolao', icon: '⚽', label: 'Meu Bolão' },
          { href: '/perfil', icon: '👤', label: 'Perfil' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center hover:shadow-md transition">
            <div className="text-3xl mb-1">{item.icon}</div>
            <p className="text-sm font-medium text-gray-700">{item.label}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
