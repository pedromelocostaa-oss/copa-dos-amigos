'use client'

import { useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import FlagImage from '@/components/ui/FlagImage'
import Link from 'next/link'

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

interface Prediction {
  id: string
  match_id: string
  home_score: number
  away_score: number
}

interface BolaoBasic {
  id: string
  name: string
  scope: string
  has_artilheiro: boolean
}

interface Props {
  matches: Match[]
  predictions: Prediction[]
  userId: string
  boloes: BolaoBasic[]
  selectedBolaoId?: string
  hasArtilheiro?: boolean
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'
type Tab = 'jogos' | 'artilheiro'

export default function PalpitesClient({ matches, predictions, userId, boloes, selectedBolaoId, hasArtilheiro }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('jogos')

  const [preds, setPreds] = useState<Record<string, { home: string; away: string }>>(() => {
    const map: Record<string, { home: string; away: string }> = {}
    predictions.forEach(p => { map[p.match_id] = { home: String(p.home_score), away: String(p.away_score) } })
    return map
  })
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({})
  const [activeStage, setActiveStage] = useState<string | null>(null)

  function isLocked(match: Match) {
    return new Date(match.match_date) <= new Date() || match.is_finished
  }

  const save = useCallback(async (matchId: string, home: string, away: string) => {
    if (home === '' || away === '') return
    setSaveState(s => ({ ...s, [matchId]: 'saving' }))
    const existing = predictions.find(p => p.match_id === matchId)
    const payload = { user_id: userId, match_id: matchId, home_score: parseInt(home), away_score: parseInt(away) }
    const { error } = existing
      ? await supabase.from('predictions').update(payload).eq('id', existing.id)
      : await supabase.from('predictions').insert(payload)
    setSaveState(s => ({ ...s, [matchId]: error ? 'error' : 'saved' }))
    setTimeout(() => setSaveState(s => ({ ...s, [matchId]: 'idle' })), 2000)
  }, [predictions, userId, supabase])

  const stages = [...new Set(matches.map(m => m.stage))]
  const completedCount = Object.keys(preds).filter(id => preds[id].home !== '' && preds[id].away !== '').length
  const openCount = matches.filter(m => !isLocked(m)).length
  const selectedBolao = boloes.find(b => b.id === selectedBolaoId)

  return (
    <div className="space-y-4">
      {/* Header */}
      <h1 className="text-xl font-bold text-gray-900">✏️ Palpites</h1>

      {/* Seletor de bolão (se múltiplos) */}
      {boloes.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {boloes.map(b => (
            <button key={b.id}
              onClick={() => router.push(`/palpites?bolao=${b.id}`)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition border ${b.id === selectedBolaoId ? 'bg-green-600 text-white border-green-600' : 'bg-white border-gray-200 text-gray-600'}`}>
              {b.name}
            </button>
          ))}
        </div>
      )}

      {/* Tabs jogos / artilheiro */}
      {hasArtilheiro && (
        <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
          {(['jogos', 'artilheiro'] as Tab[]).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${activeTab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              {t === 'jogos' ? '⚽ Jogos' : '🥅 Artilheiro'}
            </button>
          ))}
        </div>
      )}

      {/* Artilheiro placeholder */}
      {activeTab === 'artilheiro' && (
        <div className="bg-white rounded-2xl border shadow-sm p-8 text-center space-y-3">
          <div className="text-5xl">🥅</div>
          <h2 className="font-semibold text-gray-900">Artilheiro da Copa</h2>
          <p className="text-gray-500 text-sm">Em quem você aposta? Funcionalidade em breve.</p>
          {/* TODO: form de aposta no artilheiro */}
        </div>
      )}

      {activeTab === 'jogos' && <>
        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${matches.length ? (completedCount / matches.length) * 100 : 0}%` }} />
          </div>
          <span className="text-sm text-gray-500 shrink-0">{completedCount}/{matches.length}</span>
        </div>

        {/* Stage tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          <button onClick={() => setActiveStage(null)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${!activeStage ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
            Todos · {openCount} abertos
          </button>
          {stages.map(stage => {
            const n = matches.filter(m => m.stage === stage && !isLocked(m)).length
            return (
              <button key={stage} onClick={() => setActiveStage(stage === activeStage ? null : stage)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${activeStage === stage ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
                {stage}{n > 0 ? ` · ${n}` : ''}
              </button>
            )
          })}
        </div>

        {matches.length === 0 && (
          <div className="bg-white rounded-2xl border p-10 text-center text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p>Nenhum jogo disponível para este bolão.</p>
          </div>
        )}

        {stages.filter(s => !activeStage || s === activeStage).map(stage => {
          const stageMatches = matches.filter(m => m.stage === stage)
          const open = stageMatches.filter(m => !isLocked(m))
          const closed = stageMatches.filter(m => isLocked(m))
          return (
            <section key={stage}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{stage}</h2>
                {open.length > 0 && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    {open.length} abertos
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {[...open, ...closed].map(match => (
                  <MatchCard key={match.id} match={match} locked={isLocked(match)}
                    value={preds[match.id]}
                    onChange={(home, away) => setPreds(p => ({ ...p, [match.id]: { home, away } }))}
                    onBlur={(home, away) => save(match.id, home, away)}
                    onSave={() => save(match.id, preds[match.id]?.home ?? '', preds[match.id]?.away ?? '')}
                    saveState={saveState[match.id] ?? 'idle'}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </>}
    </div>
  )
}

interface CardProps {
  match: Match
  locked: boolean
  value?: { home: string; away: string }
  onChange: (h: string, a: string) => void
  onBlur: (h: string, a: string) => void
  onSave: () => void
  saveState: SaveState
}

function MatchCard({ match, locked, value, onChange, onBlur, onSave, saveState }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${locked ? 'opacity-75' : ''}`}>
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100 gap-2">
        <Link href={`/jogos/${match.id}`} className="text-xs text-green-600 hover:underline font-medium truncate">
          {match.group_name ? `Grupo ${match.group_name} ·` : ''} Ver detalhes →
        </Link>
        <span className="text-xs text-gray-500 shrink-0">
          {new Date(match.match_date).toLocaleDateString('pt-BR', {
            weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
          })}
        </span>
        {locked && !match.is_finished && <span className="text-xs text-orange-500 shrink-0">🔒</span>}
      </div>

      <div className="flex items-center px-4 py-4 gap-3">
        <div className="flex flex-col items-center gap-1.5 flex-1">
          <FlagImage iso={match.home_iso} name={match.home_team} size={40} />
          <span className="text-xs font-semibold text-gray-800 text-center leading-tight">{match.home_team}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {match.is_finished ? (
            <div className="flex items-center gap-2">
              <span className="w-12 h-12 flex items-center justify-center text-xl font-bold text-gray-800 bg-gray-100 rounded-xl">{match.home_score}</span>
              <span className="text-gray-400 text-sm font-bold">×</span>
              <span className="w-12 h-12 flex items-center justify-center text-xl font-bold text-gray-800 bg-gray-100 rounded-xl">{match.away_score}</span>
            </div>
          ) : (
            <>
              <input type="number" inputMode="numeric" min={0} max={30}
                value={value?.home ?? ''}
                onChange={e => onChange(e.target.value, value?.away ?? '')}
                onBlur={e => !locked && onBlur(e.target.value, value?.away ?? '')}
                disabled={locked} placeholder="–"
                className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-300 transition" />
              <span className="text-gray-300 text-sm font-bold">×</span>
              <input type="number" inputMode="numeric" min={0} max={30}
                value={value?.away ?? ''}
                onChange={e => onChange(value?.home ?? '', e.target.value)}
                onBlur={e => !locked && onBlur(value?.home ?? '', e.target.value)}
                disabled={locked} placeholder="–"
                className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-300 transition" />
            </>
          )}
        </div>

        <div className="flex flex-col items-center gap-1.5 flex-1">
          <FlagImage iso={match.away_iso} name={match.away_team} size={40} />
          <span className="text-xs font-semibold text-gray-800 text-center leading-tight">{match.away_team}</span>
        </div>
      </div>

      {!locked && (
        <div className="px-4 pb-3 flex justify-end min-h-[24px]">
          {saveState === 'saving' && <span className="text-xs text-gray-400">Salvando...</span>}
          {saveState === 'saved'  && <span className="text-xs text-green-600 font-medium">✓ Salvo</span>}
          {saveState === 'error'  && <span className="text-xs text-red-500">Erro ao salvar</span>}
          {saveState === 'idle' && value?.home !== '' && value?.away !== '' && (
            <button onClick={onSave} className="text-xs text-green-600 font-medium hover:underline">Salvar</button>
          )}
        </div>
      )}
    </div>
  )
}
