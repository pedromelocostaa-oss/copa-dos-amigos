'use client'

import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'

interface RankEntry {
  user_id: string
  name: string
  total_points: number
  exact_scores: number
}

interface Props {
  id: string
  name: string
  code: string
  entries: RankEntry[]
  myUserId: string
  myPos: number | null
  myPts: number
  inviteMsg: string
  waUrl: string
  entryFee?: number   // centavos
  prizePool?: number  // reais
}

const MEDALS = ['🥇', '🥈', '🥉']

export default function DashboardBolao({ id, name, code, entries, myUserId, myPos, myPts, inviteMsg, waUrl, entryFee = 0, prizePool = 0 }: Props) {
  const { toast } = useToast()

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteMsg)
      toast('Mensagem copiada! Cole no WhatsApp, Instagram ou onde quiser.', 'success')
    } catch {
      toast('Não foi possível copiar automaticamente.', 'error')
    }
  }

  const top3 = entries.slice(0, 3)
  const maxPts = top3[0]?.total_points || 1

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-base truncate">⚽ {name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="font-mono text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-lg font-bold tracking-wider">{code}</span>
            {myPos && myPos > 0
              ? <span className="text-xs text-gray-500 font-medium">{myPos}º lugar · {myPts} pts</span>
              : <span className="text-xs text-gray-400">Sem palpites ainda</span>}
            {prizePool > 0 && (
              <span className="text-xs text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-lg font-semibold">
                🏆 R${prizePool.toFixed(0)}
              </span>
            )}
          </div>
        </div>

        {/* Botões de ação — touch targets 44x44 */}
        <div className="flex gap-2 shrink-0">
          <Link href={`/palpites?bolao=${id}`}
            className="min-w-[44px] min-h-[44px] flex flex-col items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded-xl transition active:opacity-80 px-3 gap-0.5">
            <span className="text-base leading-none">✏️</span>
            <span className="text-[10px] font-semibold">Palpitar</span>
          </Link>
          <Link href={`/ranking?bolao=${id}`}
            className="min-w-[44px] min-h-[44px] flex flex-col items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition active:opacity-80 px-3 gap-0.5">
            <span className="text-base leading-none">🏆</span>
            <span className="text-[10px] font-semibold">Ranking</span>
          </Link>
        </div>
      </div>

      {/* Mini ranking com barras */}
      {top3.length > 0 && (
        <div className="px-4 pb-3 space-y-2.5">
          {top3.map((entry, i) => {
            const isMe = entry.user_id === myUserId
            const pct = maxPts > 0 ? Math.round((entry.total_points / maxPts) * 100) : 0
            return (
              <div key={entry.user_id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={`font-semibold truncate max-w-[60%] ${isMe ? 'text-green-700' : 'text-gray-700'}`}>
                    {MEDALS[i]} {isMe ? `${entry.name} (você)` : entry.name}
                  </span>
                  <span className="font-bold text-gray-900 shrink-0">{entry.total_points} pts</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isMe ? 'bg-green-500' : i === 0 ? 'bg-yellow-400' : 'bg-gray-300'}`}
                    style={{ width: `${Math.max(pct, 4)}%` }}
                  />
                </div>
              </div>
            )
          })}
          {entries.length > 3 && (
            <Link href={`/ranking?bolao=${id}`} className="block text-xs text-green-600 text-center pt-1 font-medium">
              Ver ranking completo ({entries.length} participantes) →
            </Link>
          )}
        </div>
      )}

      {entries.length === 0 && (
        <p className="px-4 pb-3 text-xs text-gray-400 italic">Nenhum palpite feito ainda. Seja o primeiro!</p>
      )}

      {/* Botões de convite — altura 48px */}
      <div className="flex border-t border-gray-100">
        <a href={waUrl} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 min-h-[52px] text-sm font-bold text-[#25D366] hover:bg-green-50 transition active:bg-green-100 border-r border-gray-100">
          <span className="text-lg">📲</span>
          <span>Convidar</span>
        </a>
        <button onClick={copyInvite}
          className="flex-1 flex items-center justify-center gap-2 min-h-[52px] text-sm font-medium text-gray-500 hover:bg-gray-50 transition active:bg-gray-100">
          <span className="text-lg">📋</span>
          <span>Copiar link</span>
        </button>
      </div>
    </div>
  )
}
