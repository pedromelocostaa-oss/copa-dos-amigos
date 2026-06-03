import { createClient } from '@/lib/supabase/server'
import type { Bolao } from '@/types'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ bolao?: string }>
}

export default async function RankingPage({ searchParams }: Props) {
  const { bolao: bolaoParam } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  interface MemberRow { bolao_id: string; boloes: Bolao }
  const { data: memberRows } = await supabase
    .from('bolao_members')
    .select('bolao_id, boloes(id,name,scope,has_artilheiro,entry_fee)')
    .eq('user_id', user?.id)

  const memberships = (memberRows as unknown as MemberRow[]) ?? []
  const boloes = memberships.map(m => m.boloes).filter(Boolean)
  const selectedBolao = boloes.find(b => b.id === bolaoParam) ?? boloes[0] ?? null

  const [{ data: ranking }, { count: totalPredictions }] = await Promise.all([
    selectedBolao
      ? supabase.from('bolao_ranking')
          .select('*')
          .eq('bolao_id', selectedBolao.id)
          .order('total_points', { ascending: false })
          .order('exact_scores', { ascending: false })
          .order('last_prediction_at', { ascending: true })
      : supabase.from('ranking')
          .select('*')
          .order('total_points', { ascending: false }),
    supabase.from('predictions').select('*', { count: 'exact', head: true }),
  ])

  const myEntry = ranking?.find(r => r.user_id === user?.id)
  const myPosition = myEntry ? (ranking?.indexOf(myEntry) ?? -1) + 1 : null
  const medal = (pos: number) => pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `${pos}º`

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏆 Ranking</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedBolao?.name ?? 'Global'} · {totalPredictions ?? 0} palpites
          </p>
        </div>
        {myPosition && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-green-600">Sua posição</p>
            <p className="text-2xl font-bold text-green-700">{medal(myPosition)}</p>
            <p className="text-xs text-green-600">{myEntry?.total_points ?? 0} pts</p>
          </div>
        )}
      </div>

      {/* Seletor de bolão */}
      {boloes.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {boloes.map(b => (
            <Link key={b.id} href={`/ranking?bolao=${b.id}`}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition border ${b.id === selectedBolao?.id ? 'bg-green-600 text-white border-green-600' : 'bg-white border-gray-200 text-gray-600'}`}>
              {b.name}
            </Link>
          ))}
        </div>
      )}

      {/* Top 3 */}
      {ranking && ranking.length >= 3 && (
        <div className="grid grid-cols-3 gap-2">
          {[ranking[1], ranking[0], ranking[2]].map((entry, visualIdx) => {
            if (!entry) return null
            const realIdx = visualIdx === 0 ? 1 : visualIdx === 1 ? 0 : 2
            return (
              <div key={entry.user_id}
                className={`bg-white rounded-xl border shadow-sm p-3 text-center ${realIdx === 0 ? 'ring-2 ring-yellow-400 scale-105' : ''}`}>
                <div className="text-2xl">{medal(realIdx + 1)}</div>
                <p className="font-semibold text-gray-900 mt-1 text-xs leading-tight truncate">{entry.name}</p>
                <p className="text-green-700 font-bold text-sm">{entry.total_points} pts</p>
                <p className="text-xs text-gray-400">{entry.exact_scores} exatos</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-3 py-3 text-left">#</th>
              <th className="px-3 py-3 text-left">Participante</th>
              <th className="px-3 py-3 text-center">Pts</th>
              <th className="px-3 py-3 text-center hidden sm:table-cell">🎯 Exatos</th>
              <th className="px-3 py-3 text-center hidden md:table-cell">✓ Resultado</th>
            </tr>
          </thead>
          <tbody>
            {!ranking?.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  Nenhum palpite registrado ainda.
                </td>
              </tr>
            ) : ranking.map((entry, i) => (
              <tr key={entry.user_id}
                className={`border-t border-gray-50 transition ${entry.user_id === user?.id ? 'bg-green-50 font-medium' : 'hover:bg-gray-50'}`}>
                <td className="px-3 py-3 text-base">{medal(i + 1)}</td>
                <td className="px-3 py-3">
                  {entry.name}
                  {entry.user_id === user?.id && <span className="ml-1 text-xs text-green-600">(você)</span>}
                </td>
                <td className="px-3 py-3 text-center font-bold text-green-700 text-base">{entry.total_points}</td>
                <td className="px-3 py-3 text-center hidden sm:table-cell">{entry.exact_scores}</td>
                <td className="px-3 py-3 text-center hidden md:table-cell">{entry.correct_results}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 text-center">
        Desempate: placar exato (10pts) → resultado correto (5pts) → data do último palpite
      </p>
    </div>
  )
}
