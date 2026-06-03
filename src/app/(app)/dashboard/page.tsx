import { createClient } from '@/lib/supabase/server'
import { calculatePrizes } from '@/lib/scoring'
import FlagImage from '@/components/ui/FlagImage'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: participant }, { count: totalPaid }, { data: nextMatches }, { count: myPredictions }] =
    await Promise.all([
      supabase.from('participants').select('*').eq('user_id', user?.id).single(),
      supabase.from('participants').select('*', { count: 'exact', head: true }).eq('payment_status', 'pago'),
      supabase.from('matches').select('*').eq('is_finished', false).order('match_date', { ascending: true }).limit(5),
      supabase.from('predictions').select('*', { count: 'exact', head: true }).eq('user_id', user?.id),
    ])

  const prizes = calculatePrizes((totalPaid ?? 0) + 1, 20) // +1 pra incluir isentos na premiação
  const firstName = (participant?.name ?? 'Participante').split(' ')[0]

  const paymentColor: Record<string, string> = {
    pago: 'bg-green-100 text-green-700',
    pendente: 'bg-yellow-100 text-yellow-700',
    isento: 'bg-blue-100 text-blue-700',
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Olá, {firstName} 👋</h1>
          <p className="text-gray-500 text-sm">Copa do Mundo 2026</p>
        </div>
        {participant?.payment_status && (
          <span className={`px-3 py-1.5 rounded-full text-sm font-semibold capitalize ${paymentColor[participant.payment_status]}`}>
            {participant.payment_status}
          </span>
        )}
      </div>

      {participant?.payment_status === 'pendente' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex gap-3 items-start">
          <span className="text-xl shrink-0">⚠️</span>
          <div>
            <p className="font-semibold text-yellow-800 text-sm">Pagamento pendente</p>
            <p className="text-yellow-700 text-sm mt-0.5">Envie R$20 e aguarde a confirmação do admin para liberar seus palpites.</p>
          </div>
        </div>
      )}

      {/* Premiação */}
      <div className="grid grid-cols-3 gap-2">
        {prizes.map(prize => (
          <div key={prize.position} className="bg-white rounded-2xl shadow-sm p-3 border border-gray-100 text-center">
            <div className="text-xl">{prize.position === 1 ? '🥇' : prize.position === 2 ? '🥈' : '🥉'}</div>
            <p className="text-gray-400 text-xs mt-0.5">{prize.label}</p>
            <p className="text-base font-bold text-gray-900">R${prize.amount.toFixed(0)}</p>
          </div>
        ))}
      </div>

      {/* Meus palpites progress */}
      <div className="bg-green-600 rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm font-medium text-green-100">Meus palpites</p>
            <p className="text-2xl font-bold">{myPredictions ?? 0} <span className="text-base font-normal text-green-200">de 68</span></p>
          </div>
          <Link href="/palpites" className="bg-white text-green-700 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-green-50 transition">
            Palpitar →
          </Link>
        </div>
        <div className="w-full bg-green-700 rounded-full h-1.5 mt-1">
          <div className="bg-white h-1.5 rounded-full transition-all"
            style={{ width: `${((myPredictions ?? 0) / 68) * 100}%` }} />
        </div>
      </div>

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
                className="flex items-center px-4 py-3 gap-3 hover:bg-gray-50 transition">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FlagImage iso={match.home_iso} name={match.home_team} size={24} />
                  <span className="text-sm font-medium text-gray-800 truncate">{match.home_team}</span>
                </div>
                <div className="text-center shrink-0">
                  <p className="text-xs text-gray-400">{new Date(match.match_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</p>
                  <p className="text-xs font-bold text-gray-500">{new Date(match.match_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
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

      {/* Atalhos — hidden on mobile (bottom nav covers it) */}
      <div className="hidden md:grid grid-cols-4 gap-3">
        {[
          { href: '/palpites', icon: '✏️', label: 'Palpites' },
          { href: '/ranking', icon: '🏆', label: 'Ranking' },
          { href: '/ligas', icon: '⚽', label: 'Ligas' },
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
