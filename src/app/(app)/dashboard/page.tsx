import { createClient } from '@/lib/supabase/server'
import FlagImage from '@/components/ui/FlagImage'
import Link from 'next/link'
import JoinBolaoInline from './JoinBolaoInline'
import DashboardBolao from './DashboardBolao'

interface LeagueRow { id: string; name: string; code: string; owner_id: string }
interface MemberRow { league_id: string; leagues: LeagueRow }

const ORIGIN = 'https://copa-dos-amigos.vercel.app'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: participant }, { data: memberRows }, { data: nextMatchRaw }] = await Promise.all([
    supabase.from('participants').select('name, is_admin').eq('user_id', user?.id).single(),
    supabase.from('league_members')
      .select('league_id, leagues(id,name,code,owner_id)')
      .eq('user_id', user?.id),
    supabase.from('matches')
      .select('id,home_team,away_team,home_iso,away_iso,match_date,stage,group_name')
      .eq('is_finished', false)
      .order('match_date', { ascending: true })
      .limit(1)
      .single(),
  ])

  const firstName = (participant?.name ?? 'Participante').split(' ')[0]
  const leagues = ((memberRows as unknown as MemberRow[]) ?? []).map(m => m.leagues).filter(Boolean)
  const nextMatch = nextMatchRaw ?? null

  // Busca palpite do user para o próximo jogo
  const userPrediction = nextMatch ? await supabase
    .from('predictions')
    .select('home_score, away_score')
    .eq('user_id', user?.id)
    .eq('match_id', nextMatch.id)
    .single()
    .then(r => r.data) : null

  // Busca ranking de cada bolão
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

  // Sem bolão
  if (leagues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] space-y-6 text-center px-4">
        <div className="space-y-3">
          <div className="text-6xl">⚽</div>
          <h1 className="text-2xl font-bold text-gray-900">Bem-vindo, {firstName}!</h1>
          <p className="text-gray-500">Crie ou entre em um bolão para começar a jogar.</p>
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

  return (
    <div className="space-y-5">
      {/* Saudação */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Olá, {firstName} 👋</h1>
          <p className="text-sm text-gray-400">Copa do Mundo 2026</p>
        </div>
        {participant?.is_admin && (
          <Link href="/admin" className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 font-medium px-3 py-1.5 rounded-lg transition hover:bg-yellow-100">
            ⚙️ Admin
          </Link>
        )}
      </div>

      {/* Próximo jogo em destaque */}
      {nextMatch && (
        <div className="bg-green-600 rounded-2xl p-4 text-white space-y-3">
          <p className="text-green-200 text-xs font-semibold uppercase tracking-wide">
            {new Date(nextMatch.match_date) <= new Date(Date.now() + 24 * 60 * 60 * 1000)
              ? '⚡ Jogo em breve'
              : '📅 Próximo jogo'}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <FlagImage iso={nextMatch.home_iso} name={nextMatch.home_team} size={44} />
              <span className="text-sm font-bold text-center leading-tight">{nextMatch.home_team}</span>
            </div>
            <div className="text-center shrink-0 space-y-1">
              {userPrediction ? (
                <div className="bg-white/20 rounded-xl px-4 py-2">
                  <p className="text-xs text-green-200">Seu palpite</p>
                  <p className="text-2xl font-black">{userPrediction.home_score} × {userPrediction.away_score}</p>
                </div>
              ) : (
                <div className="bg-white/20 rounded-xl px-4 py-2">
                  <p className="text-xs text-green-200">
                    {new Date(nextMatch.match_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </p>
                  <p className="text-lg font-black">
                    {new Date(nextMatch.match_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
              {nextMatch.group_name && (
                <p className="text-xs text-green-200">Grupo {nextMatch.group_name}</p>
              )}
            </div>
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <FlagImage iso={nextMatch.away_iso} name={nextMatch.away_team} size={44} />
              <span className="text-sm font-bold text-center leading-tight">{nextMatch.away_team}</span>
            </div>
          </div>
          {!userPrediction ? (
            <Link href={`/palpites`}
              className="block w-full bg-white text-green-700 font-bold py-2.5 rounded-xl text-center text-sm hover:bg-green-50 transition">
              ✏️ Palpitar agora
            </Link>
          ) : (
            <Link href="/palpites"
              className="block w-full bg-white/20 hover:bg-white/30 text-white font-medium py-2.5 rounded-xl text-center text-sm transition">
              Ver todos os palpites →
            </Link>
          )}
        </div>
      )}

      {/* Meus Bolões */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Meus bolões</h2>
          <Link href="/onboarding" className="text-sm text-green-600 font-medium">+ Novo</Link>
        </div>

        {leagues.map((league) => {
          const r = rankingData.find(x => x.league_id === league.id)
          const entries = r?.entries ?? []
          const myEntry = entries.find(e => e.user_id === user?.id)
          const myPos = myEntry ? entries.indexOf(myEntry) + 1 : null
          const inviteMsg = `⚽ Entra no meu bolão da Copa!\n🏆 *${league.name}*\n\nAcesse: ${ORIGIN}/entrar/${league.code}\nCódigo: *${league.code}*`
          const waUrl = `https://wa.me/?text=${encodeURIComponent(inviteMsg)}`

          return (
            <DashboardBolao
              key={league.id}
              id={league.id}
              name={league.name}
              code={league.code}
              entries={entries}
              myUserId={user?.id ?? ''}
              myPos={myPos}
              myPts={myEntry?.total_points ?? 0}
              inviteMsg={inviteMsg}
              waUrl={waUrl}
            />
          )
        })}

        <JoinBolaoInline userId={user?.id ?? ''} />
      </div>

      {/* Atalhos rápidos */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { href: '/copa',          icon: '🌍', label: 'Jogos da Copa',  sub: 'Grupos · Mata-mata · Artilharia' },
          { href: '/como-funciona', icon: '❓', label: 'Como Funciona',  sub: 'Regras e pontuação' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition">
            <div className="text-2xl mb-1">{item.icon}</div>
            <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
