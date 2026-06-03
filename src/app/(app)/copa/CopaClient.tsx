'use client'

import { useState } from 'react'
import FlagImage from '@/components/ui/FlagImage'
import Link from 'next/link'

type Tab = 'jogos' | 'grupos' | 'artilharia' | 'mata_mata'

interface StandingRow {
  group_name: string; team: string; iso: string
  played: number; won: number; drawn: number; lost: number
  goals_for: number; goals_against: number; goal_diff: number; points: number
}
interface Match {
  id: string; home_team: string; away_team: string; home_iso: string; away_iso: string
  match_date: string; stage: string; group_name?: string; home_score?: number; away_score?: number; is_finished: boolean
}
interface Scorer { player_name: string; team: string; team_iso: string; goals: number }
interface NewsItem { source: string; title: string; summary: string; tag: string; href: string }

interface Props {
  standings: StandingRow[]
  nextMatches: Match[]
  finishedMatches: Match[]
  scorers: Scorer[]
  news: NewsItem[]
}

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

function sortGroup(rows: StandingRow[]) {
  return [...rows].sort((a, b) => b.points - a.points || b.goal_diff - a.goal_diff || b.goals_for - a.goals_for)
}

export default function CopaClient({ standings, nextMatches, finishedMatches, scorers, news }: Props) {
  const [tab, setTab] = useState<Tab>('jogos')
  const [selectedGroup, setSelectedGroup] = useState('A')
  const [showFinished, setShowFinished] = useState(false)

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'jogos',     label: 'Jogos',      icon: '⚽' },
    { key: 'grupos',    label: 'Grupos',     icon: '📋' },
    { key: 'mata_mata', label: 'Mata-mata',  icon: '⚔️' },
    { key: 'artilharia',label: 'Artilharia', icon: '🥅' },
  ]

  const allMatches = [...nextMatches, ...finishedMatches]
  const eliminationMatches = allMatches.filter(m => m.stage !== 'Fase de Grupos')
  const groupMatches = allMatches.filter(m => m.stage === 'Fase de Grupos')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🌍 Copa do Mundo 2026</h1>
        <p className="text-sm text-gray-400">EUA · Canadá · México — 11 Jun a 19 Jul</p>
      </div>

      {/* Tabs — altura mínima 48px para tap targets corretos */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[52px] rounded-xl text-xs font-semibold transition active:opacity-70 ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
            <span className="text-base leading-none">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── JOGOS ── */}
      {tab === 'jogos' && (
        <div className="space-y-4">
          {/* Próximos */}
          {nextMatches.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Próximos jogos</h3>
              <div className="space-y-2">
                {nextMatches.map(match => (
                  <Link key={match.id} href={`/jogos/${match.id}`}
                    className="block bg-white rounded-xl border border-gray-100 shadow-sm p-3 hover:shadow-md transition">
                    <div className="flex items-center gap-2 mb-2">
                      {match.stage === 'Fase de Grupos' && match.group_name && (
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">Grupo {match.group_name}</span>
                      )}
                      {match.stage !== 'Fase de Grupos' && (
                        <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full font-medium">{match.stage}</span>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">
                        {new Date(match.match_date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                        {' · '}
                        {new Date(match.match_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FlagImage iso={match.home_iso} name={match.home_team} size={24} />
                        <span className="text-sm font-semibold text-gray-900 truncate">{match.home_team}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-400 shrink-0">×</span>
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="text-sm font-semibold text-gray-900 truncate text-right">{match.away_team}</span>
                        <FlagImage iso={match.away_iso} name={match.away_team} size={24} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Resultados */}
          {finishedMatches.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Resultados</h3>
                <button onClick={() => setShowFinished(v => !v)} className="text-xs text-green-600 font-medium">
                  {showFinished ? 'Ocultar' : 'Ver todos'}
                </button>
              </div>
              <div className="space-y-2">
                {(showFinished ? finishedMatches : finishedMatches.slice(-3)).reverse().map(match => (
                  <Link key={match.id} href={`/jogos/${match.id}`}
                    className="block bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 hover:shadow-md transition">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FlagImage iso={match.home_iso} name={match.home_team} size={20} />
                        <span className="text-sm font-medium text-gray-700 truncate">{match.home_team}</span>
                      </div>
                      <div className="shrink-0 text-center bg-gray-900 text-white rounded-lg px-3 py-1">
                        <span className="font-bold text-sm">{match.home_score} – {match.away_score}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="text-sm font-medium text-gray-700 truncate text-right">{match.away_team}</span>
                        <FlagImage iso={match.away_iso} name={match.away_team} size={20} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {nextMatches.length === 0 && finishedMatches.length === 0 && (
            <div className="bg-white rounded-2xl border p-10 text-center text-gray-400">
              <p className="text-4xl mb-3">⚽</p>
              <p>Os jogos aparecerão aqui quando o torneio começar.</p>
            </div>
          )}
        </div>
      )}

      {/* ── GRUPOS ── */}
      {tab === 'grupos' && (
        <div className="space-y-3">
          {/* Seletor de grupo */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {GROUPS.map(g => (
              <button key={g} onClick={() => setSelectedGroup(g)}
                className={`shrink-0 w-10 h-10 rounded-full text-sm font-bold transition ${selectedGroup === g ? 'bg-green-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:border-green-300'}`}>
                {g}
              </button>
            ))}
          </div>

          {/* Standings */}
          {(() => {
            const rows = sortGroup(standings.filter(s => s.group_name === selectedGroup))
            const gMatches = groupMatches.filter(m => m.group_name === selectedGroup)
            return (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-green-700 text-white px-4 py-2.5 font-bold text-sm flex items-center justify-between">
                  <span>Grupo {selectedGroup}</span>
                  <span className="text-green-200 text-xs font-normal">Top 2 se classificam</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-400 text-xs">
                      <tr>
                        <th className="px-3 py-2 text-left">Seleção</th>
                        <th className="px-2 py-2 text-center w-8">J</th>
                        <th className="px-2 py-2 text-center w-8">V</th>
                        <th className="px-2 py-2 text-center w-8">E</th>
                        <th className="px-2 py-2 text-center w-8">D</th>
                        <th className="px-2 py-2 text-center w-10">SG</th>
                        <th className="px-2 py-2 text-center w-10 font-bold text-gray-600">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        gMatches.flatMap((m, idx) => {
                          if (idx >= 2) return []
                          return [
                            { team: m.home_team, iso: m.home_iso },
                            { team: m.away_team, iso: m.away_iso },
                          ]
                        }).filter((t, i, arr) => arr.findIndex(x => x.team === t.team) === i).slice(0, 4)
                          .map((t, i) => (
                            <tr key={t.team} className={`border-t border-gray-50 ${i < 2 ? 'bg-green-50/30' : ''}`}>
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-300 w-4">{i + 1}</span>
                                  <FlagImage iso={t.iso} name={t.team} size={18} />
                                  <span className="text-xs font-medium">{t.team}</span>
                                </div>
                              </td>
                              {[0,0,0,0,0,0].map((_,j) => <td key={j} className="px-2 py-2 text-center text-gray-200 text-xs">—</td>)}
                            </tr>
                          ))
                      ) : rows.map((s, i) => (
                        <tr key={s.team} className={`border-t border-gray-50 ${i < 2 ? 'bg-green-50/40' : ''}`}>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                              <FlagImage iso={s.iso} name={s.team} size={18} />
                              <span className="text-xs font-medium">{s.team}</span>
                              {i < 2 && <span className="text-green-500 text-xs">✓</span>}
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center text-xs text-gray-500">{s.played}</td>
                          <td className="px-2 py-2 text-center text-xs text-gray-500">{s.won}</td>
                          <td className="px-2 py-2 text-center text-xs text-gray-500">{s.drawn}</td>
                          <td className="px-2 py-2 text-center text-xs text-gray-500">{s.lost}</td>
                          <td className="px-2 py-2 text-center text-xs text-gray-500">{s.goal_diff > 0 ? `+${s.goal_diff}` : s.goal_diff}</td>
                          <td className="px-2 py-2 text-center font-bold text-green-700">{s.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Jogos do grupo */}
                {gMatches.length > 0 && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {gMatches.map(m => (
                      <Link key={m.id} href={`/jogos/${m.id}`}
                        className="flex items-center px-4 py-2.5 gap-3 hover:bg-gray-50 transition text-xs">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <FlagImage iso={m.home_iso} name={m.home_team} size={18} />
                          <span className="font-medium truncate">{m.home_team}</span>
                        </div>
                        <div className="shrink-0 text-center min-w-[60px]">
                          {m.is_finished ? (
                            <span className="font-bold text-gray-900">{m.home_score} – {m.away_score}</span>
                          ) : (
                            <span className="text-gray-400">{new Date(m.match_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                          <span className="font-medium truncate text-right">{m.away_team}</span>
                          <FlagImage iso={m.away_iso} name={m.away_team} size={18} />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {/* ── MATA-MATA ── */}
      {tab === 'mata_mata' && (
        <div className="space-y-3">
          {eliminationMatches.length === 0 ? (
            <div className="bg-white rounded-2xl border p-10 text-center text-gray-400 space-y-3">
              <p className="text-4xl">⚔️</p>
              <p className="font-medium text-gray-600">Mata-mata ainda não começou</p>
              <p className="text-sm">A fase eliminatória começa após a fase de grupos (a partir de 29 de junho de 2026).</p>
            </div>
          ) : (
            <div className="space-y-2">
              {['Oitavas', 'Quartas', 'Semifinal', 'Disputa 3º lugar', 'Final'].map(stage => {
                const stageMatches = eliminationMatches.filter(m => m.stage === stage)
                if (stageMatches.length === 0) return null
                return (
                  <div key={stage}>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{stage}</h3>
                    <div className="space-y-2">
                      {stageMatches.map(m => (
                        <Link key={m.id} href={`/jogos/${m.id}`}
                          className="block bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 hover:shadow-md transition">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <FlagImage iso={m.home_iso} name={m.home_team} size={22} />
                              <span className="text-sm font-semibold truncate">{m.home_team === 'TBD' ? '—' : m.home_team}</span>
                            </div>
                            <div className="shrink-0 text-center">
                              {m.is_finished ? (
                                <span className="bg-gray-900 text-white text-sm font-bold px-3 py-1 rounded-lg">
                                  {m.home_score} – {m.away_score}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">
                                  {new Date(m.match_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                              <span className="text-sm font-semibold truncate text-right">{m.away_team === 'TBD' ? '—' : m.away_team}</span>
                              <FlagImage iso={m.away_iso} name={m.away_team} size={22} />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <Link href="/chaveamento" className="block text-center text-sm text-green-600 font-medium hover:underline py-1">
            Ver chaveamento completo →
          </Link>
        </div>
      )}

      {/* ── ARTILHARIA ── */}
      {tab === 'artilharia' && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">🥅 Artilheiros</h3>
            </div>
            {scorers.length === 0 ? (
              <div className="p-10 text-center text-gray-400">
                <p className="text-4xl mb-3">🥅</p>
                <p className="text-sm">Nenhum gol registrado ainda.</p>
                <p className="text-xs mt-1 text-gray-300">Os gols aparecerão aqui conforme os jogos forem realizados.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {scorers.map((s, i) => (
                  <div key={`${s.player_name}-${s.team}`} className="flex items-center gap-3 px-4 py-3.5">
                    <span className="text-lg w-7 shrink-0 text-center">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-sm font-bold text-gray-400">{i + 1}</span>}
                    </span>
                    <FlagImage iso={s.team_iso} name={s.team} size={24} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{s.player_name}</p>
                      <p className="text-xs text-gray-400">{s.team}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-green-700 text-xl leading-none">{s.goals}</p>
                      <p className="text-xs text-gray-400">gols</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
