'use client'

import { useToast } from './Toast'

interface ShareButtonProps {
  bolaoCode: string
  bolaoName: string
  className?: string
  children?: React.ReactNode
}

export default function ShareButton({ bolaoCode, bolaoName, className, children }: ShareButtonProps) {
  const { toast } = useToast()
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/entrar/${bolaoCode}`
    : `/entrar/${bolaoCode}`

  const message = `Entra no meu bolão da Copa! 🏆 ${bolaoName} — acesse: ${url}`

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Bolão: ${bolaoName}`, text: message, url })
        return
      } catch {
        // usuário cancelou ou não suportado — cai no fallback
      }
    }
    // Fallback: copia para clipboard
    try {
      await navigator.clipboard.writeText(message)
      toast('Link copiado!', 'success')
    } catch {
      toast('Erro ao copiar. Copie manualmente: ' + url, 'error')
    }
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`

  return (
    <div className="flex gap-2">
      <button
        onClick={handleShare}
        className={className ?? 'flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2.5 rounded-xl transition text-sm min-h-[48px]'}
      >
        {children ?? '📤 Compartilhar'}
      </button>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20bc5a] text-white font-semibold px-4 py-2.5 rounded-xl transition text-sm min-h-[48px]"
      >
        WhatsApp
      </a>
    </div>
  )
}
