import { createClient } from '@/lib/supabase/server'
import FlagImage from '@/components/ui/FlagImage'
import Link from 'next/link'

export default async function GruposPage() {
  const supabase = await createClient()

  const { data: standings } = await supabase
    .from('group_standings')
    .select('*')

  const { data: matches } = await supabase
    .from('matches')
    .select('id,home_team,away_team,home_iso,away_iso,match_date,home_score,away_score,is_finished,group_name,city,stadium')
    .eq('stage', 'Fase de Grupos')
    .order('match_date', { ascending: true })

  const groups = ['A','B','C','D','E','F','G','H','I','J','K','L']

  function sortGroup(rows: any[]) {
    return [...rows].sort((a, b) =>
      b.points - a.points ||
      b.goal_diff - a.goal_diff ||
      b.goals_for - a.goals_for
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">📊 Grupos</h1>

      {groups.map(g => {
        const groupStandings = sortGroup((standings ?? []).filter((s: any) => s.group_name === g))
        const groupMatches = (matches ?? []).filter((m: any) => m.group_name === g)

        return (
          <div key={g} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="bg-green-700 text-white px-4 py-2 font-bold text-sm">Grupo {g}</div>

            {/* Standings table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs">
                  <tr>
                    <th className="px-3 py-2 text-left">Seleção</th>
                    <th className="px-2 py-2 text-center w-8">J</th>
                    <th className="px-2 py-2 text-center w-8">V</th>
                    <th className="px-2 py-2 text-center w-8">E</th>
                    <th className="px-2 py-2 text-center w-8">D</th>
                    <th className="px-2 py-2 text-center w-10 hidden sm:table-cell">GP</th>
                    <th className="px-2 py-2 text-center w-10 hidden sm:table-cell">GC</th>
                    <th className="px-2 py-2 text-center w-10">SG</th>
                    <th className="px-2 py-2 text-center w-10 font-bold">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {groupStandings.length === 0 ? (
                    // Show teams without results yet
                    groupMatches.filter((m,i,arr) =>
                      arr.findIndex(x => x.home_team === m.home_team) === i
                    ).flatMap(m => [
                      { team: m.home_team, iso: m.home_iso },
                      { team: m.away_team, iso: m.away_iso }
                    ]).filter((t,i,arr) => arr.findIndex(x=>x.team===t.team)===i).slice(0,4).map((t,i) => (
                      <tr key={t.team} className={`border-t border-gray-50 ${i < 2 ? 'bg-green-50/30' : ''}`}>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-4">{i+1}</span>
                            <FlagImage iso={t.iso} name={t.team} size={20} />
                            <span className="font-medium text-xs">{t.team}</span>
                          </div>
                        </td>
                        {[0,0,0,0,0,0,0,0].map((_,j) => <td key={j} className="px-2 py-2 text-center text-gray-300 text-xs">—</td>)}
                      </tr>
                    ))
                  ) : groupStandings.map((s: any, i: number) => (
                    <tr key={s.team} className={`border-t border-gray-50 ${i < 2 ? 'bg-green-50/50' : ''}`}>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 w-4">{i+1}</span>
                          <FlagImage iso={s.iso} name={s.team} size={20} />
                          <span className="font-medium text-xs">{s.team}</span>
                          {i < 2 && <span className="text-xs text-green-600 hidden sm:inline">✓</span>}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center text-xs text-gray-600">{s.played}</td>
                      <td className="px-2 py-2 text-center text-xs text-gray-600">{s.won}</td>
                      <td className="px-2 py-2 text-center text-xs text-gray-600">{s.drawn}</td>
                      <td className="px-2 py-2 text-center text-xs text-gray-600">{s.lost}</td>
                      <td className="px-2 py-2 text-center text-xs text-gray-600 hidden sm:table-cell">{s.goals_for}</td>
                      <td className="px-2 py-2 text-center text-xs text-gray-600 hidden sm:table-cell">{s.goals_against}</td>
                      <td className="px-2 py-2 text-center text-xs text-gray-600">{s.goal_diff > 0 ? `+${s.goal_diff}` : s.goal_diff}</td>
                      <td className="px-2 py-2 text-center font-bold text-green-700">{s.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Group matches */}
            <div className="border-t border-gray-100 divide-y divide-gray-50">
              {groupMatches.map((m: any) => (
                <Link key={m.id} href={`/jogos/${m.id}`}
                  className="flex items-center px-4 py-2.5 gap-3 hover:bg-gray-50 transition text-sm">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <FlagImage iso={m.home_iso} name={m.home_team} size={20} />
                    <span className="text-xs font-medium truncate">{m.home_team}</span>
                  </div>
                  <div className="shrink-0 text-center min-w-[70px]">
                    {m.is_finished ? (
                      <span className="font-bold text-gray-900">{m.home_score} — {m.away_score}</span>
                    ) : (
                      <span className="text-xs text-gray-400">{new Date(m.match_date).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                    <span className="text-xs font-medium truncate text-right">{m.away_team}</span>
                    <FlagImage iso={m.away_iso} name={m.away_team} size={20} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
