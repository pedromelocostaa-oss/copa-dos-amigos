'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Match, Prediction } from '@/types'

interface Props {
  matches: Match[]
  predictions: Prediction[]
  userId: string
  isPaid: boolean
}

export default function PalpitesClient({ matches, predictions, userId, isPaid }: Props) {
  const supabase = createClient()
  const [preds, setPreds] = useState<Record<string, { home: string; away: string }>>(() => {
    const map: Record<string, { home: string; away: string }> = {}
    predictions.forEach(p => {
      map[p.match_id] = { home: String(p.home_score), away: String(p.away_score) }
    })
    return map
  })
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  function isLocked(match: Match) {
    return new Date(match.match_date) <= new Date() || match.is_finished
  }

  async function savePrediction(matchId: string) {
    const pred = preds[matchId]
    if (!pred || pred.home === '' || pred.away === '') return
    setSaving(matchId)

    const existing = predictions.find(p => p.match_id === matchId)
    const payload = {
      user_id: userId,
      match_id: matchId,
      home_score: parseInt(pred.home),
      away_score: parseInt(pred.away),
    }

    if (existing) {
      await supabase.from('predictions').update(payload).eq('id', existing.id)
    } else {
      await supabase.from('predictions').insert(payload)
    }

    setSaving(null)
    setSaved(matchId)
    setTimeout(() => setSaved(null), 2000)
  }

  const openMatches = matches.filter(m => !isLocked(m))
  const closedMatches = matches.filter(m => isLocked(m))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">✏️ Palpites</h1>

      {!isPaid && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 text-yellow-800 text-sm">
          ⚠️ Seu pagamento ainda está pendente. Palpites só são liberados após confirmação do pagamento.
        </div>
      )}

      {openMatches.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Jogos abertos</h2>
          <div className="space-y-3">
            {openMatches.map(match => (
              <MatchCard
                key={match.id}
                match={match}
                value={preds[match.id]}
                onChange={(home, away) => setPreds(p => ({ ...p, [match.id]: { home, away } }))}
                onSave={() => savePrediction(match.id)}
                saving={saving === match.id}
                saved={saved === match.id}
                disabled={!isPaid}
              />
            ))}
          </div>
        </section>
      )}

      {closedMatches.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Jogos encerrados / em andamento</h2>
          <div className="space-y-3">
            {closedMatches.map(match => (
              <MatchCard
                key={match.id}
                match={match}
                value={preds[match.id]}
                onChange={() => {}}
                onSave={() => {}}
                saving={false}
                saved={false}
                disabled={true}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

interface MatchCardProps {
  match: Match
  value?: { home: string; away: string }
  onChange: (home: string, away: string) => void
  onSave: () => void
  saving: boolean
  saved: boolean
  disabled: boolean
}

function MatchCard({ match, value, onChange, onSave, saving, saved, disabled }: MatchCardProps) {
  const locked = new Date(match.match_date) <= new Date() || match.is_finished

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-4 ${locked ? 'opacity-70' : ''}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-3xl">{match.home_flag}</span>
          <span className="font-semibold text-gray-800">{match.home_team}</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={20}
            value={value?.home ?? ''}
            onChange={e => onChange(e.target.value, value?.away ?? '')}
            disabled={disabled || locked}
            className="w-14 text-center border border-gray-300 rounded-lg py-2 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
          />
          <span className="text-gray-400 font-bold">×</span>
          <input
            type="number"
            min={0}
            max={20}
            value={value?.away ?? ''}
            onChange={e => onChange(value?.home ?? '', e.target.value)}
            disabled={disabled || locked}
            className="w-14 text-center border border-gray-300 rounded-lg py-2 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
          />
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="font-semibold text-gray-800">{match.away_team}</span>
          <span className="text-3xl">{match.away_flag}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="text-xs text-gray-400">
          {match.stage} · {new Date(match.match_date).toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
          })}
        </div>
        {!locked && !disabled && (
          <button
            onClick={onSave}
            disabled={saving}
            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
          >
            {saved ? '✓ Salvo!' : saving ? 'Salvando...' : 'Salvar'}
          </button>
        )}
        {match.is_finished && (
          <span className="text-xs font-medium text-gray-500">
            Resultado: {match.home_score} × {match.away_score}
          </span>
        )}
      </div>
    </div>
  )
}
