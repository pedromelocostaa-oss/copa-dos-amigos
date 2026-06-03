'use client'

import { useRef, useState } from 'react'
import { useToast } from '@/components/ui/Toast'

interface Entry {
  name: string
  total_points: number
  exact_scores: number
  user_id: string
}

interface Props {
  ranking: Entry[]
  myUserId: string
  leagueName: string
}

const BG   = '#15803d'
const GOLD = '#fbbf24'
const WHITE = '#ffffff'
const LIGHT = 'rgba(255,255,255,0.12)'

function drawCanvas(
  canvas: HTMLCanvasElement,
  ranking: Entry[],
  myUserId: string,
  leagueName: string,
) {
  const W = 600, H = 340
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Fundo gradiente
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, '#166534')
  grad.addColorStop(1, BG)
  ctx.fillStyle = grad
  ctx.roundRect(0, 0, W, H, 20)
  ctx.fill()

  // Topo
  ctx.fillStyle = WHITE
  ctx.font = 'bold 13px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText('🏆 RANKING', W / 2, 36)

  ctx.font = 'bold 22px system-ui'
  ctx.fillStyle = GOLD
  ctx.fillText(leagueName, W / 2, 62)

  // Top 3 ou top N
  const top = ranking.slice(0, Math.min(3, ranking.length))
  const medals = ['🥇', '🥈', '🥉']
  const startY = 95

  top.forEach((e, i) => {
    const y = startY + i * 56
    const isMe = e.user_id === myUserId

    // Fundo do item
    ctx.fillStyle = isMe ? 'rgba(254,243,199,0.25)' : LIGHT
    ctx.roundRect(24, y, W - 48, 48, 10)
    ctx.fill()

    // Medalha
    ctx.font = '24px system-ui'
    ctx.textAlign = 'left'
    ctx.fillText(medals[i], 36, y + 32)

    // Nome
    ctx.font = isMe ? 'bold 16px system-ui' : '15px system-ui'
    ctx.fillStyle = isMe ? GOLD : WHITE
    const displayName = e.name.length > 18 ? e.name.substring(0, 17) + '…' : e.name
    ctx.fillText(`${displayName}${isMe ? ' (você)' : ''}`, 72, y + 32)

    // Pontos
    ctx.textAlign = 'right'
    ctx.font = 'bold 16px system-ui'
    ctx.fillStyle = isMe ? GOLD : WHITE
    ctx.fillText(`${e.total_points} pts`, W - 36, y + 32)
  })

  // Minha posição se não está no top 3
  const myPos = ranking.findIndex(e => e.user_id === myUserId)
  if (myPos >= 3) {
    const me = ranking[myPos]
    const y = startY + top.length * 56 + 8
    ctx.fillStyle = 'rgba(254,243,199,0.2)'
    ctx.roundRect(24, y, W - 48, 44, 10)
    ctx.fill()
    ctx.fillStyle = GOLD
    ctx.font = 'bold 14px system-ui'
    ctx.textAlign = 'left'
    ctx.fillText(`${myPos + 1}º você — ${me.name}`, 36, y + 28)
    ctx.textAlign = 'right'
    ctx.fillText(`${me.total_points} pts`, W - 36, y + 28)
  }

  // Rodapé
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = '11px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText('copa-dos-amigos.vercel.app  ⚽', W / 2, H - 14)
}

export default function ShareRankingButton({ ranking, myUserId, leagueName }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleShare() {
    setLoading(true)
    try {
      const canvas = canvasRef.current!
      drawCanvas(canvas, ranking, myUserId, leagueName)

      canvas.toBlob(async blob => {
        if (!blob) { toast('Erro ao gerar imagem.', 'error'); setLoading(false); return }

        // Tenta Web Share API (funciona no mobile)
        if (navigator.share && navigator.canShare?.({ files: [new File([blob], 'ranking.png', { type: 'image/png' })] })) {
          await navigator.share({
            title: `Ranking — ${leagueName}`,
            text: '🏆 Olha o ranking do nosso bolão da Copa!',
            files: [new File([blob], 'ranking.png', { type: 'image/png' })],
          })
        } else {
          // Fallback: download direto
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url; a.download = `ranking-${leagueName}.png`; a.click()
          URL.revokeObjectURL(url)
          toast('Imagem baixada! Compartilhe onde quiser.', 'success')
        }
        setLoading(false)
      }, 'image/png')
    } catch (e) {
      console.error(e)
      toast('Não foi possível gerar a imagem.', 'error')
      setLoading(false)
    }
  }

  return (
    <>
      {/* Canvas oculto — só usado para renderizar a imagem */}
      <canvas ref={canvasRef} className="hidden" />

      <button
        onClick={handleShare}
        disabled={loading || ranking.length === 0}
        className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-gray-50 transition disabled:opacity-40 min-h-[44px]"
      >
        <span className="text-base">📸</span>
        {loading ? 'Gerando...' : 'Compartilhar ranking'}
      </button>
    </>
  )
}
