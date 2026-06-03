import { createClient } from '@/lib/supabase/server'
import FlagImage from '@/components/ui/FlagImage'
import Link from 'next/link'
import JoinBolaoInline from './JoinBolaoInline'
import DashboardBolao from './DashboardBolao'

interface LeagueRow { id: string; name: string; code: string; owner_id: string }
interface MemberRow { league_id: string; leagues: LeagueRow }

const ORIGIN = 'https://copa-dos-amigos.vercel.app'

const NEWS = [
  {
    tag: '🇧🇷 Brasil',
    title: 'Seleção Brasileira se prepara para a Copa',
    desc: 'Ancelotti convoca elenco com Vinícius Jr., Rodrygo e companhia',
    href: 'https://ge.globo.com/futebol/selecao-brasileira/',
  },
  {
    tag: '📅 Calendário',
    title: 'Copa começa em 11 de junho de 2026',
    desc: '104 jogos, 48 seleções, 3 países anfitriões — EUA, Canadá e México',
    href: 'https://www.fifa.com/fifaplus/pt/tournaments/mens/worldcup/canadamexicousa2026',
  },
  {
    tag: '🏆 Favoritos',
    title: 'Argentina, França e Brasil lideram favoritismo',
    desc: 'Confira a análise das principais seleções para a Copa 2026',
    href: 'https://www.espn.com.br/futebol/copa-do-mundo',
  },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: participant }, { data: memberRows }, { data: nextMatchRaw }] = await Promise.all([
    supabase.from('participants').select('name, is_admin, payment_status').eq('user_id', user?.id).single(),
    supabase.from('league_members')
      .select('league_id, leagues(id,name,code,owner_id)')
      .eq('user_id', user?.id),
    supabase.from('matches')
      .select('id,home_team,away_team,home_iso,away_iso,match_date,stage,group_name')
      .eq('is_finished', false)
      .order('match_date', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])

  const firstName = (participant?.name ?? 'Participante').split(' ')[0]
  const leagues = ((memberRows as unknown as MemberRow[]) ?? []).map(m => m.leagues).filter(Boolean)
  const nextMatch = nextMatchRaw ?? null
  const paymentStatus = participant?.payment_status ?? 'pendente'

  // Conta palpites do usuário
  const { count: predCount } = await supabase
    .from('predictions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)

  // Conta jogos disponíveis para palpite (não finalizados)
  const { count: openGames } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .eq('is_finished', false)
    .gt('match_date', new Date().toISOString())

  // Palpite do user para o próximo jogo
  const userPrediction = nextMatch ? await supabase
    .from('predictions')
    .select('home_score, away_score')
    .eq('user_id', user?.id)
    .eq('match_id', nextMatch.id)
    .maybeSingle()
    .then(r => r.data) : null

  // Ranking de cada bolão
  const rankingData = await Promise.all(
    leagues.map(async (league) => {
      const { data } = await supabase
        .from('league_ranking')
        .select('user_id, name, total_points, exact_scores')
        .eq('league_id', league.id)
        .order('total_points', { ascending: false })
        .limit(5)
      return { league_id: league.id, entries: data ?? [] }
    })
  )

  // Estado do usuário para mostrar próximo passo
  const isPaid = paymentStatus === 'pago' || paymentStatus === 'isento'
  const hasPredictions = (predCount ?? 0) > 0
  const pendingGames = (openGames ?? 0) - (predCount ?? 0)

  // ── SEM BOLÃO ─────────────────────────────────────────────────────────
  if (leagues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] space-y-6 text-center px-4">
        <div className="space-y-3">
          <div className="text-6xl">⚽</div>
          <h1 className="text-2xl font-bold text-gray-900">Bem-vindo, {firstName}!</h1>
          <p className="text-gray-500 max-w-xs mx-auto">
            Para participar do bolão da Copa, você precisa entrar com um código ou criar o seu próprio.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link href="/onboarding"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl transition text-lg text-center shadow-lg">
            Começar agora →
          </Link>
          <JoinBolaoInline userId={user?.id ?? ''} />
        </div>
        <Link href="/como-funciona" className="text-sm text-gray-400 hover:text-green-600 transition">
          Como funciona? →
        </Link>
      </div>
    )
  }

  // ── DASHBOARD PRINCIPAL ───────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Saudação */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Olá, {firstName} 👋</h1>
          <p className="text-sm text-gray-400">Copa do Mundo 2026</p>
        </div>
        {participant?.is_admin && (
          <Link href="/admin" className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 font-medium px-3 py-1.5 rounded-lg hover:bg-yellow-100 transition">
            ⚙️ Admin
          </Link>
        )}
      </div>

      {/* ── PRÓXIMO PASSO (só mostra se tem algo a fazer) ── */}
      {(!isPaid || !hasPredictions) && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">O que fazer agora</h2>

          {/* Passo 1: Pagamento */}
          <div className={`rounded-2xl border-2 p-4 flex items-start gap-4 ${isPaid ? 'border-green-200 bg-green-50' : 'border-yellow-300 bg-yellow-50'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${isPaid ? 'bg-green-100' : 'bg-yellow-100'}`}>
              {isPaid ? '✅' : '💰'}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-bold text-sm ${isPaid ? 'text-green-700' : 'text-yellow-800'}`}>
                {isPaid ? 'Pagamento confirmado' : 'Faça o depósito'}
              </p>
              <p className={`text-xs mt-0.5 ${isPaid ? 'text-green-600' : 'text-yellow-700'}`}>
                {isPaid
                  ? 'Você está confirmado no bolão!'
                  : 'Envie o valor combinado para o organizador do bolão e aguarde a confirmação.'}
              </p>
            </div>
          </div>

          {/* Passo 2: Palpites */}
          <div className={`rounded-2xl border-2 p-4 flex items-start gap-4 ${hasPredictions ? (pendingGames <= 0 ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50') : 'border-gray-200 bg-white'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${hasPredictions ? (pendingGames <= 0 ? 'bg-green-100' : 'bg-blue-100') : 'bg-gray-100'}`}>
              {!hasPredictions ? '✏️' : pendingGames <= 0 ? '✅' : '✏️'}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-bold text-sm ${!hasPredictions ? 'text-gray-700' : pendingGames <= 0 ? 'text-green-700' : 'text-blue-800'}`}>
                {!hasPredictions
                  ? 'Cadastre seus palpites'
                  : pendingGames <= 0
                  ? 'Todos os palpites feitos!'
                  : `${predCount} palpites feitos — ${pendingGames} jogos restantes`}
              </p>
              <p className={`text-xs mt-0.5 ${!hasPredictions ? 'text-gray-500' : pendingGames <= 0 ? 'text-green-600' : 'text-blue-700'}`}>
                {!hasPredictions
                  ? 'Palpite no placar de cada jogo antes de começar. 10 pts placar exato, 5 pts resultado.'
                  : pendingGames <= 0
                  ? 'Acompanhe o ranking em tempo real!'
                  : 'Continue palpitando nos jogos que faltam!'}
              </p>
              {(!hasPredictions || pendingGames > 0) && (
                <Link href="/palpites"
                  className="inline-block mt-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition">
                  {!hasPredictions ? 'Cadastrar palpites →' : 'Ver jogos restantes →'}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PRÓXIMO JOGO ── */}
      {nextMatch && (
        <div className="bg-green-600 rounded-2xl p-4 text-white space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-green-200 text-xs font-semibold uppercase tracking-wide">⚡ Próximo jogo</p>
            <p className="text-green-200 text-xs">
              {new Date(nextMatch.match_date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
              {' · '}
              {new Date(nextMatch.match_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <FlagImage iso={nextMatch.home_iso} name={nextMatch.home_team} size={44} />
              <span className="text-sm font-bold text-center leading-tight">{nextMatch.home_team}</span>
            </div>
            <div className="text-center shrink-0">
              {userPrediction ? (
                <div className="bg-white/20 rounded-xl px-4 py-2 space-y-0.5">
                  <p className="text-xs text-green-200">Seu palpite</p>
                  <p className="text-2xl font-black">{userPrediction.home_score} × {userPrediction.away_score}</p>
                </div>
              ) : (
                <div className="bg-white/20 rounded-xl px-4 py-2">
                  <p className="text-lg font-black">×</p>
                  <p className="text-xs text-green-200">sem palpite</p>
                </div>
              )}
              {nextMatch.group_name && <p className="text-xs text-green-200 mt-1">Grupo {nextMatch.group_name}</p>}
            </div>
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <FlagImage iso={nextMatch.away_iso} name={nextMatch.away_team} size={44} />
              <span className="text-sm font-bold text-center leading-tight">{nextMatch.away_team}</span>
            </div>
          </div>
          <Link href="/palpites"
            className="block w-full bg-white text-green-700 font-bold py-2.5 rounded-xl text-center text-sm hover:bg-green-50 transition">
            {userPrediction ? 'Ver todos os palpites →' : '✏️ Palpitar agora'}
          </Link>
        </div>
      )}

      {/* ── MEUS BOLÕES ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Meus bolões</h2>
          <Link href="/onboarding" className="text-sm text-green-600 font-medium hover:underline">+ Criar</Link>
        </div>

        {leagues.map((league) => {
          const r = rankingData.find(x => x.league_id === league.id)
          const entries = r?.entries ?? []
          const myEntry = entries.find(e => e.user_id === user?.id)
          const myPos = myEntry ? entries.indexOf(myEntry) + 1 : null
          const inviteMsg = `⚽ Entra no meu bolão da Copa!\n🏆 *${league.name}*\n\nAcesse: ${ORIGIN}/entrar/${league.code}\nCódigo: *${league.code}*`
          const waUrl = `https://wa.me/?text=${encodeURIComponent(inviteMsg)}`

          return (
            <DashboardBolao key={league.id}
              id={league.id} name={league.name} code={league.code}
              entries={entries} myUserId={user?.id ?? ''}
              myPos={myPos} myPts={myEntry?.total_points ?? 0}
              inviteMsg={inviteMsg} waUrl={waUrl} />
          )
        })}

        <JoinBolaoInline userId={user?.id ?? ''} />
      </div>

      {/* ── NOTÍCIAS DA COPA ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">🌍 Copa do Mundo 2026</h2>
          <Link href="/copa" className="text-sm text-green-600 font-medium">Ver tudo →</Link>
        </div>

        <div className="space-y-2">
          {NEWS.map((n, i) => (
            <a key={i} href={n.href} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-3 bg-white rounded-xl border border-gray-100 shadow-sm p-3.5 hover:shadow-md transition active:bg-gray-50">
              <div className="flex-1 min-w-0">
                <span className="text-xs text-green-700 font-medium bg-green-50 px-2 py-0.5 rounded-full">{n.tag}</span>
                <p className="font-semibold text-gray-900 text-sm mt-1.5 leading-tight">{n.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{n.desc}</p>
              </div>
              <span className="text-gray-300 shrink-0 mt-1">→</span>
            </a>
          ))}
        </div>

        {/* Atalhos Copa */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { href: '/copa',        label: 'Jogos',     icon: '⚽' },
            { href: '/copa',        label: 'Grupos',    icon: '📋' },
            { href: '/copa',        label: 'Mata-mata', icon: '⚔️' },
            { href: '/copa',        label: 'Artilharia',icon: '🥅' },
          ].map((item, i) => (
            <Link key={i} href={`${item.href}${i > 0 ? `#${['grupos','mata_mata','artilharia'][i-1]}` : ''}`}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center hover:shadow-md transition">
              <div className="text-xl mb-1">{item.icon}</div>
              <p className="text-xs font-medium text-gray-600">{item.label}</p>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
