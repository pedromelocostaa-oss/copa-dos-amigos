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
  { href: '/como-funciona', label: 'Como Funciona', emoji: '❓' },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('participants').select('is_admin').eq('user_id', user.id).single()
        .then(({ data }) => setIsAdmin(data?.is_admin ?? false))
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="bg-green-700 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-lg shrink-0">⚽ Copa dos Amigos</Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(link => (
            <Link key={link.href} href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${pathname.startsWith(link.href) ? 'bg-green-900' : 'hover:bg-green-600'}`}>
              {link.emoji} {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" className="px-3 py-1.5 rounded-lg text-sm font-medium bg-yellow-500 hover:bg-yellow-400 text-black transition ml-2">
              ⚙️ Admin
            </Link>
          )}
          <Link href="/perfil" className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-600 transition">👤</Link>
          <button onClick={handleLogout} className="ml-1 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-600 transition">Sair</button>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg hover:bg-green-600 transition">
          <div className="space-y-1">
            <span className={`block w-5 h-0.5 bg-white transition-transform ${open ? 'rotate-45 translate-y-1.5' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white transition-opacity ${open ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white transition-transform ${open ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-green-600 px-4 py-3 space-y-1">
          {links.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition ${pathname.startsWith(link.href) ? 'bg-green-900' : 'hover:bg-green-600'}`}>
              <span>{link.emoji}</span> {link.label}
            </Link>
          ))}
          <Link href="/perfil" onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-green-600 transition">
            👤 Meu Perfil
          </Link>
          {isAdmin && (
            <Link href="/admin" onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-yellow-500 text-black hover:bg-yellow-400 transition">
              ⚙️ Painel Admin
            </Link>
          )}
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-red-600 transition text-left">
            🚪 Sair
          </button>
        </div>
      )}
    </nav>
  )
}
