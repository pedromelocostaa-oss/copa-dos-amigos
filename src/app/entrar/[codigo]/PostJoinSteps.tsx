'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  leagueName: string
  leagueCode: string
  memberCount: number
  joinAction: () => Promise<void>
}

export default function PostJoinSteps({ leagueName, leagueCode, memberCount, joinAction }: Props) {
  const [joined,  setJoined]  = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleJoin() {
    setLoading(true)
    await joinAction()
    setJoined(true)
    setLoading(false)
  }

  // ── Antes de entrar: preview do bolão ────────────────────────────────────
  if (!joined) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="text-5xl">⚽</div>
          <h1 className="text-2xl font-bold text-gray-900">{leagueName}</h1>
          <p className="text-gray-500 text-sm">Você foi convidado para participar!</p>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-xl p-4">
          <div className="text-center">
            <p className="text-3xl font-black text-green-700">{memberCount}</p>
            <p className="text-xs text-gray-500">participantes</p>
          </div>
          <div className="text-center">
            <p className="font-mono font-black text-green-700 text-2xl">{leagueCode}</p>
            <p className="text-xs text-gray-500">código</p>
          </div>
        </div>

        <form
          action={joinAction}
          onSubmit={async e => { e.preventDefault(); await handleJoin() }}
        >
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl transition text-xl shadow-lg disabled:opacity-50 min-h-[60px]"
          >
            {loading ? 'Entrando...' : 'Entrar no bolão ⚽'}
          </button>
        </form>
      </div>
    )
  }

  // ── Após entrar: próximos passos (P1.1 — palpitar é o CTA primário) ──────
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md space-y-6">
      <div className="text-center space-y-2">
        <div className="text-5xl">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900">Bem-vindo ao {leagueName}!</h1>
        <p className="text-gray-500 text-sm">Você já está dentro. Hora de palpitar!</p>
      </div>

      {/* Checklist — palpitar primeiro, pagamento secundário */}
      <div className="space-y-3">
        {/* ✅ Entrou */}
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
            ✓
          </div>
          <div>
            <p className="font-bold text-green-800 text-sm">Entrou no bolão!</p>
            <p className="text-xs text-green-600 mt-0.5">
              Código: <span className="font-mono font-bold">{leagueCode}</span>
            </p>
          </div>
        </div>

        {/* → Palpitar (CTA primário) */}
        <div className="flex items-start gap-3 bg-blue-50 border-2 border-blue-400 rounded-xl p-4">
          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
            2
          </div>
          <div className="flex-1">
            <p className="font-bold text-blue-800 text-sm">Cadastre seus palpites ✏️</p>
            <p className="text-xs text-blue-700 mt-0.5">
              10 pts placar exato · 5 pts resultado certo. Não perca os primeiros jogos!
            </p>
          </div>
        </div>

        {/* → Pagamento (nudge secundário — sem destaque) */}
        <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
            3
          </div>
          <div>
            <p className="font-medium text-gray-600 text-sm">Confirme o pagamento</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Combine com o organizador — sem pressa agora.
            </p>
          </div>
        </div>

        {/* → Ranking */}
        <div className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-xl p-4">
          <div className="w-8 h-8 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
            4
          </div>
          <div>
            <p className="font-medium text-gray-500 text-sm">Acompanhe o ranking 🏆</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Pontos somados automaticamente após cada jogo.
            </p>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="space-y-3">
        {/* CTA primário: palpitar */}
        <button
          onClick={() => router.push('/palpites')}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl transition text-base min-h-[56px]"
        >
          ✏️ Cadastrar meus palpites agora
        </button>

        {/* CTA secundário: dashboard */}
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full flex items-center justify-center min-h-[48px] text-sm text-gray-400 hover:text-gray-600 transition"
        >
          Ver meu dashboard →
        </button>
      </div>
    </div>
  )
}
