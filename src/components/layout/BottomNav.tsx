'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/dashboard', label: 'Início',   icon: '🏠' },
  { href: '/palpites',  label: 'Palpites', icon: '✏️' },
  { href: '/copa',      label: 'Copa',     icon: '🌍' },
  { href: '/ranking',   label: 'Ranking',  icon: '🏆' },
  { href: '/perfil',    label: 'Perfil',   icon: '👤' },
]

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)', boxShadow: '0 -2px 12px rgba(0,0,0,0.08)' }}>
      <div className="flex h-[60px]">
        {tabs.map(tab => {
          const active = pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href))
          return (
            <Link key={tab.href} href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative min-h-[60px] ${active ? 'text-green-600' : 'text-gray-400 active:text-green-500'}`}>
              {active && (
                <span className="absolute top-0 left-[15%] right-[15%] h-[3px] bg-green-600 rounded-full" />
              )}
              <span className="text-[22px] leading-none">{tab.icon}</span>
              <span className={`text-[10px] leading-tight ${active ? 'font-bold text-green-600' : 'font-medium'}`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
