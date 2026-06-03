'use client'

import { useToast } from '@/components/ui/Toast'

interface Props {
  text: string
  className?: string
  children?: React.ReactNode
}

export default function CopyButton({ text, className, children }: Props) {
  const { toast } = useToast()

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      toast('Copiado!', 'success')
    } catch {
      toast('Não foi possível copiar.', 'error')
    }
  }

  return (
    <button onClick={copy} className={className}>
      {children ?? '📋'}
    </button>
  )
}
