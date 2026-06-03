'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const links = [
  { href: '/dashboard',     label: 'Início',        emoji: '🏠' },
  { href: '/palpites',      label: 'Palpites',      emoji: '✏️' },
  { href: '/copa',          label: 'Copa',          emoji: '🌍' },
  { href: '/ranking',       label: 'Ranking',       emoji: '🏆' },
  { href: '/bolao',         label: 'Meu Bolão',     emoji: '⚽' },
  { href: '/como-funciona', label: 'Como Funciona', emoji: '❓' },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = useState(false)
  const [initials, setInitials] = useState('?')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('participants').select('is_admin, name').eq('user_id', user.id).single()
        .then(({ data }) => {
          setIsAdmin(data?.is_admin ?? false)
          const name = data?.name ?? ''
          setInitials(name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || '?')
        })
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="bg-green-700 text-white sticky top-0 z-50">
      {/* ── Mobile: logo + avatar apenas ───────────── */}
      <div className="md:hidden flex items-center justify-between px-4 h-12">
        <Link href="/dashboard" className="font-bold text-base">⚽ Copa dos Amigos</Link>
        <Link href="/perfil"
          className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-sm font-black transition active:opacity-75">
          {initials}
        </Link>
      </div>

      {/* ── Desktop: navbar completa ─────────────── */}
      <div className="hidden md:flex items-center justify-between px-6 py-2.5 max-w-6xl mx-auto">
        <Link href="/dashboard" className="font-bold text-lg shrink-0">⚽ Copa dos Amigos</Link>
        <div className="flex items-center gap-1">
          {links.map(link => (
            <Link key={link.href} href={link.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${pathname.startsWith(link.href) ? 'bg-green-900' : 'hover:bg-green-600'}`}>
              {link.emoji} {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" className="px-3 py-2 rounded-lg text-sm font-medium bg-yellow-500 hover:bg-yellow-400 text-black transition ml-2">
              ⚙️ Admin
            </Link>
          )}
          <Link href="/perfil"
            className="ml-2 w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-sm font-bold transition">
            {initials}
          </Link>
          <button onClick={handleLogout} className="ml-1 px-3 py-2 rounded-lg text-sm hover:bg-red-600 transition opacity-70 hover:opacity-100">
            Sair
          </button>
        </div>
      </div>
    </nav>
  )
}
