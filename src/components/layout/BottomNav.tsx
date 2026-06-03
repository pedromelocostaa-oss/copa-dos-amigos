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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex">
        {tabs.map(tab => {
          const active = pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href))
          return (
            <Link key={tab.href} href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors min-h-[56px] relative ${active ? 'text-green-600' : 'text-gray-500'}`}>
              <span className="text-xl leading-none">{tab.icon}</span>
              <span className="text-[10px] font-medium">{tab.label}</span>
              {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-green-600 rounded-full"
                  style={{ marginBottom: 'env(safe-area-inset-bottom)' }} />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
