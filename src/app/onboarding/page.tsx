'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import FlagImage from '@/components/ui/FlagImage'

type Screen = 'inicio' | 'criar_nome' | 'criar_regras' | 'criar_compartilhar' | 'entrar_codigo'
type RulesStep = 'escopo' | 'modo' | 'resumo'
type GameScope = 'all' | 'brazil' | 'groups' | 'knockout' | 'team' | 'match'
type PredictionMode = 'score' | 'winner'

interface MatchOption { id: string; home_team: string; away_team: string; home_iso: string; away_iso: string; match_date: string; stage: string; group_name?: string }

const TEAMS_2026: { name: string; iso: string }[] = [
  { name: 'Brasil', iso: 'br' }, { name: 'Argentina', iso: 'ar' }, { name: 'França', iso: 'fr' },
  { name: 'Inglaterra', iso: 'gb-eng' }, { name: 'Espanha', iso: 'es' }, { name: 'Alemanha', iso: 'de' },
  { name: 'Portugal', iso: 'pt' }, { name: 'Países Baixos', iso: 'nl' }, { name: 'Bélgica', iso: 'be' },
  { name: 'Itália', iso: 'it' }, { name: 'Uruguai', iso: 'uy' }, { name: 'Colômbia', iso: 'co' },
  { name: 'México', iso: 'mx' }, { name: 'EUA', iso: 'us' }, { name: 'Canadá', iso: 'ca' },
  { name: 'Japão', iso: 'jp' }, { name: 'Coreia do Sul', iso: 'kr' }, { name: 'Austrália', iso: 'au' },
  { name: 'Marrocos', iso: 'ma' }, { name: 'Senegal', iso: 'sn' }, { name: 'Nigéria', iso: 'ng' },
  { name: 'Egito', iso: 'eg' }, { name: 'Turquia', iso: 'tr' }, { name: 'Croácia', iso: 'hr' },
  { name: 'Sérvia', iso: 'rs' }, { name: 'Dinamarca', iso: 'dk' }, { name: 'Suíça', iso: 'ch' },
  { name: 'Áustria', iso: 'at' }, { name: 'Polônia', iso: 'pl' }, { name: 'Ucrânia', iso: 'ua' },
  { name: 'Hungria', iso: 'hu' }, { name: 'Romênia', iso: 'ro' }, { name: 'Escócia', iso: 'gb-sct' },
  { name: 'Equador', iso: 'ec' }, { name: 'Chile', iso: 'cl' }, { name: 'Venezuela', iso: 've' },
  { name: 'Paraguai', iso: 'py' }, { name: 'Bolívia', iso: 'bo' }, { name: 'Peru', iso: 'pe' },
  { name: 'Arábia Saudita', iso: 'sa' }, { name: 'Irã', iso: 'ir' }, { name: 'Iraque', iso: 'iq' },
  { name: 'Costa do Marfim', iso: 'ci' }, { name: 'África do Sul', iso: 'za' }, { name: 'Camarões', iso: 'cm' },
  { name: 'Gana', iso: 'gh' }, { name: 'Tunísia', iso: 'tn' }, { name: 'Nova Zelândia', iso: 'nz' },
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

function formatMatchDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [screen, setScreen] = useState<Screen>('inicio')
  const [loading, setLoading] = useState(false)

  // Nome
  const [bolaoName, setBolaoName] = useState('')

  // Regras — wizard interno
  const [rulesStep, setRulesStep] = useState<RulesStep>('escopo')
  const [gameScope, setGameScope] = useState<GameScope>('all')
  const [teamSearch, setTeamSearch] = useState('')
  const [teamFilterIso, setTeamFilterIso] = useState('')
  const [teamFilterName, setTeamFilterName] = useState('')
  const [singleMatchId, setSingleMatchId] = useState('')
  const [singleMatchLabel, setSingleMatchLabel] = useState('')
  const [predictionMode, setPredictionMode] = useState<PredictionMode>('score')
  const [matches, setMatches] = useState<MatchOption[]>([])
  const [matchSearch, setMatchSearch] = useState('')

  // Compartilhar
  const [createdCode, setCreatedCode] = useState('')

  // Entrar
  const [joinCode, setJoinCode] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)

  const origin = typeof window !== 'undefined' ? window.location.origin : ORIGIN

  // Busca jogos quando escopo for 'match'
  useEffect(() => {
    if (gameScope === 'match' && matches.length === 0) {
      supabase.from('matches').select('id,home_team,away_team,home_iso,away_iso,match_date,stage,group_name')
        .eq('is_finished', false).order('match_date', { ascending: true }).limit(60)
        .then(({ data }) => { if (data) setMatches(data) })
    }
  }, [gameScope])

  const filteredTeams = TEAMS_2026.filter(t =>
    t.name.toLowerCase().includes(teamSearch.toLowerCase())
  )
  const filteredMatches = matches.filter(m =>
    `${m.home_team} ${m.away_team}`.toLowerCase().includes(matchSearch.toLowerCase())
  )

  // Label do escopo escolhido
  function scopeLabel(): string {
    if (gameScope === 'all') return '🌍 Copa Completa (104 jogos)'
    if (gameScope === 'groups') return '📋 Fase de Grupos (48 jogos)'
    if (gameScope === 'knockout') return '⚡ Fase Eliminatória'
    if (gameScope === 'brazil') return '🇧🇷 Só o Brasil'
    if (gameScope === 'team') return `🔵 ${teamFilterName}`
    if (gameScope === 'match') return `⚽ ${singleMatchLabel}`
    return ''
  }

  function canAdvanceEscopo() {
    if (gameScope === 'team') return !!teamFilterIso
    if (gameScope === 'match') return !!singleMatchId
    return true
  }

  async function handleCreate() {
    if (!bolaoName.trim() || loading) return
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login?next=/onboarding'); return }

      const code = await generateUniqueCode(supabase)

      const { data: league, error } = await supabase.from('leagues').insert({
        name: bolaoName.trim(), code, owner_id: user.id, entry_fee: 0,
        game_scope: gameScope, prediction_mode: predictionMode,
        team_filter_iso: gameScope === 'team' ? teamFilterIso : null,
        single_match_id: gameScope === 'match' ? singleMatchId : null,
      }).select().single()

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

  async function copyInvite() {
    try { await navigator.clipboard.writeText(inviteMsg); toast('Mensagem copiada! ✓', 'success') }
    catch { toast('Não foi possível copiar automaticamente.', 'error') }
  }

  // ── TELA INICIAL ──────────────────────────────────────────────────
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

  // ── CRIAR — NOME ──────────────────────────────────────────────────
  if (screen === 'criar_nome') {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-600 to-green-800 px-5 py-10">
        <button onClick={() => setScreen('inicio')} className="text-white/70 hover:text-white text-sm mb-6 min-h-[44px] flex items-center">← Voltar</button>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm space-y-6">
            {/* Progresso */}
            <div className="flex items-center gap-1.5">
              {['Nome', 'Jogos', 'Modo', 'Resumo'].map((label, i) => (
                <div key={label} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`h-1.5 w-full rounded-full ${i === 0 ? 'bg-white' : 'bg-white/30'}`} />
                  <span className={`text-xs ${i === 0 ? 'text-white font-semibold' : 'text-white/40'}`}>{label}</span>
                </div>
              ))}
            </div>
            <div className="text-white space-y-1">
              <h2 className="text-2xl font-bold">Como vai se chamar o bolão?</h2>
              <p className="text-green-100 text-sm">Escolha um nome que represente seu grupo</p>
            </div>
            <input value={bolaoName} onChange={e => setBolaoName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && bolaoName.trim() && setScreen('criar_regras')}
              placeholder="Ex: Galera da Firma 🏆" maxLength={50} autoFocus
              style={{ fontSize: '16px' }}
              className="w-full bg-white/20 border-2 border-white/30 focus:border-white rounded-2xl px-5 py-4 text-white text-xl placeholder-white/40 focus:outline-none transition font-medium" />
            <div className="flex gap-2 flex-wrap">
              {['Galera do Trabalho', 'Família', 'Amigos do Futebol', 'Turma da Facul'].map(s => (
                <button key={s} onClick={() => setBolaoName(s)}
                  className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-full transition min-h-[36px]">{s}</button>
              ))}
            </div>
            <button onClick={() => bolaoName.trim() && (setScreen('criar_regras'), setRulesStep('escopo'))}
              disabled={!bolaoName.trim()}
              className="w-full bg-white text-green-700 font-bold py-4 rounded-2xl transition disabled:opacity-40 text-lg hover:bg-green-50 min-h-[56px]">
              Próximo →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── CRIAR — REGRAS (wizard interno) ──────────────────────────────
  if (screen === 'criar_regras') {

    const stepIndex = rulesStep === 'escopo' ? 1 : rulesStep === 'modo' ? 2 : 3
    const stepLabels = ['Nome', 'Jogos', 'Modo', 'Resumo']

    const ProgressBar = () => (
      <div className="flex items-center gap-1.5">
        {stepLabels.map((label, i) => (
          <div key={label} className="flex-1 flex flex-col items-center gap-1">
            <div className={`h-1.5 w-full rounded-full ${i <= stepIndex ? 'bg-white' : 'bg-white/30'}`} />
            <span className={`text-xs ${i === stepIndex ? 'text-white font-semibold' : i < stepIndex ? 'text-white/70' : 'text-white/40'}`}>{label}</span>
          </div>
        ))}
      </div>
    )

    // ── SUB-PASSO 1: ESCOPO ──────────────────────────────────────────
    if (rulesStep === 'escopo') {
      const scopeOptions = [
        { id: 'all',      icon: '🌍', title: 'Copa Completa',        subtitle: 'Todos os 104 jogos da Copa 2026', badge: 'Mais popular' },
        { id: 'groups',   icon: '📋', title: 'Fase de Grupos',       subtitle: '48 jogos da fase inicial' },
        { id: 'knockout', icon: '⚡', title: 'Fase Eliminatória',    subtitle: 'Oitavas, quartas, semi e final' },
        { id: 'brazil',   icon: '🇧🇷', title: 'Só o Brasil',          subtitle: 'Apenas jogos da Seleção Brasileira' },
        { id: 'team',     icon: '🔵', title: 'Seleção específica',   subtitle: 'Escolha um time para acompanhar' },
        { id: 'match',    icon: '⚽', title: 'Jogo único',           subtitle: 'Apostas em uma partida específica' },
      ]
      return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-600 to-green-800 px-5 py-10">
          <button onClick={() => setScreen('criar_nome')} className="text-white/70 hover:text-white text-sm mb-6 min-h-[44px] flex items-center">← Voltar</button>
          <div className="w-full max-w-sm mx-auto space-y-5">
            <ProgressBar />
            <div className="text-white space-y-1">
              <h2 className="text-2xl font-bold">Quais jogos?</h2>
              <p className="text-green-100 text-sm">Escolha o escopo do bolão <strong>{bolaoName}</strong></p>
            </div>

            <div className="space-y-2">
              {scopeOptions.map(opt => {
                const isSelected = gameScope === opt.id
                return (
                  <button key={opt.id} onClick={() => { setGameScope(opt.id as GameScope); setTeamFilterIso(''); setSingleMatchId('') }}
                    className={`w-full text-left rounded-2xl px-4 py-3.5 border-2 transition active:scale-[0.98] flex items-center gap-3 ${isSelected ? 'bg-white border-white shadow-xl' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}>
                    <span className="text-2xl shrink-0">{opt.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-bold text-sm ${isSelected ? 'text-gray-900' : 'text-white'}`}>{opt.title}</p>
                        {opt.badge && <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">{opt.badge}</span>}
                      </div>
                      <p className={`text-xs ${isSelected ? 'text-gray-500' : 'text-green-200'}`}>{opt.subtitle}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${isSelected ? 'bg-green-600 border-green-600' : 'border-white/40'}`}>
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Seleção de time */}
            {gameScope === 'team' && (
              <div className="bg-white rounded-2xl p-4 space-y-3">
                <input value={teamSearch} onChange={e => setTeamSearch(e.target.value)}
                  placeholder="Buscar seleção..." style={{ fontSize: '16px' }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {filteredTeams.map(t => (
                    <button key={t.iso} onClick={() => { setTeamFilterIso(t.iso); setTeamFilterName(t.name) }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition ${teamFilterIso === t.iso ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-700 hover:border-green-300'}`}>
                      <FlagImage iso={t.iso} size={20} />
                      <span className="truncate">{t.name}</span>
                    </button>
                  ))}
                </div>
                {teamFilterIso && <p className="text-green-700 text-xs font-semibold text-center">✓ {teamFilterName} selecionada</p>}
              </div>
            )}

            {/* Seleção de jogo */}
            {gameScope === 'match' && (
              <div className="bg-white rounded-2xl p-4 space-y-3">
                <input value={matchSearch} onChange={e => setMatchSearch(e.target.value)}
                  placeholder="Buscar jogo..." style={{ fontSize: '16px' }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                {matches.length === 0
                  ? <p className="text-gray-400 text-sm text-center py-3">Carregando jogos...</p>
                  : <div className="space-y-2 max-h-52 overflow-y-auto">
                      {filteredMatches.map(m => (
                        <button key={m.id} onClick={() => { setSingleMatchId(m.id); setSingleMatchLabel(`${m.home_team} x ${m.away_team}`) }}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition ${singleMatchId === m.id ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-700 hover:border-green-300'}`}>
                          <FlagImage iso={m.home_iso} size={20} />
                          <span className="font-semibold truncate">{m.home_team}</span>
                          <span className="text-xs opacity-60 shrink-0">x</span>
                          <span className="font-semibold truncate">{m.away_team}</span>
                          <FlagImage iso={m.away_iso} size={20} />
                          <span className="text-xs opacity-60 shrink-0 ml-auto">{formatMatchDate(m.match_date)}</span>
                        </button>
                      ))}
                    </div>
                }
                {singleMatchId && <p className="text-green-700 text-xs font-semibold text-center">✓ {singleMatchLabel}</p>}
              </div>
            )}

            <button onClick={() => canAdvanceEscopo() && setRulesStep('modo')}
              disabled={!canAdvanceEscopo()}
              className="w-full bg-white text-green-700 font-bold py-4 rounded-2xl transition disabled:opacity-40 text-lg hover:bg-green-50 min-h-[56px] shadow-xl">
              Próximo →
            </button>
          </div>
        </div>
      )
    }

    // ── SUB-PASSO 2: MODO ────────────────────────────────────────────
    if (rulesStep === 'modo') {
      return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-600 to-green-800 px-5 py-10">
          <button onClick={() => setRulesStep('escopo')} className="text-white/70 hover:text-white text-sm mb-6 min-h-[44px] flex items-center">← Voltar</button>
          <div className="w-full max-w-sm mx-auto space-y-5">
            <ProgressBar />
            <div className="text-white space-y-1">
              <h2 className="text-2xl font-bold">Como palpitar?</h2>
              <p className="text-green-100 text-sm">Escolha o tipo de aposta para os participantes</p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'score' as PredictionMode,
                  icon: '🎯',
                  title: 'Placar exato',
                  subtitle: 'Chute o placar de cada jogo',
                  badge: 'Mais emocionante',
                  detail: 'Os participantes escolhem o número exato de gols de cada time. Mais difícil, mais pontos em jogo!',
                  example: ['Brasil 2 x 1 Alemanha', 'Argentina 0 x 0 França'],
                },
                {
                  id: 'winner' as PredictionMode,
                  icon: '✅',
                  title: 'Resultado simples',
                  subtitle: 'Só quem vai vencer ou empatar',
                  badge: 'Mais fácil',
                  detail: 'Os participantes escolhem apenas quem vai ganhar ou se o jogo vai empatar. Ideal para grupos casuais.',
                  example: ['Brasil vence ✓', 'Empate ✓', 'Alemanha vence ✓'],
                },
              ].map(opt => {
                const isSelected = predictionMode === opt.id
                return (
                  <button key={opt.id} onClick={() => setPredictionMode(opt.id)}
                    className={`w-full text-left rounded-2xl p-5 border-2 transition active:scale-[0.98] ${isSelected ? 'bg-white border-white shadow-xl' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-3xl shrink-0">{opt.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-bold text-base ${isSelected ? 'text-gray-900' : 'text-white'}`}>{opt.title}</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isSelected ? 'bg-green-100 text-green-700' : 'bg-white/20 text-white'}`}>{opt.badge}</span>
                        </div>
                        <p className={`text-sm mt-0.5 ${isSelected ? 'text-gray-500' : 'text-green-200'}`}>{opt.subtitle}</p>
                        {isSelected && (
                          <div className="mt-3 space-y-2">
                            <p className={`text-xs leading-relaxed ${isSelected ? 'text-gray-600' : 'text-green-200'}`}>{opt.detail}</p>
                            <div className="flex gap-2 flex-wrap">
                              {opt.example.map(ex => (
                                <span key={ex} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-lg font-medium">{ex}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-1 flex items-center justify-center ${isSelected ? 'bg-green-600 border-green-600' : 'border-white/40'}`}>
                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <button onClick={() => setRulesStep('resumo')}
              className="w-full bg-white text-green-700 font-bold py-4 rounded-2xl transition text-lg hover:bg-green-50 min-h-[56px] shadow-xl">
              Ver resumo →
            </button>
          </div>
        </div>
      )
    }

    // ── SUB-PASSO 3: RESUMO ──────────────────────────────────────────
    if (rulesStep === 'resumo') {
      const isScore = predictionMode === 'score'
      return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-600 to-green-800 px-5 py-10">
          <button onClick={() => setRulesStep('modo')} className="text-white/70 hover:text-white text-sm mb-6 min-h-[44px] flex items-center">← Voltar</button>
          <div className="w-full max-w-sm mx-auto space-y-5">
            <ProgressBar />
            <div className="text-white space-y-1">
              <h2 className="text-2xl font-bold">Tudo certo!</h2>
              <p className="text-green-100 text-sm">Confira o resumo antes de criar</p>
            </div>

            {/* Resumo das escolhas */}
            <div className="bg-white rounded-2xl p-5 space-y-4">
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-2">Seu bolão</p>
                <p className="text-xl font-black text-gray-900">{bolaoName}</p>
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📅</span>
                  <div>
                    <p className="text-xs text-gray-400">Jogos incluídos</p>
                    <p className="text-sm font-bold text-gray-800">{scopeLabel()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{isScore ? '🎯' : '✅'}</span>
                  <div>
                    <p className="text-xs text-gray-400">Tipo de palpite</p>
                    <p className="text-sm font-bold text-gray-800">{isScore ? 'Placar exato' : 'Resultado simples'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pontuação */}
            <div className="bg-white/15 rounded-2xl p-5 space-y-4">
              <p className="text-white font-bold text-sm uppercase tracking-wide">🏆 Como funciona a pontuação</p>

              {isScore ? (
                <div className="space-y-2">
                  {[
                    { pts: '10', label: 'Placar exato', desc: 'Acertou o número de gols dos dois times', icon: '🎯', color: 'bg-yellow-400' },
                    { pts: '5',  label: 'Resultado certo', desc: 'Acertou quem ganhou ou que seria empate (mas errou o placar)', icon: '✓', color: 'bg-green-400' },
                    { pts: '0',  label: 'Errou', desc: 'Chutou que um time ganharia mas ganhou o outro (ou empate)', icon: '✗', color: 'bg-red-400' },
                  ].map(row => (
                    <div key={row.pts} className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                      <div className={`${row.color} w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0`}>
                        {row.pts}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{row.label}</p>
                        <p className="text-green-200 text-xs leading-snug">{row.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {[
                    { pts: '3', label: 'Resultado certo', desc: 'Acertou quem ganhou ou que seria empate', icon: '✓', color: 'bg-green-400' },
                    { pts: '0', label: 'Errou', desc: 'Chutou o resultado errado', icon: '✗', color: 'bg-red-400' },
                  ].map(row => (
                    <div key={row.pts} className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                      <div className={`${row.color} w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0`}>
                        {row.pts}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{row.label}</p>
                        <p className="text-green-200 text-xs leading-snug">{row.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-white/20 pt-3">
                <p className="text-green-200 text-xs font-semibold mb-2">🤝 Desempate (quando dois têm a mesma pontuação)</p>
                <div className="space-y-1 text-xs text-green-100">
                  {isScore && <p>1º Quem tem mais <strong>placares exatos</strong></p>}
                  <p>{isScore ? '2º' : '1º'} Quem tem mais <strong>resultados certos</strong></p>
                  <p>{isScore ? '3º' : '2º'} Quem fez o palpite <strong>mais cedo</strong></p>
                </div>
              </div>

              <div className="border-t border-white/20 pt-3">
                <p className="text-green-200 text-xs">
                  ⏰ <strong>Prazo:</strong> Os palpites ficam abertos até o <strong>início de cada jogo</strong>. Depois que o árbitro apita, não dá mais para alterar.
                </p>
              </div>
            </div>

            <button onClick={handleCreate} disabled={loading}
              className="w-full bg-white text-green-700 font-bold py-4 rounded-2xl transition disabled:opacity-40 text-lg hover:bg-green-50 min-h-[56px] shadow-xl">
              {loading ? 'Criando bolão...' : '🏆 Criar bolão agora'}
            </button>
            <p className="text-center text-green-200/70 text-xs">Grátis · Sem cadastro de cartão · Você convida quem quiser</p>
          </div>
        </div>
      )
    }
  }

  // ── CRIAR — COMPARTILHAR ──────────────────────────────────────────
  if (screen === 'criar_compartilhar') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-600 to-green-800 px-5 py-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center text-white space-y-2">
            <div className="text-5xl">🎉</div>
            <h2 className="text-2xl font-bold">{bolaoName} criado!</h2>
            <p className="text-green-100 text-sm">{scopeLabel()} · {predictionMode === 'score' ? 'Placar exato' : 'Resultado simples'}</p>
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
            <a href={`https://wa.me/?text=${encodeURIComponent(inviteMsg)}`} target="_blank" rel="noopener noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#20bc5a] text-white font-bold py-4 rounded-2xl transition flex items-center justify-center gap-2 text-base min-h-[56px]">
              <span className="text-xl">📲</span> Enviar no WhatsApp
            </a>
            <button onClick={copyInvite}
              className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-3.5 rounded-2xl transition min-h-[48px]">
              📋 Copiar mensagem
            </button>
          </div>
          <div className="border-t border-white/20 pt-4 space-y-2">
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
        <button onClick={() => setScreen('inicio')} className="text-white/70 hover:text-white text-sm mb-8 min-h-[44px] flex items-center">← Voltar</button>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm space-y-6">
            <div className="text-white space-y-2">
              <div className="text-4xl">🔑</div>
              <h2 className="text-2xl font-bold">Digite o código</h2>
              <p className="text-green-100 text-sm">O código tem 6 letras ou números. Peça para quem criou o bolão.</p>
            </div>
            <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoinRedirect()}
              maxLength={6} placeholder="AB12CD" autoFocus style={{ fontSize: '16px' }}
              className="w-full bg-white rounded-2xl px-5 py-5 text-center text-4xl font-mono font-black tracking-widest text-green-700 focus:outline-none focus:ring-4 focus:ring-white/50 transition" />
            <button onClick={handleJoinRedirect} disabled={joinCode.length < 4 || joinLoading}
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
