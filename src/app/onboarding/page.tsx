'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import FlagImage from '@/components/ui/FlagImage'

type Screen = 'inicio' | 'criar_nome' | 'criar_jogos' | 'criar_modo' | 'criar_compartilhar' | 'entrar_codigo'
type GameScope = 'all' | 'groups' | 'team' | 'match'
type PredictionMode = 'score' | 'winner'

interface MatchOption {
  id: string
  home_team: string; away_team: string
  home_iso: string; away_iso: string
  match_date: string; stage: string; group_name?: string
}

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

// Gera label do escopo para exibição
function getScopeLabel(scope: GameScope, selectedTeams: string[], singleMatchLabel: string): string {
  if (scope === 'all') return '🌍 Copa Completa (104 jogos)'
  if (scope === 'groups') return '📋 Fase de Grupos (48 jogos)'
  if (scope === 'match') return `⚽ ${singleMatchLabel}`
  if (scope === 'team') {
    const names = selectedTeams.map(iso => TEAMS_2026.find(t => t.iso === iso)?.name ?? iso)
    if (names.length === 1) return `🔵 Jogos: ${names[0]}`
    if (names.length === 2) return `🔵 Jogos: ${names[0]} + ${names[1]}`
    return `🔵 ${names.length} seleções`
  }
  return ''
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [screen, setScreen] = useState<Screen>('inicio')
  const [loading, setLoading] = useState(false)

  // Passo 1 — Nome
  const [bolaoName, setBolaoName] = useState('')

  // Passo 2 — Jogos
  const [gameScope, setGameScope] = useState<GameScope>('all')
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]) // multi-select
  const [teamSearch, setTeamSearch] = useState('')
  const [singleMatchId, setSingleMatchId] = useState('')
  const [singleMatchLabel, setSingleMatchLabel] = useState('')
  const [matches, setMatches] = useState<MatchOption[]>([])
  const [matchSearch, setMatchSearch] = useState('')

  // Passo 3 — Modo
  const [predictionMode, setPredictionMode] = useState<PredictionMode>('score')

  // Compartilhar
  const [createdCode, setCreatedCode] = useState('')

  // Entrar
  const [joinCode, setJoinCode] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)

  const origin = typeof window !== 'undefined' ? window.location.origin : ORIGIN

  // Busca jogos quando escopo for 'match'
  useEffect(() => {
    if (gameScope === 'match' && matches.length === 0) {
      supabase.from('matches')
        .select('id,home_team,away_team,home_iso,away_iso,match_date,stage,group_name')
        .eq('is_finished', false).order('match_date', { ascending: true }).limit(60)
        .then(({ data }) => { if (data) setMatches(data) })
    }
  }, [gameScope])

  function toggleTeam(iso: string) {
    setSelectedTeams(prev =>
      prev.includes(iso) ? prev.filter(t => t !== iso) : [...prev, iso]
    )
  }

  const filteredTeams = TEAMS_2026.filter(t =>
    t.name.toLowerCase().includes(teamSearch.toLowerCase())
  )
  const filteredMatches = matches.filter(m =>
    `${m.home_team} ${m.away_team}`.toLowerCase().includes(matchSearch.toLowerCase())
  )

  function canAdvanceJogos() {
    if (gameScope === 'team') return selectedTeams.length > 0
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
        name: bolaoName.trim(),
        code,
        owner_id: user.id,
        entry_fee: 0,
        game_scope: gameScope,
        prediction_mode: predictionMode,
        team_filter_iso: gameScope === 'team' ? selectedTeams[0] : null,
        team_filter_isos: gameScope === 'team' ? selectedTeams : null,
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

  const scopeLabel = getScopeLabel(gameScope, selectedTeams, singleMatchLabel)
  const inviteMsg = `⚽ Entra no meu bolão da Copa do Mundo 2026!\n🏆 *${bolaoName}*\n\nAcesse: ${origin}/entrar/${createdCode}\nCódigo: *${createdCode}*`

  async function copyInvite() {
    try { await navigator.clipboard.writeText(inviteMsg); toast('Mensagem copiada! ✓', 'success') }
    catch { toast('Não foi possível copiar automaticamente.', 'error') }
  }

  // Barra de progresso compartilhada
  const ProgressBar = ({ step }: { step: number }) => (
    <div className="flex items-center gap-1.5">
      {['Nome', 'Jogos', 'Modo'].map((label, i) => (
        <div key={label} className="flex-1 flex flex-col items-center gap-1">
          <div className={`h-1.5 w-full rounded-full transition-all ${i <= step ? 'bg-white' : 'bg-white/30'}`} />
          <span className={`text-xs ${i === step ? 'text-white font-semibold' : i < step ? 'text-white/70' : 'text-white/40'}`}>{label}</span>
        </div>
      ))}
    </div>
  )

  // ── TELA INICIAL ──────────────────────────────────────────────────────────
  if (screen === 'inicio') return (
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
              { icon: '🏆', title: 'Crie ou entre num bolão', desc: 'Em segundos, sem cartão de crédito.' },
              { icon: '✏️', title: 'Faça seus palpites', desc: 'Chute o placar de todos os jogos da Copa 2026.' },
              { icon: '⚽', title: 'Ganhe pontos', desc: '10 pts placar exato · 5 pts resultado certo.' },
              { icon: '🥇', title: 'Acompanhe o ranking', desc: 'Veja quem tá na frente em tempo real.' },
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

  // ── PASSO 1: NOME ─────────────────────────────────────────────────────────
  if (screen === 'criar_nome') return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-600 to-green-800 px-5 py-10">
      <button onClick={() => setScreen('inicio')} className="text-white/70 hover:text-white text-sm mb-6 min-h-[44px] flex items-center">← Voltar</button>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-sm space-y-6">
          <ProgressBar step={0} />
          <div className="text-white space-y-1">
            <h2 className="text-2xl font-bold">Como vai se chamar o bolão?</h2>
            <p className="text-green-100 text-sm">Escolha um nome que represente seu grupo</p>
          </div>
          <input value={bolaoName} onChange={e => setBolaoName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && bolaoName.trim() && setScreen('criar_jogos')}
            placeholder="Ex: Galera da Firma 🏆" maxLength={50} autoFocus
            style={{ fontSize: '16px' }}
            className="w-full bg-white/20 border-2 border-white/30 focus:border-white rounded-2xl px-5 py-4 text-white text-xl placeholder-white/40 focus:outline-none transition font-medium" />
          <div className="flex gap-2 flex-wrap">
            {['Galera do Trabalho', 'Família', 'Amigos do Futebol', 'Turma da Facul'].map(s => (
              <button key={s} onClick={() => setBolaoName(s)}
                className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-full transition min-h-[36px]">{s}</button>
            ))}
          </div>
          <button onClick={() => bolaoName.trim() && setScreen('criar_jogos')}
            disabled={!bolaoName.trim()}
            className="w-full bg-white text-green-700 font-bold py-4 rounded-2xl transition disabled:opacity-40 text-lg hover:bg-green-50 min-h-[56px] shadow-xl">
            Próximo →
          </button>
        </div>
      </div>
    </div>
  )

  // ── PASSO 2: JOGOS ────────────────────────────────────────────────────────
  if (screen === 'criar_jogos') {
    const scopeOptions = [
      { id: 'all',    icon: '🌍', title: 'Copa Completa',       desc: 'Todos os 104 jogos da Copa 2026',    badge: 'Mais popular' },
      { id: 'groups', icon: '📋', title: 'Fase de Grupos',      desc: 'Os 48 jogos da fase inicial'         },
      { id: 'team',   icon: '🔵', title: 'Seleção(ões)',        desc: 'Escolha 1 ou mais seleções para acompanhar' },
      { id: 'match',  icon: '⚽', title: 'Jogo específico',     desc: 'Bolão de uma única partida'          },
    ]
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-600 to-green-800 px-5 py-10">
        <button onClick={() => setScreen('criar_nome')} className="text-white/70 hover:text-white text-sm mb-6 min-h-[44px] flex items-center">← Voltar</button>
        <div className="w-full max-w-sm mx-auto space-y-5">
          <ProgressBar step={1} />
          <div className="text-white space-y-1">
            <h2 className="text-2xl font-bold">Quais jogos?</h2>
            <p className="text-green-100 text-sm">Escolha os jogos que vão fazer parte do bolão <strong>{bolaoName}</strong></p>
          </div>

          {/* Opções de escopo */}
          <div className="space-y-2">
            {scopeOptions.map(opt => {
              const isSelected = gameScope === opt.id
              return (
                <button key={opt.id}
                  onClick={() => { setGameScope(opt.id as GameScope); setSelectedTeams([]); setSingleMatchId('') }}
                  className={`w-full text-left rounded-2xl px-4 py-3.5 border-2 transition active:scale-[0.98] flex items-center gap-3 ${isSelected ? 'bg-white border-white shadow-xl' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}>
                  <span className="text-2xl shrink-0">{opt.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-bold text-sm ${isSelected ? 'text-gray-900' : 'text-white'}`}>{opt.title}</p>
                      {opt.badge && <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">{opt.badge}</span>}
                    </div>
                    <p className={`text-xs ${isSelected ? 'text-gray-500' : 'text-green-200'}`}>{opt.desc}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${isSelected ? 'bg-green-600 border-green-600' : 'border-white/40'}`}>
                    {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Multi-select de times */}
          {gameScope === 'team' && (
            <div className="bg-white rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-700">Escolha as seleções</p>
                {selectedTeams.length > 0 && (
                  <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-1 rounded-full">
                    {selectedTeams.length} selecionada{selectedTeams.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {/* Selecionadas em destaque */}
              {selectedTeams.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-100">
                  {selectedTeams.map(iso => {
                    const team = TEAMS_2026.find(t => t.iso === iso)!
                    return (
                      <button key={iso} onClick={() => toggleTeam(iso)}
                        className="flex items-center gap-1.5 bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                        <FlagImage iso={iso} size={16} />
                        {team.name}
                        <span className="ml-0.5 opacity-70">✕</span>
                      </button>
                    )
                  })}
                </div>
              )}
              <input value={teamSearch} onChange={e => setTeamSearch(e.target.value)}
                placeholder="Buscar seleção..." style={{ fontSize: '16px' }}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto">
                {filteredTeams.map(t => {
                  const isChecked = selectedTeams.includes(t.iso)
                  return (
                    <button key={t.iso} onClick={() => toggleTeam(t.iso)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition ${isChecked ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-700 hover:border-green-300'}`}>
                      <FlagImage iso={t.iso} size={20} />
                      <span className="truncate">{t.name}</span>
                      {isChecked && <span className="ml-auto text-xs">✓</span>}
                    </button>
                  )
                })}
              </div>
              {selectedTeams.length > 0 && (
                <p className="text-xs text-gray-500 text-center">
                  O bolão vai incluir jogos de: <strong>{selectedTeams.map(iso => TEAMS_2026.find(t => t.iso === iso)?.name).join(', ')}</strong>
                </p>
              )}
            </div>
          )}

          {/* Seleção de jogo específico */}
          {gameScope === 'match' && (
            <div className="bg-white rounded-2xl p-4 space-y-3">
              <p className="text-sm font-bold text-gray-700">Escolha a partida</p>
              <input value={matchSearch} onChange={e => setMatchSearch(e.target.value)}
                placeholder="Buscar jogo... (ex: Brasil)" style={{ fontSize: '16px' }}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              {matches.length === 0
                ? <p className="text-gray-400 text-sm text-center py-3">Carregando jogos...</p>
                : <div className="space-y-2 max-h-52 overflow-y-auto">
                    {filteredMatches.map(m => (
                      <button key={m.id}
                        onClick={() => { setSingleMatchId(m.id); setSingleMatchLabel(`${m.home_team} x ${m.away_team}`) }}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition ${singleMatchId === m.id ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-700 hover:border-green-300'}`}>
                        <FlagImage iso={m.home_iso} size={18} />
                        <span className="font-semibold truncate">{m.home_team}</span>
                        <span className="text-xs opacity-60 shrink-0">x</span>
                        <span className="font-semibold truncate">{m.away_team}</span>
                        <FlagImage iso={m.away_iso} size={18} />
                        <span className="text-xs opacity-50 ml-auto shrink-0">{formatMatchDate(m.match_date)}</span>
                      </button>
                    ))}
                  </div>
              }
              {singleMatchId && <p className="text-green-700 text-xs font-semibold text-center">✓ {singleMatchLabel}</p>}
            </div>
          )}

          <button onClick={() => canAdvanceJogos() && setScreen('criar_modo')}
            disabled={!canAdvanceJogos()}
            className="w-full bg-white text-green-700 font-bold py-4 rounded-2xl transition disabled:opacity-40 text-lg hover:bg-green-50 min-h-[56px] shadow-xl">
            Próximo →
          </button>
        </div>
      </div>
    )
  }

  // ── PASSO 3: MODO ─────────────────────────────────────────────────────────
  if (screen === 'criar_modo') {
    const isScore = predictionMode === 'score'
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-600 to-green-800 px-5 py-10">
        <button onClick={() => setScreen('criar_jogos')} className="text-white/70 hover:text-white text-sm mb-6 min-h-[44px] flex items-center">← Voltar</button>
        <div className="w-full max-w-sm mx-auto space-y-5">
          <ProgressBar step={2} />
          <div className="text-white space-y-1">
            <h2 className="text-2xl font-bold">Como apostar?</h2>
            <p className="text-green-100 text-sm">Escolha como os participantes vão fazer seus palpites</p>
          </div>

          <div className="space-y-3">
            {[
              {
                id: 'score' as PredictionMode, icon: '🎯', title: 'Placar exato',
                subtitle: 'Chute o número de gols de cada time', badge: 'Mais emocionante',
                detail: 'Cada participante chuta o placar exato. Mais difícil, mais pontos em jogo!',
                points: [{ pts: '10', label: 'Placar exato', color: 'bg-yellow-400' }, { pts: '5', label: 'Acertou o vencedor', color: 'bg-green-400' }, { pts: '0', label: 'Errou', color: 'bg-red-400' }],
              },
              {
                id: 'winner' as PredictionMode, icon: '✅', title: 'Quem vai ganhar',
                subtitle: 'Chute o vencedor ou se vai empatar', badge: 'Mais simples',
                detail: 'Cada participante escolhe: time A vence, empate ou time B vence. Mais fácil para grupos casuais.',
                points: [{ pts: '3', label: 'Acertou o resultado', color: 'bg-green-400' }, { pts: '0', label: 'Errou', color: 'bg-red-400' }],
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
                          <p className="text-xs text-gray-500 leading-relaxed">{opt.detail}</p>
                          <div className="flex gap-2 flex-wrap mt-2">
                            {opt.points.map(p => (
                              <div key={p.label} className={`flex items-center gap-1.5 ${p.color} px-2.5 py-1.5 rounded-xl`}>
                                <span className="text-white font-black text-sm">{p.pts}pts</span>
                                <span className="text-white text-xs">{p.label}</span>
                              </div>
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

          {/* Resumo + Criar */}
          <div className="bg-white/15 rounded-2xl p-4 space-y-2">
            <p className="text-white/80 text-xs font-bold uppercase tracking-wide">Resumo do bolão</p>
            <div className="flex items-center gap-2 text-sm text-white">
              <span>🏆</span><span className="font-bold">{bolaoName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-100">
              <span>📅</span><span>{scopeLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-100">
              <span>{isScore ? '🎯' : '✅'}</span>
              <span>{isScore ? 'Placar exato · 10pts / 5pts' : 'Quem vai ganhar · 3pts'}</span>
            </div>
          </div>

          {/* Desempate */}
          <div className="bg-white/10 rounded-xl px-4 py-3 space-y-1">
            <p className="text-white/70 text-xs font-semibold">🤝 Desempate no ranking</p>
            <p className="text-green-200 text-xs">{isScore ? '1º mais placares exatos · 2º mais resultados certos · 3º palpite mais antigo' : '1º mais resultados certos · 2º palpite mais antigo'}</p>
          </div>

          <button onClick={handleCreate} disabled={loading}
            className="w-full bg-white text-green-700 font-bold py-4 rounded-2xl transition disabled:opacity-40 text-lg hover:bg-green-50 min-h-[56px] shadow-xl">
            {loading ? 'Criando bolão...' : '🏆 Criar bolão agora'}
          </button>
          <p className="text-center text-green-200/60 text-xs">Grátis · Sem cadastro de cartão</p>
        </div>
      </div>
    )
  }

  // ── COMPARTILHAR ──────────────────────────────────────────────────────────
  if (screen === 'criar_compartilhar') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-600 to-green-800 px-5 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center text-white space-y-2">
          <div className="text-5xl">🎉</div>
          <h2 className="text-2xl font-bold">{bolaoName} criado!</h2>
          <p className="text-green-100 text-sm">{scopeLabel} · {predictionMode === 'score' ? 'Placar exato' : 'Quem vai ganhar'}</p>
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
        <button onClick={() => router.push('/palpites')}
          className="w-full text-white font-semibold py-2 min-h-[44px] text-sm">
          Fazer meus palpites →
        </button>
      </div>
    </div>
  )

  // ── ENTRAR COM CÓDIGO ─────────────────────────────────────────────────────
  if (screen === 'entrar_codigo') return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-600 to-green-800 px-5 py-10">
      <button onClick={() => setScreen('inicio')} className="text-white/70 hover:text-white text-sm mb-8 min-h-[44px] flex items-center">← Voltar</button>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-white space-y-2">
            <div className="text-4xl">🔑</div>
            <h2 className="text-2xl font-bold">Digite o código</h2>
            <p className="text-green-100 text-sm">O código tem 6 letras/números. Peça para quem criou o bolão.</p>
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

  return null
}
