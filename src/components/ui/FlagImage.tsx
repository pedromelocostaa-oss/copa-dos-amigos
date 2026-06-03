// flagcdn.com only supports: w20, w40, w80, w160, w320, w640
function validSize(px: number): 20 | 40 | 80 | 160 {
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
  if (!iso) return <span className="text-2xl">⚽</span>
  const cdnSize = validSize(size)
  const cdnSize2x = validSize(size * 2)
  return (
    <img
      src={`https://flagcdn.com/w${cdnSize}/${iso}.png`}
      srcSet={`https://flagcdn.com/w${cdnSize2x}/${iso}.png 2x`}
      width={size}
      height={Math.round(size * 0.67)}
      alt={name}
      className={`rounded-sm object-cover flex-shrink-0 ${className}`}
    />
  )
}
