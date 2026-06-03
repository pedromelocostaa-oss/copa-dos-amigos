'use client'

import { useState } from 'react'
import FlagImage from '@/components/ui/FlagImage'
import Link from 'next/link'

type Tab = 'noticias' | 'jogos' | 'grupos' | 'artilharia'

interface StandingRow {
  group_name: string
  team: string
  iso: string
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  goal_diff: number
  points: number
}

interface Match {
  id: string
  home_team: string
  away_team: string
  home_iso: string
  away_iso: string
  match_date: string
  stage: string
  group_name?: string
  home_score?: number
  away_score?: number
  is_finished: boolean
}

interface Scorer {
  player_name: string
  team: string
  team_iso: string
  goals: number
}

interface NewsItem {
  source: string
  title: string
  summary: string
  tag: string
  href: string
}

interface Props {
  standings: StandingRow[]
  nextMatches: Match[]
  finishedMatches: Match[]
  scorers: Scorer[]
  news: NewsItem[]
}

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

function sortGroup(rows: StandingRow[]) {
  return [...rows].sort((a, b) =>
    b.points - a.points || b.goal_diff - a.goal_diff || b.goals_for - a.goals_for
  )
}

export default function CopaClient({ standings, nextMatches, finishedMatches, scorers, news }: Props) {
  const [tab, setTab] = useState<Tab>('noticias')
  const [selectedGroup, setSelectedGroup] = useState('A')

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'noticias',   label: 'Notícias',   icon: '📰' },
    { key: 'jogos',      label: 'Jogos',      icon: '⚽' },
    { key: 'grupos',     label: 'Grupos',     icon: '📋' },
    { key: 'artilharia', label: 'Artilharia', icon: '🥅' },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">🌍 Copa do Mundo 2026</h1>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 shrink-0 py-2.5 px-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── NOTÍCIAS ─────────────────────────────────────── */}
      {tab === 'noticias' && (
        <div className="space-y-3">
          {/* Banner Copa */}
          <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-5 text-white space-y-1">
            <p className="text-xs font-semibold text-green-200 uppercase tracking-wide">11 Jun – 19 Jul 2026</p>
            <h2 className="text-xl font-bold">Copa do Mundo FIFA 2026</h2>
            <p className="text-green-100 text-sm">EUA · Canadá · México — 48 seleções · 104 jogos</p>
            <div className="flex gap-4 mt-3 text-center">
              {[
                { v: '12', l: 'Grupos' },
                { v: '16', l: 'Cidades' },
                { v: '104', l: 'Jogos' },
                { v: '48', l: 'Seleções' },
              ].map(item => (
                <div key={item.l}>
                  <p className="text-2xl font-bold">{item.v}</p>
                  <p className="text-xs text-green-200">{item.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* News cards */}
          {news.map((item, i) => (
            <a key={i} href={item.href} target="_blank" rel="noopener noreferrer"
              className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition active:bg-gray-50">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-green-50 text-green-700 font-medium px-2 py-0.5 rounded-md">{item.tag}</span>
                    <span className="text-xs text-gray-400">{item.source}</span>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm leading-tight">{item.title}</p>
                  <p className="text-gray-500 text-xs mt-1 leading-relaxed">{item.summary}</p>
                </div>
                <span className="text-gray-300 shrink-0">→</span>
              </div>
            </a>
          ))}

          {/* Link para mais */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { href: 'https://www.espn.com.br/futebol/copa-do-mundo', label: 'ESPN', icon: '📺' },
              { href: 'https://ge.globo.com/futebol/copa-do-mundo/',   label: 'GE',   icon: '🌐' },
              { href: 'https://www.fifa.com/fifaplus/pt',              label: 'FIFA',  icon: '🏆' },
            ].map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                className="bg-white border border-gray-100 rounded-xl p-3 text-center hover:shadow-sm transition">
                <p className="text-xl">{s.icon}</p>
                <p className="text-xs font-medium text-gray-700 mt-1">{s.label}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── JOGOS ────────────────────────────────────────── */}
      {tab === 'jogos' && (
        <div className="space-y-4">
          {nextMatches.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Próximos jogos</h3>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                {nextMatches.map(match => (
                  <Link key={match.id} href={`/jogos/${match.id}`}
                    className="flex items-center px-4 py-3 gap-3 hover:bg-gray-50 transition">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FlagImage iso={match.home_iso} name={match.home_team} size={22} />
                      <span className="text-sm font-medium text-gray-800 truncate">{match.home_team}</span>
                    </div>
                    <div className="shrink-0 text-center min-w-[72px]">
                      <p className="text-xs text-gray-400">
                        {new Date(match.match_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </p>
                      <p className="text-xs font-bold text-green-600">
                        {new Date(match.match_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {match.group_name && <p className="text-[10px] text-gray-400">Grupo {match.group_name}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                      <span className="text-sm font-medium text-gray-800 truncate text-right">{match.away_team}</span>
                      <FlagImage iso={match.away_iso} name={match.away_team} size={22} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {finishedMatches.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Resultados</h3>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                {finishedMatches.slice(-10).reverse().map(match => (
                  <Link key={match.id} href={`/jogos/${match.id}`}
                    className="flex items-center px-4 py-3 gap-3 hover:bg-gray-50 transition">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FlagImage iso={match.home_iso} name={match.home_team} size={20} />
                      <span className="text-sm font-medium text-gray-700 truncate">{match.home_team}</span>
                    </div>
                    <div className="shrink-0 text-center min-w-[72px]">
                      <span className="font-bold text-gray-900 text-base">
                        {match.home_score} – {match.away_score}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                      <span className="text-sm font-medium text-gray-700 truncate text-right">{match.away_team}</span>
                      <FlagImage iso={match.away_iso} name={match.away_team} size={20} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {nextMatches.length === 0 && finishedMatches.length === 0 && (
            <div className="bg-white rounded-2xl border p-10 text-center text-gray-400">
              <p className="text-4xl mb-3">⚽</p>
              <p>Jogos serão exibidos aqui quando o torneio começar.</p>
            </div>
          )}
        </div>
      )}

      {/* ── GRUPOS ───────────────────────────────────────── */}
      {tab === 'grupos' && (
        <div className="space-y-3">
          {/* Group selector */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
            {GROUPS.map(g => (
              <button key={g} onClick={() => setSelectedGroup(g)}
                className={`shrink-0 w-9 h-9 rounded-full text-sm font-bold transition ${selectedGroup === g ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
                {g}
              </button>
            ))}
          </div>

          {/* Selected group standings */}
          {(() => {
            const rows = sortGroup(standings.filter(s => s.group_name === selectedGroup))
            const groupMatches = [] as Match[] // would need to pass matches for this
            return (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-green-700 text-white px-4 py-2.5 font-bold text-sm">Grupo {selectedGroup}</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs">
                      <tr>
                        <th className="px-3 py-2 text-left">Seleção</th>
                        <th className="px-2 py-2 text-center w-8">J</th>
                        <th className="px-2 py-2 text-center w-8">V</th>
                        <th className="px-2 py-2 text-center w-8">E</th>
                        <th className="px-2 py-2 text-center w-8">D</th>
                        <th className="px-2 py-2 text-center w-10">SG</th>
                        <th className="px-2 py-2 text-center w-10 font-bold">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-6 text-center text-gray-400 text-sm">
                            Jogos ainda não realizados
                          </td>
                        </tr>
                      ) : rows.map((s, i) => (
                        <tr key={s.team} className={`border-t border-gray-50 ${i < 2 ? 'bg-green-50/50' : ''}`}>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                              <FlagImage iso={s.iso} name={s.team} size={20} />
                              <span className="font-medium text-xs">{s.team}</span>
                              {i < 2 && <span className="text-green-600 text-xs">✓</span>}
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center text-xs text-gray-600">{s.played}</td>
                          <td className="px-2 py-2 text-center text-xs text-gray-600">{s.won}</td>
                          <td className="px-2 py-2 text-center text-xs text-gray-600">{s.drawn}</td>
                          <td className="px-2 py-2 text-center text-xs text-gray-600">{s.lost}</td>
                          <td className="px-2 py-2 text-center text-xs text-gray-600">
                            {s.goal_diff > 0 ? `+${s.goal_diff}` : s.goal_diff}
                          </td>
                          <td className="px-2 py-2 text-center font-bold text-green-700">{s.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })()}

          <Link href="/grupos"
            className="block text-center text-sm text-green-600 font-medium hover:underline py-1">
            Ver todos os grupos completos →
          </Link>
        </div>
      )}

      {/* ── ARTILHARIA ───────────────────────────────────── */}
      {tab === 'artilharia' && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <h3 className="font-semibold text-gray-900">🥅 Artilharia da Copa</h3>
            </div>
            {scorers.length === 0 ? (
              <div className="p-10 text-center text-gray-400">
                <p className="text-4xl mb-3">🥅</p>
                <p className="text-sm">Nenhum gol registrado ainda.</p>
                <p className="text-xs mt-1">Os gols aparecerão aqui conforme os jogos forem realizados.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {scorers.map((s, i) => (
                  <div key={`${s.player_name}-${s.team}`} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-lg w-7 shrink-0">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-sm text-gray-500">{i + 1}º</span>}
                    </span>
                    <FlagImage iso={s.team_iso} name={s.team} size={24} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{s.player_name}</p>
                      <p className="text-xs text-gray-500">{s.team}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-green-700 text-lg">{s.goals}</p>
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
