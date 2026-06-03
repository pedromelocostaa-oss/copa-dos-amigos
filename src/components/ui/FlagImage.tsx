import Image from 'next/image'

// flagcdn.com suporta: w20, w40, w80, w160, w320, w640
function cdnWidth(px: number): 20 | 40 | 80 | 160 {
  if (px <= 20) return 20
  if (px <= 40) return 40
  if (px <= 80) return 80
  return 160
}

interface Props {
  iso: string
  name: string
  size?: number
  className?: string
}

export default function FlagImage({ iso, name, size = 40, className = '' }: Props) {
  if (!iso) return <span className="text-2xl" aria-label="Bandeira não disponível">⚽</span>

  const w = cdnWidth(size)
  const h = Math.round(size * 0.67)

  return (
    <Image
      src={`https://flagcdn.com/w${w}/${iso}.png`}
      width={size}
      height={h}
      alt={`Bandeira: ${name}`}
      className={`rounded-sm object-cover flex-shrink-0 ${className}`}
      // flagcdn devolve PNG otimizado; unoptimized evita double-request para um CDN externo
      unoptimized
    />
  )
}
