'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import FlagImage from '@/components/ui/FlagImage'

interface Match {
  id: string
  home_team: string
  away_team: string
  home_iso: string
  away_iso: string
  match_date: string
  is_finished: boolean
  group_name: string
  home_score: number
  away_score: number
}

interface Goal {
  id: string
  match_id: string
  player_name: string
  team: string
  team_iso: string
  minute: number
  is_own_goal: boolean
}

export default function GolsClient({ matches, goals: initialGoals }: { matches: Match[]; goals: Goal[] }) {
  const supabase = createClient()
  const [goals, setGoals] = useState(initialGoals)
  const [selectedMatch, setSelectedMatch] = useState<string>('')
  const [player, setPlayer] = useState('')
  const [team, setTeam] = useState('')
  const [teamIso, setTeamIso] = useState('')
  const [minute, setMinute] = useState('')
  const [isOwnGoal, setIsOwnGoal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const match = matches.find(m => m.id === selectedMatch)

  function selectTeam(t: string, iso: string) {
    setTeam(t)
    setTeamIso(iso)
  }

  async function addGoal() {
    if (!selectedMatch || !player || !team) return
    setSaving(true)
    const { data, error } = await supabase.from('goals').insert({
      match_id: selectedMatch,
      player_name: player.trim(),
      team,
      team_iso: teamIso,
      minute: minute ? parseInt(minute) : null,
      is_own_goal: isOwnGoal,
    }).select().single()

    if (!error && data) {
      setGoals(prev => [data, ...prev])
      setPlayer('')
      setMinute('')
      setIsOwnGoal(false)
      setMsg('Gol registrado!')
      setTimeout(() => setMsg(''), 2000)
    }
    setSaving(false)
  }

  async function deleteGoal(id: string) {
    await supabase.from('goals').delete().eq('id', id)
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  const matchGoals = goals.filter(g => g.match_id === selectedMatch)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">⚽ Registrar Gols</h1>

      <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Jogo</label>
          <select value={selectedMatch} onChange={e => setSelectedMatch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Selecione o jogo...</option>
            {matches.map(m => (
              <option key={m.id} value={m.id}>
                {m.home_team} {m.home_score} × {m.away_score} {m.away_team} ({new Date(m.match_date).toLocaleDateString('pt-BR')})
              </option>
            ))}
          </select>
        </div>

        {match && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Seleção</label>
              <div className="flex gap-3">
                {[
                  { name: match.home_team, iso: match.home_iso },
                  { name: match.away_team, iso: match.away_iso },
                ].map(t => (
                  <button key={t.name} onClick={() => selectTeam(t.name, t.iso)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-sm font-medium transition ${team === t.name ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-gray-300'}`}>
                    <FlagImage iso={t.iso} name={t.name} size={20} />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jogador</label>
                <input value={player} onChange={e => setPlayer(e.target.value)}
                  placeholder="Nome do jogador"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minuto</label>
                <input type="number" value={minute} onChange={e => setMinute(e.target.value)}
                  placeholder="Ex: 45"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={isOwnGoal} onChange={e => setIsOwnGoal(e.target.checked)} className="rounded" />
              Gol contra
            </label>

            {msg && <p className="text-green-600 text-sm">{msg}</p>}

            <button onClick={addGoal} disabled={saving || !player || !team}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-40">
              {saving ? 'Salvando...' : '+ Registrar gol'}
            </button>
          </>
        )}
      </div>

      {selectedMatch && matchGoals.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 font-medium text-sm text-gray-700">
            Gols registrados nesse jogo
          </div>
          {matchGoals.map(g => (
            <div key={g.id} className="flex items-center gap-3 px-4 py-2.5 border-t border-gray-50 text-sm">
              <span className="text-gray-400 w-10">{g.minute ? `${g.minute}'` : '—'}</span>
              <FlagImage iso={g.team_iso} name={g.team} size={20} />
              <span className="flex-1 font-medium">{g.player_name}</span>
              {g.is_own_goal && <span className="text-red-500 text-xs">contra</span>}
              <button onClick={() => deleteGoal(g.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
