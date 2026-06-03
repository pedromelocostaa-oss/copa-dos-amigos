import { createClient } from '@/lib/supabase/server'
import { calculatePrizes } from '@/lib/scoring'

export default async function RankingPage() {
  const supabase = await createClient()

  const { data: ranking } = await supabase
    .from('ranking')
    .select('*')
    .order('total_points', { ascending: false })
    .order('exact_scores', { ascending: false })
    .order('last_prediction_at', { ascending: true })

  const { count: totalPaid } = await supabase
    .from('participants')
    .select('*', { count: 'exact', head: true })
    .eq('payment_status', 'pago')

  const prizes = calculatePrizes(totalPaid ?? 0, 20)

  const medal = (pos: number) => pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `${pos}º`

  const paymentBadge: Record<string, string> = {
    pago: 'bg-green-100 text-green-700',
    pendente: 'bg-yellow-100 text-yellow-700',
    isento: 'bg-blue-100 text-blue-700',
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">🏆 Ranking</h1>

      <div className="grid grid-cols-3 gap-4">
        {prizes.map(p => (
          <div key={p.position} className="bg-white rounded-xl border shadow-sm p-4 text-center">
            <div className="text-2xl">{medal(p.position)}</div>
            <p className="text-sm text-gray-500">{p.label}</p>
            <p className="font-bold text-lg text-gray-900">R$ {p.amount.toFixed(0)}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Participante</th>
              <th className="px-4 py-3 text-center">Pts</th>
              <th className="px-4 py-3 text-center hidden md:table-cell">Exatos</th>
              <th className="px-4 py-3 text-center hidden md:table-cell">Resultado</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {!ranking?.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Nenhum palpite registrado ainda.
                </td>
              </tr>
            ) : (
              ranking.map((entry, i) => (
                <tr key={entry.user_id} className={`border-t border-gray-50 ${i < 3 ? 'font-medium' : ''}`}>
                  <td className="px-4 py-3 text-lg">{medal(i + 1)}</td>
                  <td className="px-4 py-3">{entry.name}</td>
                  <td className="px-4 py-3 text-center font-bold text-green-700">{entry.total_points}</td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">{entry.exact_scores}</td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">{entry.correct_results}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${paymentBadge[entry.payment_status] ?? ''}`}>
                      {entry.payment_status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Desempate: placares exatos → resultados corretos → data do último palpite
      </p>
    </div>
  )
}
