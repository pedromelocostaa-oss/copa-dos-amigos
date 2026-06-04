'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const LINKS = [
  { href: '/admin',               label: 'Dashboard',     icon: '📊' },
  { href: '/admin/resultados',    label: 'Resultados',    icon: '⚽' },
  { href: '/admin/gols',          label: 'Gols',          icon: '🥅' },
  { href: '/admin/pagamentos',    label: 'Pagamentos',    icon: '💰' },
  { href: '/admin/participantes', label: 'Participantes', icon: '👥' },
  { href: '/admin/modos',         label: 'Modos',         icon: '🎯' },
]

export default function AdminNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const current = LINKS.find(l => pathname === l.href || (l.href !== '/admin' && pathname.startsWith(l.href)))

  return (
    <nav className="bg-gray-900 text-white sticky top-0 z-50">
      {/* Mobile: barra slim + dropdown */}
      <div className="md:hidden flex items-center justify-between px-4 h-12">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-yellow-400 font-bold text-sm shrink-0">⚙️ Admin</span>
          {current && (
            <span className="text-gray-300 text-sm truncate">· {current.icon} {current.label}</span>
          )}
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-white shrink-0"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        >
          <span className="text-lg">{open ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden bg-gray-800 border-t border-gray-700 divide-y divide-gray-700">
          {LINKS.map(l => {
            const active = pathname === l.href || (l.href !== '/admin' && pathname.startsWith(l.href))
            return (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-5 min-h-[52px] text-sm font-medium transition ${active ? 'text-yellow-400 bg-gray-700' : 'text-gray-200 hover:bg-gray-700'}`}>
                <span className="text-xl w-6 text-center">{l.icon}</span>
                {l.label}
              </Link>
            )
          })}
          <Link href="/dashboard" onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-5 min-h-[52px] text-sm text-gray-400 hover:text-white">
            <span className="text-xl w-6 text-center">←</span>
            Sair do admin
          </Link>
        </div>
      )}

      {/* Desktop: barra horizontal */}
      <div className="hidden md:flex items-center gap-1 px-6 py-2.5 max-w-6xl mx-auto">
        <span className="text-yellow-400 font-bold mr-3">⚙️ Admin</span>
        {LINKS.map(l => {
          const active = pathname === l.href || (l.href !== '/admin' && pathname.startsWith(l.href))
          return (
            <Link key={l.href} href={l.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${active ? 'bg-gray-700 text-yellow-400' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}>
              {l.icon} {l.label}
            </Link>
          )
        })}
        <Link href="/dashboard" className="ml-auto text-sm text-gray-400 hover:text-white transition">
          ← Voltar ao app
        </Link>
      </div>
    </nav>
  )
}
