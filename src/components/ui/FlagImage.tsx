interface Props {
  iso: string
  name: string
  size?: number
}

export default function FlagImage({ iso, name, size = 32 }: Props) {
  if (!iso) return <span className="text-2xl">⚽</span>
  return (
    <img
      src={`https://flagcdn.com/w${size}/${iso}.png`}
      srcSet={`https://flagcdn.com/w${size * 2}/${iso}.png 2x`}
      width={size}
      height={size * 0.67}
      alt={name}
      className="rounded-sm object-cover"
      style={{ width: size, height: size * 0.67 }}
    />
  )
}
