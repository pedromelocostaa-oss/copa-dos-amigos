'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { League } from '@/types'

interface Props {
  leagues: (League & { league_members: { count: number }[] })[]
  myLeagueIds: Set<string>
  userId: string
}

export default function LigasClient({ leagues, myLeagueIds, userId }: Props) {
  const supabase = createClient()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [tab, setTab] = useState<'minhas' | 'criar' | 'entrar'>('minhas')
  const [msg, setMsg] = useState('')

  async function createLeague() {
    if (!name) return
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data, error } = await supabase
      .from('leagues')
      .insert({ name, code: newCode, owner_id: userId })
      .select()
      .single()
    if (!error && data) {
      await supabase.from('league_members').insert({ league_id: data.id, user_id: userId })
      setMsg(`Liga "${name}" criada! Código: ${newCode}`)
      setName('')
      setTab('minhas')
    }
  }

  async function joinLeague() {
    if (!joinCode) return
    const { data: league } = await supabase
      .from('leagues')
      .select('*')
      .eq('code', joinCode.toUpperCase())
      .single()
    if (!league) { setMsg('Código inválido.'); return }
    await supabase.from('league_members').upsert({ league_id: league.id, user_id: userId })
    setMsg(`Entrou na liga "${league.name}"!`)
    setJoinCode('')
    setTab('minhas')
  }

  const myLeagues = leagues.filter(l => myLeagueIds.has(l.id))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">⚽ Ligas Privadas</h1>

      {msg && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-sm">
          {msg}
        </div>
      )}

      <div className="flex gap-2">
        {(['minhas', 'criar', 'entrar'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${tab === t ? 'bg-green-600 text-white' : 'bg-white border text-gray-700 hover:bg-gray-50'}`}
          >
            {t === 'minhas' ? 'Minhas Ligas' : t === 'criar' ? 'Criar Liga' : 'Entrar com Código'}
          </button>
        ))}
      </div>

      {tab === 'minhas' && (
        <div className="space-y-3">
          {!myLeagues.length ? (
            <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
              Você não está em nenhuma liga ainda.
            </div>
          ) : (
            myLeagues.map(league => (
              <div key={league.id} className="bg-white rounded-xl border shadow-sm p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{league.name}</p>
                  <p className="text-sm text-gray-400">Código: <span className="font-mono font-bold text-green-600">{league.code}</span></p>
                </div>
                <span className="text-sm text-gray-500">{league.league_members?.[0]?.count ?? 0} membros</span>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'criar' && (
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Criar nova liga</h2>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nome da liga (ex: Família Silva)"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={createLeague}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition"
          >
            Criar Liga
          </button>
        </div>
      )}

      {tab === 'entrar' && (
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Entrar com código</h2>
          <input
            value={joinCode}
            onChange={e => setJoinCode(e.target.value)}
            placeholder="Código da liga (ex: ABC123)"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={joinLeague}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition"
          >
            Entrar na Liga
          </button>
        </div>
      )}
    </div>
  )
}
