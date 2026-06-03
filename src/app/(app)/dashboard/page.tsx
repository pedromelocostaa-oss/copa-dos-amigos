import { createClient } from '@/lib/supabase/server'
import FlagImage from '@/components/ui/FlagImage'
import Link from 'next/link'
import JoinBolaoInline from './JoinBolaoInline'
import BolaoCard from './BolaoCard'

interface LeagueRow {
  id: string
  name: string
  code: string
  owner_id: string
}

interface MemberRow {
  league_id: string
  leagues: LeagueRow
}

const ORIGIN = 'https://copa-dos-amigos.vercel.app'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: participant },
    { data: memberRows },
    { data: nextMatches },
  ] = await Promise.all([
    supabase.from('participants').select('name, is_admin').eq('user_id', user?.id).single(),
    supabase.from('league_members')
      .select('league_id, leagues(id,name,code,owner_id)')
      .eq('user_id', user?.id),
    supabase.from('matches')
      .select('id,home_team,away_team,home_iso,away_iso,match_date,stage')
      .eq('is_finished', false)
      .order('match_date', { ascending: true })
      .limit(4),
  ])

  const firstName = (participant?.name ?? 'Participante').split(' ')[0]
  const leagues = ((memberRows as unknown as MemberRow[]) ?? [])
    .map(m => m.leagues)
    .filter(Boolean)

  // Sem bolão — tela de boas-vindas
  if (leagues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 text-center px-4">
        <div className="text-6xl">⚽</div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bem-vindo, {firstName}!</h1>
          <p className="text-gray-500 mt-2">Você ainda não está em nenhum bolão.</p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Link href="/onboarding"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl transition text-lg text-center">
            🏆 Criar meu bolão
          </Link>
          <JoinBolaoInline userId={user?.id ?? ''} />
          <Link href="/como-funciona"
            className="text-sm text-gray-400 hover:text-green-600 transition text-center py-1">
            Como funciona? →
          </Link>
        </div>
      </div>
    )
  }

  // Busca ranking de cada bolão
  const rankingData = await Promise.all(
    leagues.map(async (league) => {
      const { data } = await supabase
        .from('league_ranking')
        .select('user_id, total_points')
        .eq('league_id', league.id)
        .order('total_points', { ascending: false })
      const entries = data ?? []
      const pos = entries.findIndex(e => e.user_id === user?.id) + 1
      const pts = entries.find(e => e.user_id === user?.id)?.total_points ?? 0
      return { league_id: league.id, position: pos || null, total_points: pts }
    })
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Olá, {firstName} 👋</h1>
          <p className="text-sm text-gray-500">Copa do Mundo 2026</p>
        </div>
        {participant?.is_admin && (
          <Link href="/admin" className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-3 py-1.5 rounded-lg transition">
            Admin →
          </Link>
        )}
      </div>

      {/* Meus Bolões */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Meus bolões</h2>
          <Link href="/onboarding" className="text-sm text-green-600 font-medium hover:underline">+ Criar novo</Link>
        </div>

        {leagues.map((league) => {
          const rank = rankingData.find(r => r.league_id === league.id)
          const inviteMsg = `⚽ Entra no meu bolão da Copa do Mundo 2026!\n🏆 *${league.name}*\n\nAcesse: ${ORIGIN}/entrar/${league.code}\nCódigo: *${league.code}*`
          const waUrl = `https://wa.me/?text=${encodeURIComponent(inviteMsg)}`
          return (
            <BolaoCard
              key={league.id}
              id={league.id}
              name={league.name}
              code={league.code}
              position={rank?.position ?? null}
              totalPoints={rank?.total_points ?? 0}
              inviteMsg={inviteMsg}
              waUrl={waUrl}
            />
          )
        })}

        <JoinBolaoInline userId={user?.id ?? ''} />
      </section>

      {/* Próximos jogos */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Próximos jogos</h2>
          <Link href="/copa" className="text-sm text-green-600 font-medium hover:underline">Ver copa →</Link>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          {!nextMatches?.length ? (
            <p className="text-gray-400 text-sm p-4">Nenhum jogo agendado.</p>
          ) : nextMatches.map(match => (
            <Link key={match.id} href={`/jogos/${match.id}`}
              className="flex items-center px-4 py-3 gap-3 hover:bg-gray-50 transition">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FlagImage iso={match.home_iso} name={match.home_team} size={22} />
                <span className="text-sm font-medium text-gray-800 truncate">{match.home_team}</span>
              </div>
              <div className="text-center shrink-0">
                <p className="text-xs text-gray-400">
                  {new Date(match.match_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </p>
                <p className="text-xs font-bold text-green-600">
                  {new Date(match.match_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                <span className="text-sm font-medium text-gray-800 truncate text-right">{match.away_team}</span>
                <FlagImage iso={match.away_iso} name={match.away_team} size={22} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Atalhos desktop */}
      <div className="hidden md:grid grid-cols-4 gap-3">
        {[
          { href: '/palpites',      icon: '✏️', label: 'Palpites' },
          { href: '/copa',          icon: '🌍', label: 'Copa' },
          { href: '/ranking',       icon: '🏆', label: 'Ranking' },
          { href: '/como-funciona', icon: '❓', label: 'Como Funciona' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center hover:shadow-md transition">
            <div className="text-3xl mb-1">{item.icon}</div>
            <p className="text-sm font-medium text-gray-700">{item.label}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
