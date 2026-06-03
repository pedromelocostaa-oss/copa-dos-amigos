'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { TEAMS } from '@/lib/teams-data'
import type { BolaoScope } from '@/types'
import { useToast } from '@/components/ui/Toast'

type Mode = 'escolha' | 'criar' | 'entrar'
type Step = 1 | 2 | 3

const SCOPE_OPTIONS: { value: BolaoScope; icon: string; label: string; description: string }[] = [
  { value: 'todos',              icon: '🌍', label: 'Todos os jogos',     description: '104 jogos — fase de grupos + mata-mata' },
  { value: 'fase_grupos',        icon: '📋', label: 'Fase de grupos',     description: '72 jogos — apenas a fase de grupos' },
  { value: 'mata_mata',          icon: '⚔️',  label: 'Mata-mata',          description: '32 jogos — oitavas até a final' },
  { value: 'times_especificos',  icon: '🏳️',  label: 'Times específicos', description: 'Palpite só nos jogos de seleções escolhidas' },
  { value: 'artilheiro',         icon: '🥅', label: 'Artilheiro',         description: 'Aposte no artilheiro da Copa' },
]

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [mode, setMode] = useState<Mode>('escolha')
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)

  // Criar bolão
  const [bolaoName, setBolaoName] = useState('')
  const [entryFee, setEntryFee] = useState('')
  const [scope, setScope] = useState<BolaoScope>('todos')
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [createdCode, setCreatedCode] = useState('')
  const [createdName, setCreatedName] = useState('')

  // Entrar com código
  const [joinCode, setJoinCode] = useState('')

  async function handleCreate() {
    if (!bolaoName.trim()) return
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const code = generateCode()
      const feeInCents = Math.round(parseFloat(entryFee || '0') * 100)
      const scopeConfig = scope === 'times_especificos' ? { teams: selectedTeams } : {}

      const { data: bolao, error } = await supabase.from('boloes').insert({
        name: bolaoName.trim(),
        code,
        owner_id: user.id,
        scope,
        scope_config: scopeConfig,
        entry_fee: feeInCents,
      }).select().single()

      if (error || !bolao) throw error

      await supabase.from('bolao_members').insert({
        bolao_id: bolao.id,
        user_id: user.id,
        payment_status: 'isento',
      })
      await supabase.from('participants').update({ active_bolao_id: bolao.id }).eq('user_id', user.id)

      setCreatedCode(code)
      setCreatedName(bolaoName.trim())
      setStep(3)
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

      const { data: bolao } = await supabase.from('boloes').select('id').eq('code', code).single()
      if (!bolao) { toast('Código inválido. Verifique e tente novamente.', 'error'); return }

      await supabase.from('bolao_members').upsert(
        { bolao_id: bolao.id, user_id: user.id, payment_status: 'pendente' },
        { onConflict: 'bolao_id,user_id' }
      )
      await supabase.from('participants').update({ active_bolao_id: bolao.id }).eq('user_id', user.id)
      router.push('/dashboard')
    } catch {
      toast('Erro ao entrar no bolão.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const shareMessage = `Entra no meu bolão da Copa! 🏆 ${createdName} — acesse: ${typeof window !== 'undefined' ? window.location.origin : ''}/entrar/${createdCode}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`

  async function handleShare() {
    if (navigator.share) {
      try { await navigator.share({ title: createdName, text: shareMessage }); return } catch {}
    }
    await navigator.clipboard.writeText(shareMessage)
    toast('Link copiado!', 'success')
  }

  // ── TELA DE ESCOLHA ──────────────────────────────────────────────────
  if (mode === 'escolha') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-600 to-green-800 px-4 py-10">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center text-white space-y-2">
            <div className="text-5xl">⚽</div>
            <h1 className="text-3xl font-bold">Copa dos Amigos</h1>
            <p className="text-green-100">Crie ou entre em um bolão para começar</p>
          </div>

          <div className="space-y-3">
            <button onClick={() => setMode('criar')}
              className="w-full bg-white rounded-2xl p-5 text-left shadow-lg hover:shadow-xl transition active:scale-[0.98] min-h-[80px]">
              <div className="flex items-center gap-4">
                <span className="text-4xl">🏆</span>
                <div>
                  <p className="font-bold text-gray-900 text-lg">Criar um bolão</p>
                  <p className="text-gray-500 text-sm">Convide seus amigos com um código</p>
                </div>
              </div>
            </button>

            <button onClick={() => setMode('entrar')}
              className="w-full bg-white/10 border border-white/30 rounded-2xl p-5 text-left hover:bg-white/20 transition active:scale-[0.98] min-h-[80px]">
              <div className="flex items-center gap-4">
                <span className="text-4xl">🔑</span>
                <div>
                  <p className="font-bold text-white text-lg">Entrar com código</p>
                  <p className="text-green-100 text-sm">Já tenho o código de um amigo</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── ENTRAR COM CÓDIGO ────────────────────────────────────────────────
  if (mode === 'entrar') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-800 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md space-y-6">
          <button onClick={() => setMode('escolha')} className="text-gray-400 hover:text-gray-600 text-sm">← Voltar</button>
          <div className="text-center space-y-1">
            <div className="text-4xl">🔑</div>
            <h2 className="text-xl font-bold text-gray-900">Entrar em um bolão</h2>
            <p className="text-gray-500 text-sm">Digite o código de 6 letras</p>
          </div>
          <input
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            maxLength={6}
            placeholder="AB12CD"
            className="w-full border-2 border-gray-200 focus:border-green-500 rounded-xl px-4 py-4 text-center text-3xl font-mono tracking-widest uppercase focus:outline-none transition"
          />
          <button
            onClick={handleJoin}
            disabled={joinCode.length < 4 || loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-40 text-lg min-h-[56px]">
            {loading ? 'Entrando...' : 'Entrar ⚽'}
          </button>
        </div>
      </div>
    )
  }

  // ── CRIAR BOLÃO ── PASSO 1 (nome + valor) ────────────────────────────
  if (mode === 'criar' && step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-800 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md space-y-6">
          <button onClick={() => setMode('escolha')} className="text-gray-400 hover:text-gray-600 text-sm">← Voltar</button>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Passo 1 de 2</p>
            <h2 className="text-xl font-bold text-gray-900">Nome do bolão</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome</label>
              <input
                value={bolaoName}
                onChange={e => setBolaoName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && bolaoName.trim() && setStep(2)}
                placeholder="Ex: Galera da Firma 🏆"
                maxLength={50}
                className="w-full border-2 border-gray-200 focus:border-green-500 rounded-xl px-4 py-3.5 focus:outline-none transition text-base"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Valor por pessoa (opcional)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
                <input
                  type="number"
                  value={entryFee}
                  onChange={e => setEntryFee(e.target.value)}
                  placeholder="0"
                  min={0}
                  className="w-full border-2 border-gray-200 focus:border-green-500 rounded-xl pl-10 pr-4 py-3.5 focus:outline-none transition text-base"
                />
              </div>
              {/* TODO: integração PIX para cobrança automática */}
              <p className="text-xs text-gray-400 mt-1">Apenas referência — pagamentos confirmados manualmente pelo admin.</p>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!bolaoName.trim()}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-40 text-lg min-h-[56px]">
            Próximo →
          </button>
        </div>
      </div>
    )
  }

  // ── CRIAR BOLÃO ── PASSO 2 (escopo) ─────────────────────────────────
  if (mode === 'criar' && step === 2) {
    const allTeams = Object.keys(TEAMS).sort()
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-600 to-green-800 px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-auto space-y-5">
          <button onClick={() => setStep(1)} className="text-gray-400 hover:text-gray-600 text-sm">← Voltar</button>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Passo 2 de 2</p>
            <h2 className="text-xl font-bold text-gray-900">Escopo do bolão</h2>
            <p className="text-gray-500 text-sm">Quais jogos entram nos palpites?</p>
          </div>

          <div className="space-y-2">
            {SCOPE_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setScope(opt.value)}
                className={`w-full text-left rounded-xl p-4 border-2 transition active:scale-[0.98] ${scope === opt.value ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{opt.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{opt.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
                  </div>
                  {scope === opt.value && <span className="text-green-600 text-xl">✓</span>}
                </div>
              </button>
            ))}
          </div>

          {scope === 'times_especificos' && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Selecione as seleções:</p>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {allTeams.map(team => (
                  <button key={team}
                    onClick={() => setSelectedTeams(prev =>
                      prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]
                    )}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${selectedTeams.includes(team) ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-200'}`}>
                    {team}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={loading || (scope === 'times_especificos' && selectedTeams.length === 0)}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-40 text-lg min-h-[56px]">
            {loading ? 'Criando...' : 'Criar bolão 🏆'}
          </button>
        </div>
      </div>
    )
  }

  // ── PASSO 3 — Compartilhar ───────────────────────────────────────────
  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-800 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md space-y-6 text-center">
          <div className="space-y-2">
            <div className="text-5xl">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900">Bolão criado!</h2>
            <p className="text-gray-500 text-sm">Compartilhe o código com seus amigos</p>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5">
            <p className="text-sm text-green-700 font-medium mb-1">Código do bolão</p>
            <p className="text-5xl font-mono font-bold tracking-widest text-green-700">{createdCode}</p>
            <p className="text-xs text-green-600 mt-2">Qualquer pessoa pode entrar em <strong>/entrar/{createdCode}</strong></p>
          </div>

          <div className="flex flex-col gap-3">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#20bc5a] text-white font-bold py-3.5 rounded-xl transition text-lg min-h-[56px] flex items-center justify-center gap-2">
              📲 Compartilhar no WhatsApp
            </a>
            <button onClick={handleShare}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-xl transition">
              📋 Copiar link
            </button>
            <button onClick={() => router.push('/dashboard')}
              className="text-green-600 font-medium hover:underline text-sm py-1">
              Ir para o dashboard →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
