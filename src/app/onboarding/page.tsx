'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { TEAMS } from '@/lib/teams-data'

type Screen = 'inicio' | 'criar_nome' | 'criar_valor' | 'criar_compartilhar' | 'entrar_codigo' | 'entrar_torcida'

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

const POPULAR_TEAMS = [
  'Brasil', 'Argentina', 'Portugal', 'França', 'Espanha',
  'Alemanha', 'Inglaterra', 'Países Baixos', 'Itália', 'Uruguai',
  'Colômbia', 'México', 'Estados Unidos', 'Japão', 'Marrocos',
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [screen, setScreen] = useState<Screen>('inicio')
  const [loading, setLoading] = useState(false)

  // Criar
  const [bolaoName, setBolaoName] = useState('')
  const [entryFee, setEntryFee] = useState('')
  const [createdCode, setCreatedCode] = useState('')
  const [createdName, setCreatedName] = useState('')

  // Entrar
  const [joinCode, setJoinCode] = useState('')
  const [joinedLeagueName, setJoinedLeagueName] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://copa-dos-amigos.vercel.app'

  async function handleCreate() {
    if (!bolaoName.trim()) return
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const code = generateCode()
      // entry_fee em centavos (ex: R$20 → 2000)
      const feeInCents = Math.round(parseFloat(entryFee || '0') * 100)

      const { data: league, error } = await supabase
        .from('leagues')
        .insert({ name: bolaoName.trim(), code, owner_id: user.id, entry_fee: feeInCents })
        .select().single()

      if (error || !league) throw error ?? new Error('Erro ao criar')

      await supabase.from('league_members').insert({ league_id: league.id, user_id: user.id })

      setCreatedCode(code)
      setCreatedName(bolaoName.trim())
      setScreen('criar_compartilhar')
    } catch {
      toast('Erro ao criar bolão. Tente novamente.', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase()
    if (code.length < 4) return
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: league } = await supabase.from('leagues').select('id,name').eq('code', code).single()
      if (!league) { toast('Código inválido. Verifique e tente novamente.', 'error'); setLoading(false); return }

      await supabase.from('league_members').upsert(
        { league_id: league.id, user_id: user.id },
        { onConflict: 'league_id,user_id' }
      )
      setJoinedLeagueName(league.name)
      setScreen('entrar_torcida')
    } catch {
      toast('Erro ao entrar no bolão.', 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleTeamSelect(team: string) {
    setSelectedTeam(team)
    if (typeof window !== 'undefined') {
      localStorage.setItem('copa-torcida', team)
    }
  }

  function goToPalpites() {
    router.push('/palpites')
    router.refresh()
  }

  function goToDashboard() {
    router.push('/dashboard')
    router.refresh()
  }

  const inviteMsg = `⚽ Entra no meu bolão da Copa do Mundo 2026!\n🏆 *${createdName}*\n\nAcesse: ${origin}/entrar/${createdCode}\nCódigo: *${createdCode}*`
  const waUrl = `https://wa.me/?text=${encodeURIComponent(inviteMsg)}`

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteMsg)
      toast('Mensagem copiada!', 'success')
    } catch {
      toast('Não foi possível copiar automaticamente.', 'error')
    }
  }

  // ── TELA INICIAL ─────────────────────────────────────────────────────
  if (screen === 'inicio') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-600 to-green-800 px-5 py-10">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center text-white space-y-3">
            <div className="text-6xl">⚽</div>
            <h1 className="text-3xl font-bold">Copa dos Amigos</h1>
            <p className="text-green-100 text-base">Bolão da Copa do Mundo 2026</p>
          </div>

          <div className="space-y-4">
            {/* CRIAR */}
            <button onClick={() => setScreen('criar_nome')}
              className="w-full bg-white rounded-2xl p-6 text-left shadow-xl hover:shadow-2xl transition active:scale-[0.98]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-3xl shrink-0">🏆</div>
                <div>
                  <p className="font-bold text-gray-900 text-xl">Criar um bolão</p>
                  <p className="text-gray-500 text-sm mt-0.5">Organize com seus amigos</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2 text-xs text-gray-400">
                <span className="bg-gray-100 px-2 py-1 rounded-full">✓ Código de convite</span>
                <span className="bg-gray-100 px-2 py-1 rounded-full">✓ Ranking automático</span>
              </div>
            </button>

            {/* ENTRAR */}
            <button onClick={() => setScreen('entrar_codigo')}
              className="w-full bg-white/15 border-2 border-white/40 rounded-2xl p-6 text-left hover:bg-white/25 transition active:scale-[0.98]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl shrink-0">🔑</div>
                <div>
                  <p className="font-bold text-white text-xl">Entrar com código</p>
                  <p className="text-green-100 text-sm mt-0.5">Já tenho o código de um amigo</p>
                </div>
              </div>
            </button>
          </div>

          <p className="text-center text-green-200 text-xs">
            Não sabe como funciona?{' '}
            <button onClick={() => router.push('/como-funciona')} className="underline font-medium">
              Saiba mais →
            </button>
          </p>
        </div>
      </div>
    )
  }

  // ── CRIAR — NOME ─────────────────────────────────────────────────────
  if (screen === 'criar_nome') {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-600 to-green-800 px-5 py-10">
        <button onClick={() => setScreen('inicio')} className="text-white/70 hover:text-white text-sm mb-8">← Voltar</button>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm space-y-6">
            <div className="text-white space-y-2">
              <p className="text-green-200 text-sm font-medium">PASSO 1 DE 2</p>
              <h2 className="text-2xl font-bold">Como vai se chamar o bolão?</h2>
              <p className="text-green-100 text-sm">Escolha um nome que represente seu grupo</p>
            </div>

            <input
              value={bolaoName}
              onChange={e => setBolaoName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && bolaoName.trim() && setScreen('criar_valor')}
              placeholder="Ex: Galera da Firma 🏆"
              maxLength={50}
              autoFocus
              className="w-full bg-white/20 border-2 border-white/30 focus:border-white rounded-2xl px-5 py-4 text-white text-xl placeholder-white/40 focus:outline-none transition font-medium"
            />

            <div className="flex gap-2 flex-wrap">
              {['Galera do Trabalho', 'Família', 'Amigos do Futebol', 'Turma da Facul'].map(s => (
                <button key={s} onClick={() => setBolaoName(s)}
                  className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-full transition">
                  {s}
                </button>
              ))}
            </div>

            <button
              onClick={() => setScreen('criar_valor')}
              disabled={!bolaoName.trim()}
              className="w-full bg-white text-green-700 font-bold py-4 rounded-2xl transition disabled:opacity-40 text-lg hover:bg-green-50">
              Próximo →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── CRIAR — VALOR ────────────────────────────────────────────────────
  if (screen === 'criar_valor') {
    const presets = [10, 20, 30, 50]
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-600 to-green-800 px-5 py-10">
        <button onClick={() => setScreen('criar_nome')} className="text-white/70 hover:text-white text-sm mb-8">← Voltar</button>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm space-y-6">
            <div className="text-white space-y-2">
              <p className="text-green-200 text-sm font-medium">PASSO 2 DE 2</p>
              <h2 className="text-2xl font-bold">Qual o valor da entrada?</h2>
              <p className="text-green-100 text-sm">Quanto cada pessoa vai pagar para participar</p>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {presets.map(v => (
                <button key={v}
                  onClick={() => setEntryFee(String(v))}
                  className={`py-3 rounded-xl font-bold text-sm transition ${entryFee === String(v) ? 'bg-white text-green-700' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                  R${v}
                </button>
              ))}
            </div>

            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/70 font-bold text-lg">R$</span>
              <input
                type="number"
                value={entryFee}
                onChange={e => setEntryFee(e.target.value)}
                placeholder="Outro valor"
                min={0}
                className="w-full bg-white/20 border-2 border-white/30 focus:border-white rounded-2xl pl-12 pr-5 py-4 text-white text-xl placeholder-white/40 focus:outline-none transition"
              />
            </div>

            <button
              onClick={() => setEntryFee('0')}
              className="w-full text-white/60 hover:text-white text-sm transition py-1">
              Sem cobrança (gratuito)
            </button>

            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full bg-white text-green-700 font-bold py-4 rounded-2xl transition disabled:opacity-40 text-lg hover:bg-green-50">
              {loading ? 'Criando bolão...' : 'Criar bolão 🏆'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── CRIAR — COMPARTILHAR ─────────────────────────────────────────────
  if (screen === 'criar_compartilhar') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-600 to-green-800 px-5 py-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center text-white space-y-2">
            <div className="text-5xl">🎉</div>
            <h2 className="text-2xl font-bold">{createdName} criado!</h2>
            <p className="text-green-100">Agora convide seus amigos</p>
          </div>

          {/* Código */}
          <div className="bg-white rounded-2xl p-5 text-center space-y-2">
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Código do bolão</p>
            <p className="text-5xl font-mono font-black tracking-widest text-green-700">{createdCode}</p>
            <p className="text-xs text-gray-400">{origin}/entrar/{createdCode}</p>
          </div>

          {/* Mensagem pronta */}
          <div className="bg-white/15 rounded-xl p-4 text-white text-sm leading-relaxed">
            <p className="text-green-200 text-xs font-semibold mb-2 uppercase">Mensagem pronta:</p>
            <p className="whitespace-pre-line text-sm">{inviteMsg}</p>
          </div>

          <div className="space-y-3">
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#20bc5a] text-white font-bold py-4 rounded-2xl transition flex items-center justify-center gap-2 text-base">
              <span className="text-xl">📲</span> Enviar no WhatsApp
            </a>
            <button onClick={copyInvite}
              className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-3.5 rounded-2xl transition">
              📋 Copiar mensagem
            </button>
            <button onClick={goToPalpites}
              className="w-full text-white/70 hover:text-white text-sm transition py-1">
              Fazer meus palpites →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── ENTRAR — CÓDIGO ──────────────────────────────────────────────────
  if (screen === 'entrar_codigo') {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-600 to-green-800 px-5 py-10">
        <button onClick={() => setScreen('inicio')} className="text-white/70 hover:text-white text-sm mb-8">← Voltar</button>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm space-y-6">
            <div className="text-white space-y-2">
              <div className="text-4xl">🔑</div>
              <h2 className="text-2xl font-bold">Digite o código</h2>
              <p className="text-green-100 text-sm">O código tem 6 letras ou números. Peça para quem criou o bolão.</p>
            </div>

            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              maxLength={6}
              placeholder="AB12CD"
              autoFocus
              className="w-full bg-white rounded-2xl px-5 py-5 text-center text-4xl font-mono font-black tracking-widest text-green-700 focus:outline-none focus:ring-4 focus:ring-white/50 transition"
            />

            <button
              onClick={handleJoin}
              disabled={joinCode.length < 4 || loading}
              className="w-full bg-white text-green-700 font-bold py-4 rounded-2xl transition disabled:opacity-40 text-lg hover:bg-green-50">
              {loading ? 'Entrando...' : 'Entrar no bolão ⚽'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── ENTRAR — TORCIDA (GANA) ──────────────────────────────────────────
  if (screen === 'entrar_torcida') {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-600 to-green-800 px-5 py-10">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm space-y-6">
            <div className="text-center text-white space-y-2">
              <div className="text-4xl">🎉</div>
              <h2 className="text-2xl font-bold">Entrou em {joinedLeagueName}!</h2>
              <p className="text-green-100">Agora, qual é a sua torcida?</p>
            </div>

            <div className="bg-white/15 rounded-2xl p-4 space-y-3">
              <p className="text-white/70 text-xs uppercase font-semibold">Sua seleção favorita</p>
              <div className="grid grid-cols-3 gap-2">
                {POPULAR_TEAMS.map(team => {
                  const data = TEAMS[team]
                  return (
                    <button key={team} onClick={() => handleTeamSelect(team)}
                      className={`py-3 px-2 rounded-xl text-sm font-medium transition flex flex-col items-center gap-1 ${selectedTeam === team ? 'bg-white text-green-700 shadow-lg scale-105' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                      <span className="text-lg">{data ? '🏳️' : '⚽'}</span>
                      <span className="text-xs leading-tight text-center">{team}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={goToPalpites}
                disabled={!selectedTeam}
                className="w-full bg-white text-green-700 font-bold py-4 rounded-2xl transition disabled:opacity-50 text-lg hover:bg-green-50">
                Fazer meus palpites ✏️
              </button>
              <button onClick={goToDashboard}
                className="w-full text-white/60 hover:text-white text-sm transition py-1">
                Pular por agora →
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
