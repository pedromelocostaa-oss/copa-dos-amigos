import { createClient } from '@/lib/supabase/server'
import FlagImage from '@/components/ui/FlagImage'

export default async function ArtilhariaPage() {
  const supabase = await createClient()

  const { data: scorers } = await supabase
    .from('top_scorers')
    .select('*')
    .gt('goals', 0)
    .order('goals', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">🥅 Artilharia</h1>

      {!scorers?.length ? (
        <div className="bg-white rounded-2xl border p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">⚽</p>
          <p className="font-medium">Nenhum gol registrado ainda.</p>
          <p className="text-sm mt-1">Os gols aparecem aqui conforme os jogos são realizados.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Jogador</th>
                <th className="px-4 py-3 text-left">Seleção</th>
                <th className="px-4 py-3 text-center">⚽ Gols</th>
              </tr>
            </thead>
            <tbody>
              {scorers.map((s: any, i: number) => (
                <tr key={`${s.player_name}-${s.team}`}
                  className={`border-t border-gray-50 ${i === 0 ? 'bg-yellow-50' : ''}`}>
                  <td className="px-4 py-3">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-gray-400">{i + 1}</span>}
                  </td>
                  <td className="px-4 py-3 font-semibold">{s.player_name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FlagImage iso={s.team_iso} name={s.team} size={20} />
                      <span className="text-gray-600 text-xs">{s.team}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-green-700 text-lg">{s.goals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
