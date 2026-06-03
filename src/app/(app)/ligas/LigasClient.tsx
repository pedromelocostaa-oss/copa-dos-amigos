'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface League {
  id: string
  name: string
  code: string
  owner_id: string
  created_at: string
  member_count: number
}

interface RankingEntry {
  user_id: string
  name: string
  total_points: number
  exact_scores: number
  correct_results: number
}

interface Props {
  leagues: League[]
  myLeagueIds: string[]
  userId: string
}

export default function LigasClient({ leagues, myLeagueIds, userId }: Props) {
  const supabase = createClient()
  const [tab, setTab] = useState<'minhas' | 'criar' | 'entrar'>('minhas')
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [myLeagues, setMyLeagues] = useState<League[]>(leagues.filter(l => myLeagueIds.includes(l.id)))
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null)
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [loadingRanking, setLoadingRanking] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  async function loadRanking(league: League) {
    setSelectedLeague(league)
    setLoadingRanking(true)
    const { data } = await supabase
      .from('league_ranking')
      .select('*')
      .eq('league_id', league.id)
      .order('total_points', { ascending: false })
    setRanking(data ?? [])
    setLoadingRanking(false)
  }

  async function createLeague() {
    if (!name.trim()) return
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data, error } = await supabase.from('leagues').insert({ name: name.trim(), code, owner_id: userId }).select().single()
    if (error || !data) { setMsg({ text: 'Erro ao criar liga.', ok: false }); return }
    await supabase.from('league_members').insert({ league_id: data.id, user_id: userId })
    const newLeague = { ...data, member_count: 1 }
    setMyLeagues(prev => [newLeague, ...prev])
    setMsg({ text: `Liga "${name}" criada! Código: ${code}`, ok: true })
    setName('')
    setTab('minhas')
    setTimeout(() => setMsg(null), 5000)
  }

  async function joinLeague() {
    if (!joinCode.trim()) return
    const { data: league, error } = await supabase.from('leagues').select('*').eq('code', joinCode.trim().toUpperCase()).single()
    if (error || !league) { setMsg({ text: 'Código inválido. Verifique e tente novamente.', ok: false }); return }
    if (myLeagues.some(l => l.id === league.id)) { setMsg({ text: 'Você já está nessa liga!', ok: false }); return }
    await supabase.from('league_members').upsert({ league_id: league.id, user_id: userId })
    setMyLeagues(prev => [...prev, { ...league, member_count: 0 }])
    setMsg({ text: `Entrou na liga "${league.name}"!`, ok: true })
    setJoinCode('')
    setTab('minhas')
    setTimeout(() => setMsg(null), 4000)
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const medal = (i: number) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">⚽ Ligas Privadas</h1>
      <p className="text-gray-500 text-sm">Crie um grupo com seus amigos, compartilhe o código e dispute um ranking separado.</p>

      {msg && (
        <div className={`rounded-xl px-4 py-3 text-sm border ${msg.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {msg.text}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {(['minhas', 'criar', 'entrar'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setSelectedLeague(null) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t ? 'bg-green-600 text-white' : 'bg-white border text-gray-700 hover:bg-gray-50'}`}>
            {t === 'minhas' ? `Minhas Ligas (${myLeagues.length})` : t === 'criar' ? '+ Criar Liga' : '🔑 Entrar com Código'}
          </button>
        ))}
      </div>

      {tab === 'minhas' && !selectedLeague && (
        <div className="space-y-3">
          {!myLeagues.length ? (
            <div className="bg-white rounded-xl border p-10 text-center text-gray-400">
              <p className="text-4xl mb-3">⚽</p>
              <p className="font-medium">Você não está em nenhuma liga ainda.</p>
              <p className="text-sm mt-1">Crie uma ou entre com o código de um amigo.</p>
            </div>
          ) : myLeagues.map(league => (
            <div key={league.id} className="bg-white rounded-xl border shadow-sm p-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">{league.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">{league.code}</span>
                  <button onClick={() => copyCode(league.code)}
                    className="text-xs text-gray-400 hover:text-gray-600 transition">
                    {copied === league.code ? '✓ Copiado!' : 'copiar'}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">{league.member_count} membros</span>
                <button onClick={() => loadRanking(league)}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition">
                  Ver ranking →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'minhas' && selectedLeague && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedLeague(null)} className="text-green-600 hover:underline text-sm">← Voltar</button>
            <h2 className="font-semibold text-gray-900">{selectedLeague.name}</h2>
            <div className="flex items-center gap-2 ml-auto">
              <span className="font-mono text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">{selectedLeague.code}</span>
              <button onClick={() => copyCode(selectedLeague.code)} className="text-xs text-gray-400 hover:text-gray-600">
                {copied === selectedLeague.code ? '✓ Copiado!' : 'copiar código'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            {loadingRanking ? (
              <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Participante</th>
                    <th className="px-4 py-3 text-center">Pontos</th>
                    <th className="px-4 py-3 text-center hidden sm:table-cell">Exatos</th>
                  </tr>
                </thead>
                <tbody>
                  {!ranking.length ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Nenhum palpite ainda.</td></tr>
                  ) : ranking.map((entry, i) => (
                    <tr key={entry.user_id} className={`border-t border-gray-50 ${entry.user_id === userId ? 'bg-green-50' : ''}`}>
                      <td className="px-4 py-3 text-lg">{medal(i)}</td>
                      <td className="px-4 py-3 font-medium">
                        {entry.name} {entry.user_id === userId && <span className="text-xs text-green-600">(você)</span>}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-green-700">{entry.total_points}</td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">{entry.exact_scores}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === 'criar' && (
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4 max-w-md">
          <h2 className="font-semibold text-gray-900">Criar nova liga</h2>
          <p className="text-sm text-gray-500">Um código único será gerado automaticamente para você compartilhar com os amigos.</p>
          <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createLeague()}
            placeholder="Nome da liga (ex: Galera da Firma)"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500" />
          <button onClick={createLeague} disabled={!name.trim()}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-40">
            Criar Liga
          </button>
        </div>
      )}

      {tab === 'entrar' && (
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4 max-w-md">
          <h2 className="font-semibold text-gray-900">Entrar em uma liga</h2>
          <p className="text-sm text-gray-500">Peça o código para quem criou a liga e cole aqui.</p>
          <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && joinLeague()}
            placeholder="Ex: AB12CD" maxLength={6}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 uppercase font-mono text-lg tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-green-500" />
          <button onClick={joinLeague} disabled={joinCode.length < 4}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-40">
            Entrar na Liga
          </button>
        </div>
      )}
    </div>
  )
}
