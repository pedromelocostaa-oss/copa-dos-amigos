import { createClient } from '@/lib/supabase/server'
import { calculatePrizes } from '@/lib/scoring'

export default async function RankingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: ranking }, { count: totalPaid }, { count: totalPredictions }] = await Promise.all([
    supabase.from('ranking').select('*').order('total_points', { ascending: false }).order('exact_scores', { ascending: false }).order('last_prediction_at', { ascending: true }),
    supabase.from('participants').select('*', { count: 'exact', head: true }).eq('payment_status', 'pago'),
    supabase.from('predictions').select('*', { count: 'exact', head: true }),
  ])

  const prizes = calculatePrizes(totalPaid ?? 0, 20)
  const myEntry = ranking?.find(r => r.user_id === user?.id)
  const myPosition = myEntry ? (ranking?.indexOf(myEntry) ?? -1) + 1 : null

  const medal = (pos: number) => pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `${pos}º`
  const badge: Record<string, string> = {
    pago: 'bg-green-100 text-green-700',
    pendente: 'bg-yellow-100 text-yellow-700',
    isento: 'bg-blue-100 text-blue-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏆 Ranking</h1>
          <p className="text-sm text-gray-500 mt-1">{totalPredictions ?? 0} palpites registrados</p>
        </div>
        {myPosition && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-green-600">Sua posição</p>
            <p className="text-2xl font-bold text-green-700">{medal(myPosition)}</p>
            <p className="text-xs text-green-600">{myEntry?.total_points ?? 0} pts</p>
          </div>
        )}
      </div>

      {/* Prêmios */}
      <div className="grid grid-cols-3 gap-3">
        {prizes.map(p => (
          <div key={p.position} className="bg-white rounded-xl border shadow-sm p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl">{medal(p.position)}</div>
            <p className="text-xs text-gray-500 mt-1">{p.label} · {p.percentage}%</p>
            <p className="font-bold text-sm sm:text-lg text-gray-900">R$ {p.amount.toFixed(0)}</p>
          </div>
        ))}
      </div>

      {/* Top 3 destaque */}
      {ranking && ranking.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {[ranking[1], ranking[0], ranking[2]].map((entry, visualIdx) => {
            const realIdx = visualIdx === 0 ? 1 : visualIdx === 1 ? 0 : 2
            return (
              <div key={entry.user_id}
                className={`bg-white rounded-xl border shadow-sm p-4 text-center ${realIdx === 0 ? 'ring-2 ring-yellow-400 scale-105' : ''}`}>
                <div className="text-3xl">{medal(realIdx + 1)}</div>
                <p className="font-semibold text-gray-900 mt-1 text-sm truncate">{entry.name}</p>
                <p className="text-green-700 font-bold">{entry.total_points} pts</p>
                <p className="text-xs text-gray-400">{entry.exact_scores} exatos</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Tabela completa */}
      <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-3 sm:px-4 py-3 text-left">#</th>
              <th className="px-3 sm:px-4 py-3 text-left">Participante</th>
              <th className="px-3 sm:px-4 py-3 text-center">Pts</th>
              <th className="px-3 sm:px-4 py-3 text-center hidden sm:table-cell">🎯 Exatos</th>
              <th className="px-3 sm:px-4 py-3 text-center hidden md:table-cell">✓ Resultado</th>
              <th className="px-3 sm:px-4 py-3 text-center hidden sm:table-cell">Status</th>
            </tr>
          </thead>
          <tbody>
            {!ranking?.length ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Nenhum palpite registrado ainda.</td></tr>
            ) : ranking.map((entry, i) => (
              <tr key={entry.user_id}
                className={`border-t border-gray-50 transition ${entry.user_id === user?.id ? 'bg-green-50 font-medium' : 'hover:bg-gray-50'}`}>
                <td className="px-3 sm:px-4 py-3 text-base">{medal(i + 1)}</td>
                <td className="px-3 sm:px-4 py-3">
                  {entry.name}
                  {entry.user_id === user?.id && <span className="ml-1 text-xs text-green-600">(você)</span>}
                </td>
                <td className="px-3 sm:px-4 py-3 text-center font-bold text-green-700 text-base">{entry.total_points}</td>
                <td className="px-3 sm:px-4 py-3 text-center hidden sm:table-cell">{entry.exact_scores}</td>
                <td className="px-3 sm:px-4 py-3 text-center hidden md:table-cell">{entry.correct_results}</td>
                <td className="px-3 sm:px-4 py-3 text-center hidden sm:table-cell">
                  <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${badge[entry.payment_status] ?? ''}`}>
                    {entry.payment_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 text-center">Desempate: placar exato (10pts) → resultado correto (5pts) → data do último palpite</p>
    </div>
  )
}
