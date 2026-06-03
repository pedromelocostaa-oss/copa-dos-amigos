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
}

const MEDALS = ['🥇', '🥈', '🥉']

export default function DashboardBolao({ id, name, code, entries, myUserId, myPos, myPts, inviteMsg, waUrl }: Props) {
  const { toast } = useToast()

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteMsg)
      toast('Mensagem copiada!', 'success')
    } catch {
      toast('Não foi possível copiar.', 'error')
    }
  }

  const top3 = entries.slice(0, 3)
  const maxPts = top3[0]?.total_points || 1

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header do bolão */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <p className="font-bold text-gray-900 text-base truncate">⚽ {name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-mono text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded font-bold">{code}</span>
            {myPos && <span className="text-xs text-gray-400">{myPos}º · {myPts} pts</span>}
          </div>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <Link href={`/palpites?bolao=${id}`}
            className="text-xs bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1.5 rounded-lg transition">
            ✏️
          </Link>
          <Link href={`/ranking?bolao=${id}`}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-3 py-1.5 rounded-lg transition">
            🏆
          </Link>
        </div>
      </div>

      {/* Mini ranking */}
      {top3.length > 0 && (
        <div className="px-4 pb-3 space-y-2">
          {top3.map((entry, i) => {
            const isMe = entry.user_id === myUserId
            const pct = Math.round((entry.total_points / maxPts) * 100)
            return (
              <div key={entry.user_id} className={`space-y-1 ${isMe ? 'opacity-100' : 'opacity-80'}`}>
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-medium ${isMe ? 'text-green-700' : 'text-gray-700'}`}>
                    {MEDALS[i]} {entry.name}{isMe ? ' (você)' : ''}
                  </span>
                  <span className="font-bold text-gray-900">{entry.total_points} pts</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isMe ? 'bg-green-500' : i === 0 ? 'bg-yellow-400' : 'bg-gray-300'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
          {entries.length > 3 && (
            <p className="text-xs text-gray-400 text-center">+{entries.length - 3} participantes</p>
          )}
        </div>
      )}

      {entries.length === 0 && (
        <p className="px-4 pb-3 text-xs text-gray-400">Nenhum palpite ainda. Seja o primeiro!</p>
      )}

      {/* Botões convite */}
      <div className="flex border-t border-gray-50">
        <a href={waUrl} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-[#25D366] hover:bg-green-50 transition border-r border-gray-50">
          📲 Convidar
        </a>
        <button onClick={copyInvite}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-gray-500 hover:bg-gray-50 transition">
          📋 Copiar link
        </button>
      </div>
    </div>
  )
}
