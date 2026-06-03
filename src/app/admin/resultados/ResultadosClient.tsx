'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Match } from '@/types'
import FlagImage from '@/components/ui/FlagImage'
import { useToast } from '@/components/ui/Toast'

type Filter = 'pendentes' | 'hoje' | 'todos'

function matchesFilter(m: Match, filter: Filter, search: string): boolean {
  const q = search.toLowerCase()
  if (q && !m.home_team.toLowerCase().includes(q) && !m.away_team.toLowerCase().includes(q)) return false

  const matchDate = new Date(m.match_date)
  const today = new Date()
  const isToday = matchDate.toDateString() === today.toDateString()

  if (filter === 'hoje')      return isToday
  if (filter === 'pendentes') return !m.is_finished
  return true
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
  })
}

export default function ResultadosClient({ matches: initial }: { matches: Match[] }) {
  const supabase = createClient()
  const { toast } = useToast()
  const [matches, setMatches] = useState(initial)
  const [scores, setScores]   = useState<Record<string, { home: string; away: string }>>({})
  const [editing, setEditing] = useState<Set<string>>(new Set())  // IDs em modo edição
  const [saving,  setSaving]  = useState<string | null>(null)
  const [filter,  setFilter]  = useState<Filter>('pendentes')
  const [search,  setSearch]  = useState('')
  const [confirm, setConfirm] = useState<string | null>(null)  // ID aguardando confirmação

  const filtered = useMemo(() =>
    matches.filter(m => matchesFilter(m, filter, search))
      .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
  , [matches, filter, search])

  // Pendentes hoje para badge
  const todayPending = matches.filter(m => {
    const d = new Date(m.match_date)
    return d.toDateString() === new Date().toDateString() && !m.is_finished
  }).length

  function startEdit(match: Match) {
    setScores(s => ({
      ...s,
      [match.id]: {
        home: String(match.home_score ?? ''),
        away: String(match.away_score ?? ''),
      },
    }))
    setEditing(e => new Set([...e, match.id]))
  }

  function cancelEdit(matchId: string) {
    setEditing(e => { const n = new Set(e); n.delete(matchId); return n })
    setConfirm(null)
  }

  async function doSave(matchId: string) {
    const s = scores[matchId]
    if (!s || s.home === '' || s.away === '') {
      toast('Preencha os dois placares antes de salvar.', 'error')
      return
    }
    setConfirm(null)
    setSaving(matchId)

    const { error } = await supabase.from('matches').update({
      home_score: parseInt(s.home),
      away_score: parseInt(s.away),
      is_finished: true,
    }).eq('id', matchId)

    setSaving(null)
    if (error) {
      toast('Erro ao salvar resultado. Tente novamente.', 'error')
      return
    }

    setMatches(prev => prev.map(m => m.id === matchId
      ? { ...m, home_score: parseInt(s.home), away_score: parseInt(s.away), is_finished: true }
      : m
    ))
    setEditing(e => { const n = new Set(e); n.delete(matchId); return n })
    toast('Resultado salvo! Pontos recalculados.', 'success')
  }

  function requestSave(matchId: string) {
    const s = scores[matchId]
    if (!s || s.home === '' || s.away === '') {
      toast('Preencha os dois placares.', 'error')
      return
    }
    setConfirm(matchId)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">⚽ Resultados</h1>
          <p className="text-sm text-gray-500">{filtered.length} jogos exibidos</p>
        </div>
        {todayPending > 0 && (
          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-full border border-orange-200">
            ⚡ {todayPending} pendente{todayPending > 1 ? 's' : ''} hoje
          </span>
        )}
      </div>

      {/* Filtros */}
      <div className="space-y-2">
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {(['pendentes', 'hoje', 'todos'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold capitalize transition min-h-[44px] ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              {f === 'pendentes' ? '⏳ Pendentes' : f === 'hoje' ? '📅 Hoje' : '📋 Todos'}
            </button>
          ))}
        </div>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Buscar por seleção..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Lista de jogos */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border p-10 text-center text-gray-400">
          <p className="text-3xl mb-2">✅</p>
          <p className="font-medium">Nenhum jogo neste filtro.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(match => {
            const isEditing = editing.has(match.id)
            const isConfirm = confirm === match.id
            const isSaving  = saving === match.id
            const s = scores[match.id]

            return (
              <div key={match.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${match.is_finished && !isEditing ? 'opacity-80' : ''}`}>

                {/* Metadados */}
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100 gap-2 text-xs text-gray-500">
                  <span>{match.stage}{match.group_name ? ` · Grupo ${match.group_name}` : ''}</span>
                  <span>{formatDate(match.match_date)}</span>
                </div>

                {/* Times + placar — layout empilhado no mobile */}
                <div className="p-4 space-y-3">
                  {/* Times */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FlagImage iso={match.home_iso} name={match.home_team} size={28} />
                      <span className="font-semibold text-sm truncate">{match.home_team}</span>
                    </div>
                    <span className="text-gray-300 font-bold shrink-0">×</span>
                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                      <span className="font-semibold text-sm truncate text-right">{match.away_team}</span>
                      <FlagImage iso={match.away_iso} name={match.away_team} size={28} />
                    </div>
                  </div>

                  {/* Placar / inputs */}
                  {(match.is_finished && !isEditing) ? (
                    /* Resultado finalizado — mostra + botão corrigir */
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-black text-gray-800">
                          {match.home_score} × {match.away_score}
                        </span>
                        <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">
                          ✓ Finalizado
                        </span>
                      </div>
                      <button
                        onClick={() => startEdit(match)}
                        className="text-xs text-orange-600 font-semibold border border-orange-200 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition min-h-[36px]"
                      >
                        ✏️ Corrigir
                      </button>
                    </div>
                  ) : (
                    /* Inputs de placar */
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number" inputMode="numeric" min={0} max={30}
                          placeholder="0"
                          value={s?.home ?? ''}
                          onChange={e => setScores(sc => ({ ...sc, [match.id]: { home: e.target.value, away: sc[match.id]?.away ?? '' } }))}
                          className="flex-1 text-center border-2 border-gray-200 focus:border-green-500 rounded-xl py-3 text-2xl font-bold focus:outline-none transition"
                        />
                        <span className="text-gray-300 font-bold text-xl shrink-0">×</span>
                        <input
                          type="number" inputMode="numeric" min={0} max={30}
                          placeholder="0"
                          value={s?.away ?? ''}
                          onChange={e => setScores(sc => ({ ...sc, [match.id]: { home: sc[match.id]?.home ?? '', away: e.target.value } }))}
                          className="flex-1 text-center border-2 border-gray-200 focus:border-green-500 rounded-xl py-3 text-2xl font-bold focus:outline-none transition"
                        />
                      </div>

                      {/* Confirmação inline */}
                      {isConfirm ? (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 space-y-2">
                          <p className="text-sm font-semibold text-orange-800 text-center">
                            {match.is_finished
                              ? `⚠️ Confirmar correção: ${s?.home} × ${s?.away}? Os pontos serão recalculados.`
                              : `Salvar ${s?.home} × ${s?.away}?`}
                          </p>
                          <div className="flex gap-2">
                            <button onClick={() => setConfirm(null)}
                              className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition min-h-[44px]">
                              Cancelar
                            </button>
                            <button onClick={() => doSave(match.id)} disabled={isSaving}
                              className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition disabled:opacity-50 min-h-[44px]">
                              {isSaving ? 'Salvando...' : 'Confirmar ✓'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          {isEditing && (
                            <button onClick={() => cancelEdit(match.id)}
                              className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition min-h-[48px]">
                              Cancelar
                            </button>
                          )}
                          <button
                            onClick={() => requestSave(match.id)}
                            disabled={isSaving}
                            className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition disabled:opacity-50 min-h-[48px]">
                            {isSaving ? 'Salvando...' : match.is_finished ? '💾 Salvar correção' : '✓ Salvar resultado'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
