import { createClient } from '@/lib/supabase/server'
import FlagImage from '@/components/ui/FlagImage'
import Link from 'next/link'

export default async function ChaveamentoPage() {
  const supabase = await createClient()

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .in('stage', ['Oitavas de Final', 'Quartas de Final', 'Semifinal', 'Terceiro Lugar', 'Final'])
    .order('match_date', { ascending: true })

  const rounds = [
    { key: 'Oitavas de Final', label: 'Oitavas', short: 'R32' },
    { key: 'Quartas de Final', label: 'Quartas de Final', short: 'QF' },
    { key: 'Semifinal', label: 'Semifinais', short: 'SF' },
    { key: 'Final', label: 'Final', short: 'F' },
  ]

  const isReal = (name: string) => !name.startsWith('TBD') && !name.startsWith('1º') && !name.startsWith('2º') && !name.startsWith('3º') && name !== 'A definir'

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">🏆 Chaveamento</h1>

      {rounds.map(round => {
        const roundMatches = (matches ?? []).filter((m: any) => m.stage === round.key)
        if (!roundMatches.length) return null

        return (
          <div key={round.key} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="bg-gray-800 text-white px-4 py-2 font-semibold text-sm">{round.label}</div>
            <div className="divide-y divide-gray-50">
              {roundMatches.map((m: any) => {
                const homeReal = isReal(m.home_team)
                const awayReal = isReal(m.away_team)
                const hasResult = m.is_finished

                return (
                  <div key={m.id} className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* Home */}
                      <div className={`flex items-center gap-2 flex-1 min-w-0 ${hasResult && m.home_score > m.away_score ? 'font-bold' : ''}`}>
                        {homeReal && m.home_iso ? (
                          <FlagImage iso={m.home_iso} name={m.home_team} size={24} />
                        ) : <span className="w-6 h-4 bg-gray-100 rounded-sm shrink-0" />}
                        <span className={`text-sm truncate ${!homeReal ? 'text-gray-400 italic' : 'text-gray-900'}`}>
                          {homeReal ? m.home_team : m.home_team}
                        </span>
                      </div>

                      {/* Score / Date */}
                      <div className="shrink-0 text-center min-w-[60px]">
                        {hasResult ? (
                          <span className="font-bold text-gray-900">{m.home_score} — {m.away_score}</span>
                        ) : homeReal && awayReal ? (
                          <span className="text-xs text-gray-500">{new Date(m.match_date).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</span>
                        ) : (
                          <span className="text-gray-200 text-lg font-bold">—</span>
                        )}
                      </div>

                      {/* Away */}
                      <div className={`flex items-center gap-2 flex-1 min-w-0 justify-end ${hasResult && m.away_score > m.home_score ? 'font-bold' : ''}`}>
                        <span className={`text-sm truncate text-right ${!awayReal ? 'text-gray-400 italic' : 'text-gray-900'}`}>
                          {m.away_team}
                        </span>
                        {awayReal && m.away_iso ? (
                          <FlagImage iso={m.away_iso} name={m.away_team} size={24} />
                        ) : <span className="w-6 h-4 bg-gray-100 rounded-sm shrink-0" />}
                      </div>
                    </div>
                    {(homeReal || m.city !== 'A definir') && (
                      <p className="text-xs text-gray-400 mt-1 text-center">{m.city} · {m.stadium}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Terceiro lugar */}
      {(() => {
        const thirdPlace = (matches ?? []).filter((m: any) => m.stage === 'Terceiro Lugar')
        if (!thirdPlace.length) return null
        const m = thirdPlace[0] as any
        return (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="bg-amber-600 text-white px-4 py-2 font-semibold text-sm">🥉 Disputa de 3º Lugar</div>
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                {isReal(m.home_team) && m.home_iso ? <FlagImage iso={m.home_iso} name={m.home_team} size={24} /> : <span className="w-6 h-4 bg-gray-100 rounded-sm" />}
                <span className={`text-sm ${!isReal(m.home_team) ? 'text-gray-400 italic' : 'font-medium'}`}>{m.home_team}</span>
              </div>
              <span className="text-gray-400 text-sm">vs</span>
              <div className="flex items-center gap-2 flex-1 justify-end">
                <span className={`text-sm ${!isReal(m.away_team) ? 'text-gray-400 italic' : 'font-medium'}`}>{m.away_team}</span>
                {isReal(m.away_team) && m.away_iso ? <FlagImage iso={m.away_iso} name={m.away_team} size={24} /> : <span className="w-6 h-4 bg-gray-100 rounded-sm" />}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
