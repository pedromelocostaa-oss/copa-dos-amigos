import { createClient } from '@/lib/supabase/server'
import { getTeamData } from '@/lib/teams-data'
import FlagImage from '@/components/ui/FlagImage'
import Link from 'next/link'
import { notFound } from 'next/navigation'

async function getCountryData(iso: string) {
  try {
    const res = await fetch(`https://restcountries.com/v3.1/alpha/${iso}?fields=name,capital,population,area,region,subregion,languages,currencies`, { next: { revalidate: 86400 } })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: match } = await supabase.from('matches').select('*').eq('id', id).single()
  if (!match || match.stage !== 'Fase de Grupos') notFound()

  const { data: goals } = await supabase.from('goals').select('*').eq('match_id', id).order('minute')

  const [homeCountry, awayCountry] = await Promise.all([
    getCountryData(match.home_iso),
    getCountryData(match.away_iso),
  ])

  const homeTeam = getTeamData(match.home_team)
  const awayTeam = getTeamData(match.away_team)

  const matchDate = new Date(match.match_date)
  const isFinished = match.is_finished
  const isLive = !isFinished && matchDate <= new Date()

  function fmt(n: number) {
    return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(n)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Back */}
      <Link href="/palpites" className="text-sm text-green-600 hover:underline flex items-center gap-1">← Voltar aos palpites</Link>

      {/* Match header */}
      <div className="bg-green-700 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs bg-green-600 px-2 py-0.5 rounded-full">Grupo {match.group_name}</span>
          {isFinished && <span className="text-xs bg-green-600 px-2 py-0.5 rounded-full">Encerrado</span>}
          {isLive && <span className="text-xs bg-red-500 px-2 py-0.5 rounded-full animate-pulse">AO VIVO</span>}
        </div>

        <div className="flex items-center justify-between mt-4 gap-4">
          <div className="flex flex-col items-center gap-2 flex-1">
            <FlagImage iso={match.home_iso} name={match.home_team} size={80} className="rounded-lg shadow-lg" />
            <p className="font-bold text-center text-sm">{match.home_team}</p>
            {homeTeam && <p className="text-xs text-green-200">#{homeTeam.fifaRank} FIFA</p>}
          </div>

          <div className="text-center shrink-0">
            {isFinished ? (
              <div className="text-4xl font-black">{match.home_score} — {match.away_score}</div>
            ) : (
              <div>
                <div className="text-2xl font-bold">VS</div>
                <div className="text-xs text-green-200 mt-1">{matchDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</div>
                <div className="text-sm font-semibold">{matchDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 flex-1">
            <FlagImage iso={match.away_iso} name={match.away_team} size={80} className="rounded-lg shadow-lg" />
            <p className="font-bold text-center text-sm">{match.away_team}</p>
            {awayTeam && <p className="text-xs text-green-200">#{awayTeam.fifaRank} FIFA</p>}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-green-600 text-center text-xs text-green-200 space-y-0.5">
          <div>{match.stadium}</div>
          <div>{match.city}</div>
        </div>
      </div>

      {/* Goals (if finished) */}
      {isFinished && goals && goals.length > 0 && (
        <div className="bg-white rounded-2xl border shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-3">⚽ Gols</h2>
          <div className="space-y-2">
            {goals.map(g => (
              <div key={g.id} className="flex items-center gap-3 text-sm">
                <span className="text-gray-400 w-8 text-right shrink-0">{g.minute}'</span>
                <FlagImage iso={g.team_iso} name={g.team} size={20} />
                <span className="font-medium">{g.player_name}</span>
                {g.is_own_goal && <span className="text-red-500 text-xs">(gol contra)</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teams info */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { match_team: match.home_team, team: homeTeam, country: homeCountry, iso: match.home_iso },
          { match_team: match.away_team, team: awayTeam, country: awayCountry, iso: match.away_iso },
        ].map(({ match_team, team, country, iso }) => (
          <div key={match_team} className="bg-white rounded-2xl border shadow-sm p-4 space-y-4">
            <div className="flex items-center gap-2">
              <FlagImage iso={iso} name={match_team} size={32} />
              <h3 className="font-bold text-gray-900 text-sm leading-tight">{match_team}</h3>
            </div>

            {team && (
              <div className="space-y-2">
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-green-700">#{team.fifaRank}</p>
                  <p className="text-xs text-green-600">Ranking FIFA</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Treinador</p>
                  <p className="text-sm font-medium text-gray-800">{team.coach}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Destaques</p>
                  <div className="flex flex-col gap-1">
                    {team.players.map(p => (
                      <p key={p} className="text-xs text-gray-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                        {p}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {country && (
              <div className="border-t pt-3 space-y-1.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">País</p>
                {[
                  { label: 'Capital', value: country.capital?.[0] },
                  { label: 'Região', value: country.subregion || country.region },
                  { label: 'População', value: country.population ? fmt(country.population) : null },
                  { label: 'Área', value: country.area ? `${fmt(country.area)} km²` : null },
                  { label: 'Idioma', value: country.languages ? Object.values(country.languages as Record<string,string>)[0] : null },
                  { label: 'Moeda', value: country.currencies ? Object.values(country.currencies as Record<string,{name:string}>)[0]?.name : null },
                ].filter(i => i.value).map(item => (
                  <div key={item.label} className="flex justify-between text-xs">
                    <span className="text-gray-400">{item.label}</span>
                    <span className="text-gray-700 font-medium text-right ml-2">{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
