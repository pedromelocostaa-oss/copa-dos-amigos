import { createClient } from '@/lib/supabase/server'
import { calculatePrizes } from '@/lib/scoring'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: participant } = await supabase
    .from('participants')
    .select('*')
    .eq('user_id', user?.id)
    .single()

  const { count: totalPaid } = await supabase
    .from('participants')
    .select('*', { count: 'exact', head: true })
    .eq('payment_status', 'pago')

  const { data: nextMatches } = await supabase
    .from('matches')
    .select('*')
    .eq('is_finished', false)
    .order('match_date', { ascending: true })
    .limit(3)

  const prizes = calculatePrizes(totalPaid ?? 0, 20)

  const paymentColor = {
    pago: 'bg-green-100 text-green-700',
    pendente: 'bg-yellow-100 text-yellow-700',
    isento: 'bg-blue-100 text-blue-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Olá, {participant?.name ?? user?.user_metadata?.name ?? 'Participante'} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Copa do Mundo 2026</p>
        </div>
        {participant?.payment_status && (
          <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${paymentColor[participant.payment_status as keyof typeof paymentColor]}`}>
            {participant.payment_status}
          </span>
        )}
      </div>

      {participant?.payment_status === 'pendente' && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 text-yellow-800 text-sm">
          ⚠️ Seu pagamento de <strong>R$20</strong> ainda está pendente. Envie o comprovante para o administrador para liberar seus palpites.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {prizes.map(prize => (
          <div key={prize.position} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="text-2xl mb-1">
              {prize.position === 1 ? '🥇' : prize.position === 2 ? '🥈' : '🥉'}
            </div>
            <p className="text-gray-500 text-sm">{prize.label} — {prize.percentage}%</p>
            <p className="text-2xl font-bold text-gray-900">
              R$ {prize.amount.toFixed(0)}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Próximos jogos</h2>
          <Link href="/palpites" className="text-green-600 text-sm hover:underline">Ver todos →</Link>
        </div>
        {!nextMatches?.length ? (
          <p className="text-gray-400 text-sm">Nenhum jogo agendado.</p>
        ) : (
          <div className="space-y-3">
            {nextMatches.map(match => (
              <div key={match.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{match.home_flag}</span>
                  <span className="font-medium">{match.home_team}</span>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">{match.stage}</p>
                  <p className="text-sm font-semibold text-gray-600">VS</p>
                  <p className="text-xs text-gray-400">
                    {new Date(match.match_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{match.away_team}</span>
                  <span className="text-2xl">{match.away_flag}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/palpites', icon: '✏️', label: 'Fazer Palpites' },
          { href: '/ranking', icon: '🏆', label: 'Ver Ranking' },
          { href: '/ligas', icon: '⚽', label: 'Minhas Ligas' },
          { href: '/perfil', icon: '👤', label: 'Meu Perfil' },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center hover:shadow-md transition"
          >
            <div className="text-3xl mb-2">{item.icon}</div>
            <p className="text-sm font-medium text-gray-700">{item.label}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
