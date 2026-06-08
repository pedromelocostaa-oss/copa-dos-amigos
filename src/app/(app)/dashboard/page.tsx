import { createClient } from '@/lib/supabase/server'
import FlagImage from '@/components/ui/FlagImage'
import Link from 'next/link'
import JoinBolaoInline from './JoinBolaoInline'
import DashboardBolao from './DashboardBolao'
import Countdown from './Countdown'

interface LeagueRow { id: string; name: string; code: string; owner_id: string; entry_fee: number; game_scope: string | null; team_filter_iso: string | null; single_match_id: string | null }
interface MemberRow { league_id: string; leagues: LeagueRow }

const ORIGIN = 'https://copa-dos-amigos.vercel.app'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Busca participante e bolões primeiro (para construir filtro do próximo jogo)
  const [{ data: participant }, { data: memberRows }] = await Promise.all([
    supabase.from('participants').select('name, is_admin, payment_status').eq('user_id', user?.id).single(),
    supabase.from('league_members').select('league_id, leagues(id,name,code,owner_id,entry_fee,game_scope,team_filter_iso,single_match_id)').eq('user_id', user?.id),
  ])

  const leagues = ((memberRows as unknown as MemberRow[]) ?? []).map(m => m.leagues).filter(Boolean)

  // Monta query do próximo jogo filtrada pelo escopo do primeiro bolão
  const primaryLeague = leagues[0] ?? null
  const scope = primaryLeague?.game_scope ?? 'all'
  const teamIso = primaryLeague?.team_filter_iso
  const matchId = primaryLeague?.single_match_id

  let nextMatchQuery = supabase.from('matches')
    .select('id,home_team,away_team,home_iso,away_iso,match_date,stage,group_name')
    .eq('is_finished', false)
    .order('match_date', { ascending: true })
    .limit(1)

  if (scope === 'brazil') {
    nextMatchQuery = nextMatchQuery.or('home_iso.eq.br,away_iso.eq.br')
  } else if (scope === 'groups') {
    nextMatchQuery = nextMatchQuery.eq('stage', 'Fase de Grupos')
  } else if (scope === 'knockout') {
    nextMatchQuery = nextMatchQuery.neq('stage', 'Fase de Grupos')
  } else if (scope === 'team' && teamIso) {
    nextMatchQuery = nextMatchQuery.or(`home_iso.eq.${teamIso},away_iso.eq.${teamIso}`)
  } else if (scope === 'match' && matchId) {
    nextMatchQuery = nextMatchQuery.eq('id', matchId)
  }

  const [{ data: nextMatchRaw }, { data: todayMatches }, { data: recentResults }] = await Promise.all([
    nextMatchQuery.maybeSingle(),
    // Jogos do dia (próximas 24h)
    supabase.from('matches').select('id,home_team,away_team,home_iso,away_iso,match_date,stage,group_name')
      .eq('is_finished', false)
      .gte('match_date', new Date().toISOString())
      .lte('match_date', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
      .order('match_date', { ascending: true })
      .limit(4),
    // Últimos resultados
    supabase.from('matches').select('id,home_team,away_team,home_iso,away_iso,home_score,away_score,match_date')
      .eq('is_finished', true)
      .order('match_date', { ascending: false })
      .limit(3),
  ])

  const firstName = (participant?.name ?? 'Participante').split(' ')[0]
  const nextMatch = nextMatchRaw ?? null
  const isPaid = ['pago','isento'].includes(participant?.payment_status ?? '')

  const [{ count: predCount }, { count: openGames }, userPrediction, rankingData] = await Promise.all([
    supabase.from('predictions').select('*', { count: 'exact', head: true }).eq('user_id', user?.id),
    supabase.from('matches').select('*', { count: 'exact', head: true }).eq('is_finished', false).gt('match_date', new Date().toISOString()),
    nextMatch ? supabase.from('predictions').select('home_score,away_score').eq('user_id', user?.id).eq('match_id', nextMatch.id).maybeSingle().then(r => r.data) : Promise.resolve(null),
    Promise.all(leagues.map(async (league) => {
      const { data } = await supabase.from('league_ranking').select('user_id,name,total_points,exact_scores').eq('league_id', league.id).order('total_points', { ascending: false }).limit(5)
      return { league_id: league.id, entries: data ?? [] }
    })),
  ])

  const hasPredictions = (predCount ?? 0) > 0
  const pendingGames = Math.max(0, (openGames ?? 0) - (predCount ?? 0))

  // Sem bolão
  if (leagues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 space-y-6">
        <div className="text-7xl">⚽</div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Bem-vindo, {firstName}!</h1>
          <p className="text-gray-500 max-w-xs mx-auto text-sm leading-relaxed">
            Para jogar, crie um bolão com seus amigos ou entre no bolão de alguém com um código.
          </p>
        </div>
        <div className="w-full max-w-xs space-y-3">
          <Link href="/onboarding"
            className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl text-center block text-lg shadow-lg active:opacity-80">
            Criar ou entrar em um bolão →
          </Link>
          <Link href="/como-funciona"
            className="w-full flex items-center justify-center min-h-[48px] text-sm text-gray-400 hover:text-green-600 transition">
            Como funciona o bolão? →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Saudação */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Olá, {firstName} 👋</h1>
          <p className="text-sm text-gray-400 mt-0.5">Copa do Mundo 2026</p>
        </div>
        {participant?.is_admin && (
          <Link href="/admin"
            className="min-h-[44px] px-4 flex items-center bg-yellow-50 text-yellow-700 border border-yellow-200 font-semibold text-sm rounded-xl hover:bg-yellow-100 transition">
            ⚙️ Admin
          </Link>
        )}
      </div>

      {/* ── O QUE FAZER AGORA (some quando tudo ok) ── */}
      {(!isPaid || !hasPredictions) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
            <span className="text-base">📋</span>
            <h2 className="font-bold text-gray-800 text-sm">O que fazer agora</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {/* Pagamento */}
            <div className="flex items-start gap-4 px-4 py-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${isPaid ? 'bg-green-100' : 'bg-yellow-100'}`}>
                {isPaid ? '✅' : '💰'}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm ${isPaid ? 'text-green-700' : 'text-yellow-800'}`}>
                  {isPaid ? 'Pagamento confirmado!' : 'Faça o depósito'}
                </p>
                <p className={`text-xs mt-0.5 leading-relaxed ${isPaid ? 'text-green-600' : 'text-yellow-700'}`}>
                  {isPaid ? 'Você está confirmado no bolão.' : 'Envie o valor combinado para o organizador e aguarde a confirmação.'}
                </p>
              </div>
            </div>

            {/* Palpites */}
            <div className="flex items-start gap-4 px-4 py-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${!hasPredictions ? 'bg-gray-100' : pendingGames > 0 ? 'bg-blue-100' : 'bg-green-100'}`}>
                {!hasPredictions ? '✏️' : pendingGames > 0 ? '✏️' : '✅'}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm ${!hasPredictions ? 'text-gray-700' : pendingGames > 0 ? 'text-blue-800' : 'text-green-700'}`}>
                  {!hasPredictions ? 'Cadastre seus palpites' : pendingGames > 0 ? `${pendingGames} jogos sem palpite` : 'Todos os palpites feitos!'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  {!hasPredictions ? '10 pts para placar exato · 5 pts para resultado correto' : pendingGames > 0 ? 'Continue palpitando antes dos jogos começarem!' : 'Acompanhe o ranking em tempo real.'}
                </p>
                {(!hasPredictions || pendingGames > 0) && (
                  <Link href="/palpites"
                    className="inline-flex items-center mt-2 bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-xl min-h-[36px]">
                    {!hasPredictions ? 'Palpitar agora →' : 'Ver jogos abertos →'}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PRÓXIMO JOGO ── */}
      {nextMatch && (
        <div className="bg-green-600 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <p className="text-green-200 text-xs font-bold uppercase tracking-wide">⚡ Próximo jogo</p>
            <div className="flex items-center gap-2">
              <span className="text-green-200 text-xs">
                {new Date(nextMatch.match_date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
              </span>
              <Countdown matchDate={nextMatch.match_date} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-2 flex-1">
              <FlagImage iso={nextMatch.home_iso} name={nextMatch.home_team} size={48} />
              <span className="text-sm font-bold text-center leading-tight">{nextMatch.home_team}</span>
            </div>
            <div className="flex flex-col items-center gap-1 shrink-0 mx-2">
              {userPrediction ? (
                <div className="bg-white/25 rounded-xl px-4 py-2.5 text-center">
                  <p className="text-[10px] text-green-200 font-semibold">Seu palpite</p>
                  <p className="text-2xl font-black">{userPrediction.home_score} × {userPrediction.away_score}</p>
                </div>
              ) : (
                <div className="bg-white/20 rounded-xl px-4 py-2.5 text-center">
                  <p className="text-2xl font-black">×</p>
                  <p className="text-[10px] text-green-200">sem palpite</p>
                </div>
              )}
              {nextMatch.group_name && <p className="text-[10px] text-green-200">Grupo {nextMatch.group_name}</p>}
            </div>
            <div className="flex flex-col items-center gap-2 flex-1">
              <FlagImage iso={nextMatch.away_iso} name={nextMatch.away_team} size={48} />
              <span className="text-sm font-bold text-center leading-tight">{nextMatch.away_team}</span>
            </div>
          </div>
          <Link href="/palpites"
            className="flex items-center justify-center w-full bg-white text-green-700 font-bold py-3 rounded-xl mt-4 min-h-[48px] text-sm active:opacity-80">
            {userPrediction ? 'Ver todos os palpites →' : '✏️ Palpitar agora'}
          </Link>
        </div>
      )}

      {/* ── MEUS BOLÕES ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Meus bolões</h2>
          <Link href="/onboarding"
            className="min-h-[44px] px-3 flex items-center text-sm text-green-600 font-semibold">
            + Criar
          </Link>
        </div>

        {leagues.map((league) => {
          const r = rankingData.find(x => x.league_id === league.id)
          const entries = r?.entries ?? []
          const myEntry = entries.find(e => e.user_id === user?.id)
          const myPos = myEntry ? entries.indexOf(myEntry) + 1 : null
          // entry_fee em centavos; prêmio = nº participantes × valor
          const entryFee = league.entry_fee ?? 0
          const prizePool = entryFee > 0 ? (entries.length * entryFee) / 100 : 0
          const inviteMsg = entryFee > 0
            ? `⚽ Entra no meu bolão da Copa!\n🏆 *${league.name}*\n💰 Entrada: R$${(entryFee/100).toFixed(0)} · Prêmio atual: R$${prizePool.toFixed(0)}\n\nAcesse: ${ORIGIN}/entrar/${league.code}\nCódigo: *${league.code}*`
            : `⚽ Entra no meu bolão da Copa!\n🏆 *${league.name}*\n\nAcesse: ${ORIGIN}/entrar/${league.code}\nCódigo: *${league.code}*`
          const waUrl = `https://wa.me/?text=${encodeURIComponent(inviteMsg)}`
          return (
            <DashboardBolao key={league.id} id={league.id} name={league.name} code={league.code}
              entries={entries} myUserId={user?.id ?? ''} myPos={myPos} myPts={myEntry?.total_points ?? 0}
              inviteMsg={inviteMsg} waUrl={waUrl} entryFee={entryFee} prizePool={prizePool} />
          )
        })}

        <JoinBolaoInline userId={user?.id ?? ''} />
      </div>

      {/* ── COPA DO MUNDO 2026 (dinâmico) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">🌍 Copa do Mundo 2026</h2>
          <Link href="/copa" className="min-h-[44px] px-3 flex items-center text-sm text-green-600 font-semibold">
            Ver tudo
          </Link>
        </div>

        {/* Jogos do dia */}
        {todayMatches && todayMatches.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide px-4 pt-3 pb-1">
              📅 Jogos de hoje ({todayMatches.length})
            </p>
            <div className="divide-y divide-gray-50">
              {todayMatches.map(m => (
                <Link key={m.id} href={`/jogos/${m.id}`}
                  className="flex items-center px-4 py-2.5 gap-3 hover:bg-gray-50 active:bg-gray-100 transition">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <FlagImage iso={m.home_iso} name={m.home_team} size={18} />
                    <span className="text-xs font-semibold truncate">{m.home_team}</span>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 font-medium">
                    {new Date(m.match_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                    <span className="text-xs font-semibold truncate text-right">{m.away_team}</span>
                    <FlagImage iso={m.away_iso} name={m.away_team} size={18} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Últimos resultados */}
        {recentResults && recentResults.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide px-4 pt-3 pb-1">
              ✅ Últimos resultados
            </p>
            <div className="divide-y divide-gray-50">
              {recentResults.map(m => (
                <Link key={m.id} href={`/jogos/${m.id}`}
                  className="flex items-center px-4 py-2.5 gap-3 hover:bg-gray-50 active:bg-gray-100 transition">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <FlagImage iso={m.home_iso} name={m.home_team} size={18} />
                    <span className="text-xs font-semibold truncate">{m.home_team}</span>
                  </div>
                  <span className="bg-gray-900 text-white text-xs font-bold px-2.5 py-1 rounded-lg shrink-0">
                    {m.home_score} – {m.away_score}
                  </span>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                    <span className="text-xs font-semibold truncate text-right">{m.away_team}</span>
                    <FlagImage iso={m.away_iso} name={m.away_team} size={18} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Sem dados: placeholder até o torneio começar */}
        {(!todayMatches || todayMatches.length === 0) && (!recentResults || recentResults.length === 0) && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center space-y-2">
            <p className="text-3xl">⚽</p>
            <p className="font-semibold text-gray-700">Copa começa em 11 de junho de 2026</p>
            <p className="text-sm text-gray-400">EUA · Canadá · México — 48 seleções · 104 jogos</p>
          </div>
        )}

        {/* Atalhos Copa */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { href: '/copa', label: 'Jogos',      icon: '⚽' },
            { href: '/copa', label: 'Grupos',     icon: '📋' },
            { href: '/copa', label: 'Mata-mata',  icon: '⚔️' },
            { href: '/copa', label: 'Artilharia', icon: '🥅' },
          ].map((item, i) => (
            <Link key={i} href={item.href}
              className="bg-white rounded-xl border border-gray-100 p-3 text-center active:bg-gray-50 min-h-[72px] flex flex-col items-center justify-center gap-1">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-[11px] font-medium text-gray-600 leading-tight">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
