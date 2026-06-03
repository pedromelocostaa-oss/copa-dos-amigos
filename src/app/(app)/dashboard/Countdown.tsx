'use client'

import { useEffect, useState } from 'react'

interface Props {
  matchDate: string  // ISO string
}

function getTimeLeft(target: Date) {
  const diff = target.getTime() - Date.now()
  if (diff <= 0) return null
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return { h, m, s, diff }
}

export default function Countdown({ matchDate }: Props) {
  const target = new Date(matchDate)
  const [left, setLeft] = useState(() => getTimeLeft(target))

  useEffect(() => {
    const id = setInterval(() => {
      const t = getTimeLeft(target)
      setLeft(t)
      if (!t) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [matchDate])

  if (!left) {
    return (
      <span className="inline-flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
        🔴 Ao vivo
      </span>
    )
  }

  // > 24h: mostra só dias/horas
  if (left.diff > 24 * 3600000) {
    const days = Math.floor(left.diff / 86400000)
    return (
      <span className="text-green-200 text-xs font-medium">
        em {days}d {left.h % 24}h
      </span>
    )
  }

  // < 2h: urgência
  const isUrgent = left.diff < 2 * 3600000
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${isUrgent ? 'bg-orange-400 text-white' : 'bg-white/20 text-white'}`}>
      {isUrgent && '⚡ '}
      {left.h > 0 ? `${left.h}h ${String(left.m).padStart(2,'0')}min` : `${left.m}min ${String(left.s).padStart(2,'0')}s`}
    </span>
  )
}
