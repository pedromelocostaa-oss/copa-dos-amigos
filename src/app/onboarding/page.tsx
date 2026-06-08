'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

type Screen = 'inicio' | 'criar_nome' | 'criar_regras' | 'criar_compartilhar' | 'entrar_codigo'
type GameScope = 'all' | 'brazil' | 'groups' | 'knockout'
type PredictionMode = 'score' | 'winner'

interface Preset {
  id: string
  icon: string
  title: string
  subtitle: string
  badge?: string
  scope: GameScope
  mode: PredictionMode
  scoring: string
  detail: string
}

const PRESETS: Preset[] = [
  {
    id: 'completo',
    icon: '🏆',
    title: 'Copa Completa',
    subtitle: 'Todos os 104 jogos',
    badge: 'Mais popular',
    scope: 'all',
    mode: 'score',
    scoring: '10pts placar exato · 5pts vencedor certo',
    detail: 'Palpite o placar de todos os jogos da Copa 2026. Mais emocionante — cada jogo importa!'
  },
  {
    id: 'brazil',
    icon: '🇧🇷',
    title: 'Só o Brasil',
    subtitle: 'Apenas jogos da Seleção',
    scope: 'brazil',
    mode: 'score',
    scoring: '10pts placar exato · 5pts vencedor certo',
    detail: 'Palpite só quando o Brasil joga. Perfeito para grupos menores ou quem quer focar na Seleção.'
  },
  {
    id: 'simples',
    icon: '✅',
    title: 'Resultado Simples',
    subtitle: 'Todos os jogos, só quem vence',
    scope: 'all',
    mode: 'winner',
    scoring: '3pts por acerto · 0pts se errar',
    detail: 'Mais fácil — você só escolhe quem vai vencer ou se vai empatar. Sem precisar chutar placar.'
  },
  {
    id: 'grupos',
    icon: '📋',
    title: 'Fase de Grupos',
    subtitle: '48 jogos da fase inicial',
    scope: 'groups',
    mode: 'score',
    scoring: '10pts placar exato · 5pts vencedor certo',
    detail: 'Palpite só na fase de grupos (48 jogos). Ideal para quem quer um bolão mais rápido.'
  },
]

const ORIGIN = 'https://copa-dos-amigos.vercel.app'

async function generateUniqueCode(supabase: ReturnType<typeof createClient>): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data } = await supabase.from('leagues').select('id').eq('code', code).maybeSingle()
    if (!data) return code
  }
  return (Date.now().toString(36) + Math.random().toString(36).substring(2, 4)).toUpperCase().substring(0, 6)
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [screen, setScreen] = useState<Screen>('inicio')
  const [loading, setLoading] = useState(false)

  // Criar
  const [bolaoName, setBolaoName] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<string>('completo')
  const [createdCode, setCreatedCode] = useState('')

  // Entrar
  const [joinCode, setJoinCode] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)

  const origin = typeof window !== 'undefined' ? window.location.origin : ORIGIN
  const preset = PRESETS.find(p => p.id === selectedPreset) ?? PRESETS[0]

  async function handleCreate() {
    if (!bolaoName.trim() || loading) return
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login?next=/onboarding'); return }

      const code = await generateUniqueCode(supabase)

      const { data: league, error } = await supabase
        .from('leagues')
        .insert({
          name: bolaoName.trim(),
          code,
          owner_id: user.id,
          entry_fee: 0,
          game_scope: preset.scope,
          prediction_mode: preset.mode,
        })
        .select()
        .single()

      if (error || !league) throw error ?? new Error('Erro ao criar')

      await supabase.from('league_members').insert({ league_id: league.id, user_id: user.id })

      setCreatedCode(code)
      setScreen('criar_compartilhar')
    } catch {
      toast('Erro ao criar bolão. Tente novamente.', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoinRedirect() {
    const code = joinCode.trim().toUpperCase()
    if (code.length < 4 || joinLoading) return
    setJoinLoading(true)
    const { data: league } = await supabase.from('leagues').select('id').eq('code', code).maybeSingle()
    setJoinLoading(false)
    if (!league) { toast('Código inválido. Verifique e tente novamente.', 'error'); return }
    router.push(`/entrar/${code}`)
  }

  const inviteMsg = `⚽ Entra no meu bolão da Copa do Mundo 2026!\n🏆 *${bolaoName}*\n\nAcesse: ${origin}/entrar/${createdCode}\nCódigo: *${createdCode}*`
  const waUrl = `https://wa.me/?text=${encodeURIComponent(inviteMsg)}`

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteMsg)
      toast('Mensagem copiada! ✓', 'success')
    } catch {
      toast('Não foi possível copiar automaticamente.', 'error')
    }
  }

  // ── TELA INICIAL ─────────────────────────────────────────────────
  if (screen === 'inicio') {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-600 to-green-800 px-5 py-10">
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm mx-auto space-y-8">
          <div className="text-center text-white space-y-3">
            <div className="text-6xl">⚽</div>
            <h1 className="text-3xl font-bold">Copa dos Amigos</h1>
            <p className="text-green-100 text-base">Bolão da Copa do Mundo 2026</p>
          </div>

          <div className="w-full space-y-4">
            <button onClick={() => setScreen('criar_nome')}
              className="w-full bg-white rounded-2xl p-6 text-left shadow-xl hover:shadow-2xl transition active:scale-[0.98]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-3xl shrink-0">🏆</div>
                <div>
                  <p className="font-bold text-gray-900 text-xl">Criar um bolão</p>
                  <p className="text-gray-500 text-sm mt-0.5">Organize com seus amigos</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2 text-xs text-gray-400 flex-wrap">
                <span className="bg-gray-100 px-2 py-1 rounded-full">✓ Código de convite</span>
                <span className="bg-gray-100 px-2 py-1 rounded-full">✓ Ranking automático</span>
                <span className="bg-gray-100 px-2 py-1 rounded-full">✓ Grátis</span>
              </div>
            </button>

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

          {/* Como funciona */}
          <div className="w-full bg-white/10 rounded-2xl p-5 space-y-4">
            <p className="text-white font-bold text-sm text-center uppercase tracking-wide opacity-80">Como funciona</p>
            <div className="space-y-3">
              {[
                { icon: '🏆', title: 'Crie ou entre num bolão', desc: 'Em segundos, sem precisar de cartão.' },
                { icon: '✏️', title: 'Faça seus palpites', desc: 'Chute o placar de todos os jogos da Copa 2026.' },
                { icon: '⚽', title: 'Ganhe pontos', desc: '10 pts para placar exato · 5 pts para resultado certo.' },
                { icon: '🥇', title: 'Acompanhe o ranking', desc: 'Veja quem tá na frente em tempo real após cada jogo.' },
              ].map(item => (
                <div key={item.icon} className="flex items-start gap-3">
                  <span className="text-2xl shrink-0 mt-0.5">{item.icon}</span>
                  <div>
                    <p className="text-white font-semibold text-sm">{item.title}</p>
                    <p className="text-green-200 text-xs">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── CRIAR — NOME ────────────────────────────────────────────────
  if (screen === 'criar_nome') {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-600 to-green-800 px-5 py-10">
        <button onClick={() => setScreen('inicio')}
          className="text-white/70 hover:text-white text-sm mb-8 min-h-[44px] flex items-center">
          ← Voltar
        </button>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm space-y-6">
            {/* Progresso */}
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 bg-white rounded-full" />
              <div className="h-1.5 flex-1 bg-white/30 rounded-full" />
            </div>
            <div className="text-white space-y-1">
              <p className="text-green-200 text-xs font-medium uppercase tracking-wide">Passo 1 de 2</p>
              <h2 className="text-2xl font-bold">Como vai se chamar o bolão?</h2>
              <p className="text-green-100 text-sm">Escolha um nome que represente seu grupo</p>
            </div>

            <input
              value={bolaoName}
              onChange={e => setBolaoName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && bolaoName.trim() && setScreen('criar_regras')}
              placeholder="Ex: Galera da Firma 🏆"
              maxLength={50}
              autoFocus
              className="w-full bg-white/20 border-2 border-white/30 focus:border-white rounded-2xl px-5 py-4 text-white text-xl placeholder-white/40 focus:outline-none transition font-medium"
              style={{ fontSize: '16px' }}
            />

            <div className="flex gap-2 flex-wrap">
              {['Galera do Trabalho', 'Família', 'Amigos do Futebol', 'Turma da Facul'].map(s => (
                <button key={s} onClick={() => setBolaoName(s)}
                  className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-full transition min-h-[36px]">
                  {s}
                </button>
              ))}
            </div>

            <button
              onClick={() => bolaoName.trim() && setScreen('criar_regras')}
              disabled={!bolaoName.trim()}
              className="w-full bg-white text-green-700 font-bold py-4 rounded-2xl transition disabled:opacity-40 text-lg hover:bg-green-50 min-h-[56px]">
              Próximo →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── CRIAR — REGRAS ───────────────────────────────────────────────
  if (screen === 'criar_regras') {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-600 to-green-800 px-5 py-10">
        <button onClick={() => setScreen('criar_nome')}
          className="text-white/70 hover:text-white text-sm mb-6 min-h-[44px] flex items-center">
          ← Voltar
        </button>
        <div className="w-full max-w-sm mx-auto space-y-5">
          {/* Progresso */}
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 bg-white rounded-full" />
            <div className="h-1.5 flex-1 bg-white rounded-full" />
          </div>
          <div className="text-white space-y-1">
            <p className="text-green-200 text-xs font-medium uppercase tracking-wide">Passo 2 de 2</p>
            <h2 className="text-2xl font-bold">Como vai funcionar?</h2>
            <p className="text-green-100 text-sm">Escolha o tipo de bolão para <strong>{bolaoName}</strong></p>
          </div>

          {/* Cards de preset */}
          <div className="space-y-3">
            {PRESETS.map(p => {
              const isSelected = selectedPreset === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPreset(p.id)}
                  className={`w-full text-left rounded-2xl p-4 border-2 transition active:scale-[0.98] ${
                    isSelected
                      ? 'bg-white border-white shadow-xl'
                      : 'bg-white/10 border-white/20 hover:bg-white/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl shrink-0 mt-0.5">{p.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-bold text-base ${isSelected ? 'text-gray-900' : 'text-white'}`}>
                          {p.title}
                        </p>
                        {p.badge && (
                          <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                            {p.badge}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm mt-0.5 ${isSelected ? 'text-gray-500' : 'text-green-200'}`}>
                        {p.subtitle}
                      </p>
                      {isSelected && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-gray-600 leading-relaxed">{p.detail}</p>
                          <div className="inline-flex items-center gap-1 bg-green-50 border border-green-200 rounded-full px-2 py-1 mt-1">
                            <span className="text-xs font-semibold text-green-700">🎯 {p.scoring}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-1 flex items-center justify-center ${
                      isSelected ? 'bg-green-600 border-green-600' : 'border-white/50'
                    }`}>
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-white text-green-700 font-bold py-4 rounded-2xl transition disabled:opacity-40 text-lg hover:bg-green-50 min-h-[56px] shadow-xl">
            {loading ? 'Criando bolão...' : `Criar bolão ${preset.icon}`}
          </button>

          <p className="text-center text-green-200/70 text-xs">
            Grátis · Sem cadastro de cartão · Você convida quem quiser
          </p>
        </div>
      </div>
    )
  }

  // ── CRIAR — COMPARTILHAR ─────────────────────────────────────────
  if (screen === 'criar_compartilhar') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-600 to-green-800 px-5 py-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center text-white space-y-2">
            <div className="text-5xl">🎉</div>
            <h2 className="text-2xl font-bold">{bolaoName} criado!</h2>
            <p className="text-green-100">
              {preset.icon} {preset.title} · <span className="text-green-200 text-sm">{preset.scoring}</span>
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 text-center space-y-2">
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Código do bolão</p>
            <p className="text-5xl font-mono font-black tracking-widest text-green-700">{createdCode}</p>
            <p className="text-xs text-gray-400">{origin}/entrar/{createdCode}</p>
          </div>

          <div className="bg-white/15 rounded-xl p-4 text-white text-sm leading-relaxed">
            <p className="text-green-200 text-xs font-semibold mb-2 uppercase">Mensagem pronta:</p>
            <p className="whitespace-pre-line text-sm">{inviteMsg}</p>
          </div>

          <div className="space-y-3">
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#20bc5a] text-white font-bold py-4 rounded-2xl transition flex items-center justify-center gap-2 text-base min-h-[56px]">
              <span className="text-xl">📲</span> Enviar no WhatsApp
            </a>
            <button onClick={copyInvite}
              className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-3.5 rounded-2xl transition min-h-[48px]">
              📋 Copiar mensagem
            </button>
          </div>

          <div className="border-t border-white/20 pt-4 space-y-2">
            <button onClick={() => router.push(`/bolao?tab=config`)}
              className="w-full text-white/60 hover:text-white/90 text-sm transition py-2 min-h-[44px]">
              💰 Vai rolar vaquinha? Definir valor →
            </button>
            <button onClick={() => router.push('/palpites')}
              className="w-full text-white font-semibold py-2 min-h-[44px] text-sm">
              Fazer meus palpites →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── ENTRAR — CÓDIGO ───────────────────────────────────────────────
  if (screen === 'entrar_codigo') {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-600 to-green-800 px-5 py-10">
        <button onClick={() => setScreen('inicio')}
          className="text-white/70 hover:text-white text-sm mb-8 min-h-[44px] flex items-center">
          ← Voltar
        </button>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm space-y-6">
            <div className="text-white space-y-2">
              <div className="text-4xl">🔑</div>
              <h2 className="text-2xl font-bold">Digite o código</h2>
              <p className="text-green-100 text-sm">
                O código tem 6 letras ou números. Peça para quem criou o bolão.
              </p>
            </div>

            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoinRedirect()}
              maxLength={6}
              placeholder="AB12CD"
              autoFocus
              style={{ fontSize: '16px' }}
              className="w-full bg-white rounded-2xl px-5 py-5 text-center text-4xl font-mono font-black tracking-widest text-green-700 focus:outline-none focus:ring-4 focus:ring-white/50 transition"
            />

            <button
              onClick={handleJoinRedirect}
              disabled={joinCode.length < 4 || joinLoading}
              className="w-full bg-white text-green-700 font-bold py-4 rounded-2xl transition disabled:opacity-40 text-lg hover:bg-green-50 min-h-[56px]">
              {joinLoading ? 'Verificando...' : 'Ver bolão ⚽'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
