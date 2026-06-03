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

type PredMap = Record<string, { home: string; away: string }>
type SavingState = 'idle' | 'saving' | 'saved' | 'error'

export default function PalpitesClient({ matches, predictions, userId, isPaid }: Props) {
  const supabase = createClient()

  const [preds, setPreds] = useState<PredMap>(() => {
    const map: PredMap = {}
    predictions.forEach(p => { map[p.match_id] = { home: String(p.home_score), away: String(p.away_score) } })
    return map
  })
  const [saving, setSaving] = useState<Record<string, SavingState>>({})
  const [activeStage, setActiveStage] = useState<string | null>(null)

  function isLocked(match: Match) {
    return new Date(match.match_date) <= new Date() || match.is_finished
  }

  async function savePrediction(matchId: string) {
    const pred = preds[matchId]
    if (!pred || pred.home === '' || pred.away === '') return
    setSaving(s => ({ ...s, [matchId]: 'saving' }))

    const existing = predictions.find(p => p.match_id === matchId)
    const payload = { user_id: userId, match_id: matchId, home_score: parseInt(pred.home), away_score: parseInt(pred.away) }

    const { error } = existing
      ? await supabase.from('predictions').update(payload).eq('id', existing.id)
      : await supabase.from('predictions').insert(payload)

    setSaving(s => ({ ...s, [matchId]: error ? 'error' : 'saved' }))
    setTimeout(() => setSaving(s => ({ ...s, [matchId]: 'idle' })), 2500)
  }

  // Group matches by stage
  const stages = [...new Set(matches.map(m => m.stage))]
  const openMatches = matches.filter(m => !isLocked(m))
  const completedCount = predictions.filter(p => p.home_score !== undefined).length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">✏️ Palpites</h1>
          <p className="text-sm text-gray-500 mt-1">{completedCount} de {matches.length} jogos palpitados</p>
        </div>
        <div className="text-right">
          <div className="w-32 bg-gray-200 rounded-full h-2 mt-3">
            <div className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${matches.length ? (completedCount / matches.length) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {!isPaid && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 text-yellow-800 text-sm flex gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-semibold">Pagamento pendente</p>
            <p>Seus palpites ficam bloqueados até o administrador confirmar o pagamento de R$20. Verifique seu perfil para mais detalhes.</p>
          </div>
        </div>
      )}

      {/* Stage filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setActiveStage(null)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${!activeStage ? 'bg-green-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
          Todos ({openMatches.length} abertos)
        </button>
        {stages.map(stage => {
          const stageOpen = matches.filter(m => m.stage === stage && !isLocked(m)).length
          return (
            <button key={stage} onClick={() => setActiveStage(stage)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${activeStage === stage ? 'bg-green-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
              {stage} {stageOpen > 0 && <span className="ml-1 bg-green-200 text-green-800 text-xs px-1.5 rounded-full">{stageOpen}</span>}
            </button>
          )
        })}
      </div>

      {stages.filter(s => !activeStage || s === activeStage).map(stage => {
        const stageMatches = matches.filter(m => m.stage === stage)
        const open = stageMatches.filter(m => !isLocked(m))
        const closed = stageMatches.filter(m => isLocked(m))

        return (
          <section key={stage}>
            <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
              {stage}
              {open.length > 0 && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{open.length} abertos</span>}
            </h2>
            <div className="space-y-2">
              {[...open, ...closed].map(match => (
                <MatchCard key={match.id}
                  match={match}
                  locked={isLocked(match)}
                  value={preds[match.id]}
                  onChange={(home, away) => setPreds(p => ({ ...p, [match.id]: { home, away } }))}
                  onSave={() => savePrediction(match.id)}
                  savingState={saving[match.id] ?? 'idle'}
                  disabled={!isPaid}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

interface CardProps {
  match: Match
  locked: boolean
  value?: { home: string; away: string }
  onChange: (home: string, away: string) => void
  onSave: () => void
  savingState: SavingState
  disabled: boolean
}

function MatchCard({ match, locked, value, onChange, onSave, savingState, disabled }: CardProps) {
  const hasPrediction = value?.home !== undefined && value.away !== undefined

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-4 transition ${locked && !match.is_finished ? 'border-orange-200' : ''} ${match.is_finished ? 'opacity-80' : ''}`}>
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Home team */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-2xl sm:text-3xl shrink-0">{match.home_flag}</span>
          <span className="font-semibold text-gray-800 text-sm sm:text-base truncate">{match.home_team}</span>
        </div>

        {/* Score inputs */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <input type="number" min={0} max={30} inputMode="numeric"
            value={value?.home ?? ''}
            onChange={e => onChange(e.target.value, value?.away ?? '')}
            disabled={disabled || locked}
            placeholder="–"
            className="w-12 sm:w-14 h-12 text-center border-2 border-gray-200 rounded-xl text-lg font-bold focus:outline-none focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-400 transition" />
          <span className="text-gray-300 font-bold text-lg">×</span>
          <input type="number" min={0} max={30} inputMode="numeric"
            value={value?.away ?? ''}
            onChange={e => onChange(value?.home ?? '', e.target.value)}
            disabled={disabled || locked}
            placeholder="–"
            className="w-12 sm:w-14 h-12 text-center border-2 border-gray-200 rounded-xl text-lg font-bold focus:outline-none focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-400 transition" />
        </div>

        {/* Away team */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="font-semibold text-gray-800 text-sm sm:text-base truncate text-right">{match.away_team}</span>
          <span className="text-2xl sm:text-3xl shrink-0">{match.away_flag}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
        <div className="text-xs text-gray-400 space-y-0.5">
          <div>{match.stage}</div>
          <div>{new Date(match.match_date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        <div className="flex items-center gap-2">
          {match.is_finished && (
            <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
              Resultado: {match.home_score} × {match.away_score}
            </span>
          )}
          {!match.is_finished && locked && (
            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">🔒 Encerrado</span>
          )}
          {!locked && !disabled && (
            <button onClick={onSave}
              disabled={savingState === 'saving' || !hasPrediction}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition disabled:opacity-40 ${
                savingState === 'saved' ? 'bg-green-100 text-green-700' :
                savingState === 'error' ? 'bg-red-100 text-red-700' :
                'bg-green-600 hover:bg-green-700 text-white'
              }`}>
              {savingState === 'saving' ? '...' : savingState === 'saved' ? '✓ Salvo' : savingState === 'error' ? '✗ Erro' : 'Salvar'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
