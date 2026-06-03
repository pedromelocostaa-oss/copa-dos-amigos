import { createClient } from '@/lib/supabase/server'
import FlagImage from '@/components/ui/FlagImage'
import Link from 'next/link'
import CopaClient from './CopaClient'

const NEWS = [
  {
    source: 'FIFA',
    title: 'Copa do Mundo 2026: 48 seleções, 3 países, 104 jogos',
    summary: 'Pela primeira vez na história, três países sediam juntos: EUA, Canadá e México. O Brasil estreia no Grupo C.',
    tag: '🏆 Formato',
    href: 'https://www.fifa.com/fifaplus/pt/tournaments/mens/worldcup/canadamexicousa2026',
  },
  {
    source: 'ESPN',
    title: 'Grupos da Copa 2026: Brasil, Argentina e favoritos',
    summary: 'Argentina no Grupo J, França no Grupo I, Espanha no Grupo H. Confira os grupos completos e as principais ameaças.',
    tag: '📋 Grupos',
    href: 'https://www.espn.com.br/futebol/copa-do-mundo',
  },
  {
    source: 'Globo Esporte',
    title: 'Seleção Brasileira: convocação e preparação para a Copa',
    summary: 'Vinícius Jr., Rodrygo e companhia se preparam para a Copa sob o comando de Carlo Ancelotti.',
    tag: '🇧🇷 Brasil',
    href: 'https://ge.globo.com/futebol/selecao-brasileira/',
  },
  {
    source: 'UOL Esporte',
    title: 'Estádios da Copa 2026: os maiores e mais modernos do mundo',
    summary: 'MetLife, SoFi, Azteca. Conheça as 16 arenas que receberão os jogos da Copa do Mundo 2026.',
    tag: '🏟️ Estádios',
    href: 'https://esporte.uol.com.br/futebol/copa-do-mundo/',
  },
]

export default async function CopaPage() {
  const supabase = await createClient()

  const [{ data: standings }, { data: allMatches }, { data: scorers }] = await Promise.all([
    supabase.from('group_standings').select('*'),
    supabase.from('matches')
      .select('id,home_team,away_team,home_iso,away_iso,match_date,stage,group_name,home_score,away_score,is_finished')
      .order('match_date', { ascending: true }),
    supabase.from('top_scorers').select('*').limit(10),
  ])

  const nextMatches = (allMatches ?? []).filter(m => !m.is_finished).slice(0, 8)
  const finishedMatches = (allMatches ?? []).filter(m => m.is_finished)

  return (
    <CopaClient
      standings={standings ?? []}
      nextMatches={nextMatches}
      finishedMatches={finishedMatches}
      scorers={scorers ?? []}
      news={NEWS}
    />
  )
}
