'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Match } from '@/types'

export default function ResultadosClient({ matches: initial }: { matches: Match[] }) {
  const supabase = createClient()
  const [matches, setMatches] = useState(initial)
  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>({})
  const [saving, setSaving] = useState<string | null>(null)

  async function saveResult(matchId: string) {
    const s = scores[matchId]
    if (!s || s.home === '' || s.away === '') return
    setSaving(matchId)
    await supabase.from('matches').update({
      home_score: parseInt(s.home),
      away_score: parseInt(s.away),
      is_finished: true,
    }).eq('id', matchId)

    setMatches(prev => prev.map(m => m.id === matchId
      ? { ...m, home_score: parseInt(s.home), away_score: parseInt(s.away), is_finished: true }
      : m
    ))
    setSaving(null)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">⚽ Resultados dos Jogos</h1>
      <div className="space-y-3">
        {matches.map(match => (
          <div key={match.id} className="bg-white rounded-xl border shadow-sm p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-2xl">{match.home_flag}</span>
                <span className="font-semibold">{match.home_team}</span>
              </div>

              {match.is_finished ? (
                <div className="text-center">
                  <span className="text-2xl font-bold text-gray-800">
                    {match.home_score} × {match.away_score}
                  </span>
                  <p className="text-xs text-green-600 mt-0.5">✓ Finalizado</p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="number" min={0} max={20}
                    placeholder="0"
                    value={scores[match.id]?.home ?? ''}
                    onChange={e => setScores(s => ({ ...s, [match.id]: { home: e.target.value, away: s[match.id]?.away ?? '' } }))}
                    className="w-14 text-center border border-gray-300 rounded-lg py-2 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-gray-400 font-bold">×</span>
                  <input
                    type="number" min={0} max={20}
                    placeholder="0"
                    value={scores[match.id]?.away ?? ''}
                    onChange={e => setScores(s => ({ ...s, [match.id]: { home: s[match.id]?.home ?? '', away: e.target.value } }))}
                    className="w-14 text-center border border-gray-300 rounded-lg py-2 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={() => saveResult(match.id)}
                    disabled={saving === match.id}
                    className="ml-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                  >
                    {saving === match.id ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 flex-1 justify-end">
                <span className="font-semibold">{match.away_team}</span>
                <span className="text-2xl">{match.away_flag}</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {match.stage} · {new Date(match.match_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
