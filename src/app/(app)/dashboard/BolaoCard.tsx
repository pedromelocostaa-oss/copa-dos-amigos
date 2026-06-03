'use client'

import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'

interface Props {
  id: string
  name: string
  code: string
  position: number | null
  totalPoints: number
  inviteMsg: string
  waUrl: string
}

export default function BolaoCard({ id, name, code, position, totalPoints, inviteMsg, waUrl }: Props) {
  const { toast } = useToast()

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteMsg)
      toast('Mensagem copiada! Cole onde quiser.', 'success')
    } catch {
      toast('Não foi possível copiar.', 'error')
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-lg truncate">⚽ {name}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-mono text-sm text-green-700 bg-green-50 px-2 py-0.5 rounded font-bold">{code}</span>
            {position && position > 0 ? (
              <span className="text-xs text-gray-500">{position}º lugar · {totalPoints} pts</span>
            ) : (
              <span className="text-xs text-gray-400">Sem palpites ainda</span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          <Link href={`/palpites?bolao=${id}`}
            className="text-xs bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1.5 rounded-lg transition text-center">
            ✏️ Palpitar
          </Link>
          <Link href={`/ranking?bolao=${id}`}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-3 py-1.5 rounded-lg transition text-center">
            🏆 Ranking
          </Link>
        </div>
      </div>

      {/* Botões de convite */}
      <div className="flex gap-2 pt-1 border-t border-gray-50">
        <a href={waUrl} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#20bc5a] text-white text-xs font-semibold py-2 rounded-lg transition">
          📲 Convidar no WhatsApp
        </a>
        <button onClick={copyInvite}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-lg transition">
          📋 Copiar
        </button>
      </div>
    </div>
  )
}
