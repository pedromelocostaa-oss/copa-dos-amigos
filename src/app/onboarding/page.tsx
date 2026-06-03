'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

type Mode = 'escolha' | 'criar' | 'entrar'

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [mode, setMode] = useState<Mode>('escolha')
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)

  const [bolaoName, setBolaoName] = useState('')
  const [entryFee, setEntryFee] = useState('')
  const [createdCode, setCreatedCode] = useState('')
  const [createdName, setCreatedName] = useState('')
  const [joinCode, setJoinCode] = useState('')

  async function handleCreate() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const code = generateCode()
      const { data: league, error } = await supabase
        .from('leagues')
        .insert({ name: bolaoName.trim(), code, owner_id: user.id })
        .select()
        .single()

      if (error || !league) throw error ?? new Error('Erro ao criar bolão')

      await supabase.from('league_members').insert({ league_id: league.id, user_id: user.id })

      setCreatedCode(code)
      setCreatedName(bolaoName.trim())
      setStep(2)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido'
      toast(`Erro ao criar bolão: ${msg}`, 'error')
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

      const { data: league } = await supabase
        .from('leagues').select('id, name').eq('code', code).single()
      if (!league) { toast('Código inválido. Verifique e tente novamente.', 'error'); return }

      const { error } = await supabase
        .from('league_members')
        .upsert({ league_id: league.id, user_id: user.id }, { onConflict: 'league_id,user_id' })

      if (error) throw error
      toast(`Entrou em "${league.name}"!`, 'success')
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast('Erro ao entrar no bolão.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://copa-dos-amigos.vercel.app'
  const inviteLink = `${origin}/entrar/${createdCode}`
  const whatsappMsg = `⚽ Entra no meu bolão da Copa do Mundo 2026!\n\n🏆 *${createdName}*\n\nAcesse o link e se cadastre:\n${inviteLink}\n\nCódigo: *${createdCode}*`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMsg)}`

  async function copyInvite() {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Bolão: ${createdName}`, text: whatsappMsg, url: inviteLink })
        return
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(whatsappMsg)
      toast('Mensagem copiada! Cole no WhatsApp ou Instagram.', 'success')
    } catch {
      toast('Copie o link manualmente: ' + inviteLink, 'info')
    }
  }

  // ── ESCOLHA ──────────────────────────────────────
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

  // ── ENTRAR COM CÓDIGO ────────────────────────────
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
          <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            maxLength={6} placeholder="AB12CD"
            className="w-full border-2 border-gray-200 focus:border-green-500 rounded-xl px-4 py-4 text-center text-3xl font-mono tracking-widest uppercase focus:outline-none transition" />
          <button onClick={handleJoin} disabled={joinCode.length < 4 || loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-40 text-lg min-h-[56px]">
            {loading ? 'Entrando...' : 'Entrar ⚽'}
          </button>
        </div>
      </div>
    )
  }

  // ── CRIAR — PASSO 1 ──────────────────────────────
  if (mode === 'criar' && step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-800 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md space-y-6">
          <button onClick={() => setMode('escolha')} className="text-gray-400 hover:text-gray-600 text-sm">← Voltar</button>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900">Criar bolão</h2>
            <p className="text-gray-500 text-sm">Dê um nome para o seu bolão</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do bolão</label>
              <input value={bolaoName} onChange={e => setBolaoName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && bolaoName.trim() && handleCreate()}
                placeholder="Ex: Galera da Firma 🏆"
                maxLength={50} autoFocus
                className="w-full border-2 border-gray-200 focus:border-green-500 rounded-xl px-4 py-3.5 focus:outline-none transition text-base" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Valor por pessoa (opcional)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
                <input type="number" value={entryFee} onChange={e => setEntryFee(e.target.value)}
                  placeholder="0" min={0}
                  className="w-full border-2 border-gray-200 focus:border-green-500 rounded-xl pl-10 pr-4 py-3.5 focus:outline-none transition text-base" />
              </div>
              <p className="text-xs text-gray-400 mt-1">Apenas referência — pagamentos confirmados manualmente.</p>
            </div>
          </div>
          <button onClick={handleCreate} disabled={!bolaoName.trim() || loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-40 text-lg min-h-[56px]">
            {loading ? 'Criando bolão...' : 'Criar bolão 🏆'}
          </button>
        </div>
      </div>
    )
  }

  // ── PASSO 2 — CONVIDAR AMIGOS ────────────────────
  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-800 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md space-y-6">
          {/* Sucesso */}
          <div className="text-center space-y-2">
            <div className="text-5xl">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900">Bolão criado!</h2>
            <p className="text-gray-500 text-sm">Agora convide seus amigos</p>
          </div>

          {/* Código */}
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 text-center">
            <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-2">Código do bolão</p>
            <p className="text-5xl font-mono font-bold tracking-widest text-green-700">{createdCode}</p>
            <p className="text-xs text-green-600 mt-2">Link: <span className="font-medium">{inviteLink}</span></p>
          </div>

          {/* Mensagem pronta */}
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Mensagem pronta para compartilhar:</p>
            <p>⚽ Entra no meu bolão da Copa do Mundo 2026!</p>
            <p className="font-bold mt-1">🏆 {createdName}</p>
            <p className="mt-1">Acesse: <span className="text-green-600 break-all">{inviteLink}</span></p>
            <p>Código: <span className="font-mono font-bold">{createdCode}</span></p>
          </div>

          {/* Botões de compartilhamento */}
          <div className="space-y-3">
            <button onClick={copyInvite}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition text-base min-h-[56px] flex items-center justify-center gap-2">
              📋 Copiar mensagem de convite
            </button>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#20bc5a] text-white font-bold py-4 rounded-xl transition text-base min-h-[56px] flex items-center justify-center gap-2">
              <span className="text-xl">📲</span> Enviar no WhatsApp
            </a>
          </div>

          {/* Próximos passos */}
          <div className="bg-blue-50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-blue-600 uppercase">Próximos passos</p>
            <div className="space-y-1.5 text-sm text-blue-800">
              <p>✅ <span className="font-medium">Feito:</span> Bolão criado</p>
              <p>⏳ <span className="font-medium">Agora:</span> Convide seus amigos</p>
              <p>💰 <span className="font-medium">Depois:</span> Confirmem o pagamento ({entryFee ? `R$${entryFee} por pessoa` : 'gratuito'})</p>
              <p>🎯 <span className="font-medium">E então:</span> Façam os palpites!</p>
            </div>
          </div>

          <button onClick={() => router.push('/dashboard')}
            className="w-full text-green-600 font-medium hover:underline text-sm py-1">
            Ir para o dashboard →
          </button>
        </div>
      </div>
    )
  }

  return null
}
