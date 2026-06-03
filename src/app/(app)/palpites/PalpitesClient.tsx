'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import FlagImage from '@/components/ui/FlagImage'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'

interface Match {
  id: string; home_team: string; away_team: string; home_iso: string; away_iso: string
  match_date: string; stage: string; group_name?: string
  home_score?: number; away_score?: number; is_finished: boolean
}
interface Prediction { id: string; match_id: string; home_score: number; away_score: number }
interface LeagueBasic { id: string; name: string }
interface Props {
  matches: Match[]; predictions: Prediction[]; userId: string
  leagues: LeagueBasic[]; selectedLeagueId?: string
}
type SaveState = 'idle' | 'saving' | 'saved' | 'error'
type Filter = 'todos' | 'abertos' | 'feitos'

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  if (d.toDateString() === today.toDateString()) return 'Hoje'
  if (d.toDateString() === tomorrow.toDateString()) return 'Amanhã'
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })
}

export default function PalpitesClient({ matches, predictions, userId, leagues, selectedLeagueId }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  const [preds, setPreds] = useState<Record<string, { home: string; away: string }>>(() => {
    const map: Record<string, { home: string; away: string }> = {}
    predictions.forEach(p => { map[p.match_id] = { home: String(p.home_score), away: String(p.away_score) } })
    return map
  })
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({})
  const [filter, setFilter] = useState<Filter>('abertos')
  // U3.3: "now" atualizado a cada 30s para travar cards cujo kickoff passou
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  // Dependência de `now` garante que isLocked() re-avalia quando o timer dispara
  function isLocked(m: Match) {
    return new Date(m.match_date).getTime() <= now || m.is_finished
  }
  function hasPred(matchId: string) { return !!(preds[matchId]?.home !== '' && preds[matchId]?.away !== '') }

  const save = useCallback(async (matchId: string, home: string, away: string) => {
    if (home === '' || away === '') return
    setSaveState(s => ({ ...s, [matchId]: 'saving' }))
    const existing = predictions.find(p => p.match_id === matchId)
    const payload = { user_id: userId, match_id: matchId, home_score: parseInt(home), away_score: parseInt(away) }
    const { error } = existing
      ? await supabase.from('predictions').update(payload).eq('id', existing.id)
      : await supabase.from('predictions').insert(payload)

    if (error) {
      // U3.3: RLS rejeitou — jogo já começou. Travar o card imediatamente.
      const isKickoffError = error.code === '42501' || error.message?.includes('row-level')
      if (isKickoffError) {
        toast('Este jogo já começou — palpite travado.', 'error')
        // Força re-avaliação do isLocked atualizando o timestamp
        setNow(Date.now())
      }
      setSaveState(s => ({ ...s, [matchId]: 'error' }))
    } else {
      setSaveState(s => ({ ...s, [matchId]: 'saved' }))
      // Haptic feedback no mobile (U3.2)
      if (typeof navigator.vibrate === 'function') navigator.vibrate(50)
    }
    setTimeout(() => setSaveState(s => ({ ...s, [matchId]: 'idle' })), 2000)
  }, [predictions, userId, supabase, toast])

  // Filtragem
  const filteredMatches = useMemo(() => {
    switch (filter) {
      case 'abertos': return matches.filter(m => !isLocked(m))
      case 'feitos':  return matches.filter(m => hasPred(m.id))
      default:        return matches
    }
  }, [matches, filter, preds])

  // Agrupa por data
  const groupedByDate = useMemo(() => {
    const groups: Record<string, Match[]> = {}
    filteredMatches.forEach(m => {
      const key = new Date(m.match_date).toDateString()
      if (!groups[key]) groups[key] = []
      groups[key].push(m)
    })
    return Object.entries(groups).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
  }, [filteredMatches])

  const completedCount = Object.values(preds).filter(v => v.home !== '' && v.away !== '').length
  const openCount = matches.filter(m => !isLocked(m)).length
  const totalOpen = openCount

  // P1.4a: nudge de jogos fechando nas próximas 2h
  const currentTime = Date.now()
  const closingSoon = matches.filter(m => {
    if (isLocked(m)) return false
    const diff = new Date(m.match_date).getTime() - currentTime
    return diff > 0 && diff < 2 * 60 * 60 * 1000 // < 2h
  })

  // P1.4b: verifica se todos os jogos abertos de hoje foram palpitados
  const todayMatches = matches.filter(m => {
    const d = new Date(m.match_date)
    const today = new Date()
    return d.toDateString() === today.toDateString() && !isLocked(m)
  })
  const todayDone = todayMatches.length > 0 && todayMatches.every(m => hasPred(m.id))

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">✏️ Palpites</h1>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${matches.length ? (completedCount / matches.length) * 100 : 0}%` }} />
          </div>
          <span className="text-sm text-gray-500 shrink-0 font-medium">{completedCount}/{matches.length}</span>
        </div>
      </div>

      {/* P1.4a: Banner "jogos fechando em breve" */}
      {closingSoon.length > 0 && (
        <div className="bg-orange-50 border border-orange-300 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl shrink-0">⏰</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-orange-800 text-sm">
              {closingSoon.length === 1
                ? `1 jogo fecha em menos de 2h!`
                : `${closingSoon.length} jogos fecham em menos de 2h!`}
            </p>
            <p className="text-orange-600 text-xs truncate">
              {closingSoon.map(m => m.home_team.split(' ')[0]).join(', ')}
            </p>
          </div>
          <button onClick={() => setFilter('abertos')}
            className="shrink-0 bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
            Palpitar
          </button>
        </div>
      )}

      {/* P1.4b: Microcelebração quando todos do dia feitos */}
      {todayDone && (
        <div className="bg-green-50 border border-green-300 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl">🎉</span>
          <div>
            <p className="font-bold text-green-800 text-sm">Todos os jogos de hoje palpitados!</p>
            <p className="text-green-600 text-xs">Volte amanhã para mais jogos.</p>
          </div>
        </div>
      )}

      {/* Seletor de bolão (múltiplos) */}
      {leagues.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {leagues.map(l => (
            <button key={l.id} onClick={() => router.push(`/palpites?bolao=${l.id}`)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition border ${l.id === selectedLeagueId ? 'bg-green-600 text-white border-green-600' : 'bg-white border-gray-200 text-gray-600'}`}>
              {l.name}
            </button>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        {([
          { key: 'abertos', label: `Abertos (${totalOpen})` },
          { key: 'todos',   label: 'Todos' },
          { key: 'feitos',  label: `Feitos (${completedCount})` },
        ] as const).map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${filter === f.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Grupos por data */}
      {groupedByDate.length === 0 && (
        <div className="bg-white rounded-2xl border p-10 text-center text-gray-400">
          <p className="text-4xl mb-3">✅</p>
          <p className="font-medium text-gray-600">
            {filter === 'abertos' ? 'Nenhum jogo aberto para palpite!' : 'Nenhum palpite registrado ainda.'}
          </p>
          {filter === 'abertos' && (
            <p className="text-sm mt-1">Volte quando os próximos jogos estiverem disponíveis.</p>
          )}
        </div>
      )}

      {groupedByDate.map(([dateKey, dayMatches]) => {
        const dateLabel = formatDate(dayMatches[0].match_date)
        const open = dayMatches.filter(m => !isLocked(m))
        const done = dayMatches.filter(m => hasPred(m.id))

        return (
          <div key={dateKey}>
            {/* Cabeçalho de data */}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-700 capitalize">{dateLabel}</h3>
                {open.length > 0 && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    {open.length} {open.length === 1 ? 'aberto' : 'abertos'}
                  </span>
                )}
                {filter !== 'abertos' && done.length > 0 && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {done.length} feitos
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {dayMatches.map(match => (
                <MatchCard key={match.id} match={match} locked={isLocked(match)}
                  value={preds[match.id]}
                  onChange={(h, a) => setPreds(p => ({ ...p, [match.id]: { home: h, away: a } }))}
                  onBlur={(h, a) => save(match.id, h, a)}
                  onSave={() => save(match.id, preds[match.id]?.home ?? '', preds[match.id]?.away ?? '')}
                  saveState={saveState[match.id] ?? 'idle'} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface CardProps {
  match: Match; locked: boolean; value?: { home: string; away: string }
  onChange: (h: string, a: string) => void; onBlur: (h: string, a: string) => void
  onSave: () => void; saveState: SaveState
}

function MatchCard({ match, locked, value, onChange, onBlur, onSave, saveState }: CardProps) {
  const hasPred = value?.home !== '' && value?.away !== '' && value?.home !== undefined
  const matchTime = new Date(match.match_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const isStartingSoon = !locked && new Date(match.match_date).getTime() - Date.now() < 2 * 60 * 60 * 1000

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition ${locked ? 'opacity-70' : ''} ${isStartingSoon ? 'border-orange-300 ring-1 ring-orange-200' : 'border-gray-100'}`}>
      {/* Barra superior */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100 gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {match.group_name && (
            <span className="text-xs text-gray-400 font-medium shrink-0">Grupo {match.group_name}</span>
          )}
          {match.stage !== 'Fase de Grupos' && (
            <span className="text-xs text-orange-600 font-semibold shrink-0">{match.stage}</span>
          )}
          {isStartingSoon && !locked && (
            <span className="text-xs text-orange-500 font-semibold">⚡ Começa em breve!</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-400">{matchTime}</span>
          {locked && !match.is_finished && <span className="text-orange-400 text-xs">🔒</span>}
          {match.is_finished && <span className="text-xs text-gray-400">Finalizado</span>}
          <Link href={`/jogos/${match.id}`} className="text-xs text-green-600 hover:underline font-medium ml-1">
            Detalhes
          </Link>
        </div>
      </div>

      {/* Times + inputs */}
      <div className="flex items-center px-4 py-4 gap-3">
        <div className="flex flex-col items-center gap-1.5 flex-1">
          <FlagImage iso={match.home_iso} name={match.home_team} size={40} />
          <span className="text-xs font-semibold text-gray-800 text-center leading-tight">{match.home_team}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {match.is_finished ? (
            <div className="flex items-center gap-2">
              <span className="w-12 h-12 flex items-center justify-center text-xl font-bold text-gray-800 bg-gray-100 rounded-xl">{match.home_score}</span>
              <span className="text-gray-300 text-sm font-bold">×</span>
              <span className="w-12 h-12 flex items-center justify-center text-xl font-bold text-gray-800 bg-gray-100 rounded-xl">{match.away_score}</span>
            </div>
          ) : (
            <>
              <input type="number" inputMode="numeric" min={0} max={30}
                value={value?.home ?? ''}
                onChange={e => onChange(e.target.value, value?.away ?? '')}
                onBlur={e => !locked && onBlur(e.target.value, value?.away ?? '')}
                disabled={locked} placeholder="–"
                style={{ fontSize: '20px' }}
                className="w-12 h-12 text-center font-bold border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-300 transition" />
              <span className="text-gray-300 text-sm font-bold">×</span>
              <input type="number" inputMode="numeric" min={0} max={30}
                value={value?.away ?? ''}
                onChange={e => onChange(value?.home ?? '', e.target.value)}
                onBlur={e => !locked && onBlur(value?.home ?? '', e.target.value)}
                disabled={locked} placeholder="–"
                style={{ fontSize: '20px' }}
                className="w-12 h-12 text-center font-bold border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-300 transition" />
            </>
          )}
        </div>

        <div className="flex flex-col items-center gap-1.5 flex-1">
          <FlagImage iso={match.away_iso} name={match.away_team} size={40} />
          <span className="text-xs font-semibold text-gray-800 text-center leading-tight">{match.away_team}</span>
        </div>
      </div>

      {/* Feedback de save */}
      {!locked && (
        <div className="px-4 pb-3 flex justify-between items-center min-h-[28px]">
          {hasPred && saveState === 'idle' && (
            <span className="text-xs text-green-600 font-medium">✓ {value?.home} × {value?.away}</span>
          )}
          {!hasPred && <span />}
          <div>
            {saveState === 'saving' && <span className="text-xs text-gray-400">Salvando...</span>}
            {saveState === 'saved'  && <span className="text-xs text-green-600 font-medium">✓ Salvo!</span>}
            {saveState === 'error'  && <span className="text-xs text-red-500">Erro — tente novamente</span>}
            {saveState === 'idle' && hasPred && (
              <button onClick={onSave} className="text-xs text-gray-400 hover:text-green-600 transition">
                Salvar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
