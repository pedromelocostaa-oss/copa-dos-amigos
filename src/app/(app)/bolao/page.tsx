import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function BolaoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: participant } = await supabase
    .from('participants')
    .select('name, is_admin, payment_status')
    .eq('user_id', user?.id)
    .single()

  // Pega primeiro bolão do usuário
  const { data: memberRow } = await supabase
    .from('league_members')
    .select('league_id, leagues(id,name,code,owner_id)')
    .eq('user_id', user?.id)
    .limit(1)
    .single()

  const league = memberRow?.leagues as unknown as { id: string; name: string; code: string; owner_id: string } | null
  const isOwner = league?.owner_id === user?.id
  const isAdmin = participant?.is_admin

  if (!league) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <p className="text-gray-400">Você não está em nenhum bolão.</p>
        <Link href="/onboarding"
          className="bg-green-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-green-700 transition">
          Criar ou entrar em um bolão
        </Link>
      </div>
    )
  }

  const { data: members } = await supabase
    .from('league_members')
    .select('id, user_id, joined_at, participants(name, email, payment_status)')
    .eq('league_id', league.id)
    .order('joined_at', { ascending: true })

  const origin = 'https://copa-dos-amigos.vercel.app'
  const inviteMsg = `⚽ Entra no meu bolão da Copa!\n🏆 *${league.name}*\nAcesse: ${origin}/entrar/${league.code}\nCódigo: *${league.code}*`
  const waUrl = `https://wa.me/?text=${encodeURIComponent(inviteMsg)}`

  const paymentBadge: Record<string, string> = {
    pago:     'bg-green-100 text-green-700',
    pendente: 'bg-yellow-100 text-yellow-700',
    isento:   'bg-blue-100 text-blue-700',
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">⚽ {league.name}</h1>
          <p className="text-sm text-gray-500">{members?.length ?? 0} participantes</p>
        </div>
        {(isOwner || isAdmin) && (
          <Link href="/admin"
            className="text-xs text-green-600 font-medium border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-50 transition">
            Admin →
          </Link>
        )}
      </div>

      {/* Código + Compartilhar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Código de convite</p>
            <p className="font-mono font-bold text-4xl tracking-widest text-green-700 mt-0.5">{league.code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bc5a] text-white font-semibold py-3 rounded-xl transition text-sm">
            📲 Convidar no WhatsApp
          </a>
          <button
            onClick={`(async () => { try { await navigator.clipboard.writeText(${JSON.stringify(inviteMsg)}); } catch(e) {} })()` as unknown as () => void}
            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-xl transition">
            📋
          </button>
        </div>
      </div>

      {/* Membros */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">Participantes</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {!members?.length ? (
            <p className="text-gray-400 text-sm p-4">Nenhum membro ainda.</p>
          ) : (members as unknown as Array<{
              id: string; user_id: string; joined_at: string;
              participants: { name: string; email: string; payment_status: string } | null
            }>).map(member => {
            const isMe = member.user_id === user?.id
            const p = member.participants
            return (
              <div key={member.id}
                className={`flex items-center px-4 py-3 gap-3 ${isMe ? 'bg-green-50' : ''}`}>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                  {p?.name?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate text-sm">
                    {p?.name ?? 'Desconhecido'}
                    {isMe && <span className="ml-1 text-xs text-green-600">(você)</span>}
                  </p>
                  {(isOwner || isAdmin) && p?.email && (
                    <p className="text-xs text-gray-400 truncate">{p.email}</p>
                  )}
                </div>
                {(isOwner || isAdmin || isMe) && p?.payment_status && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize shrink-0 ${paymentBadge[p.payment_status] ?? ''}`}>
                    {p.payment_status}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
