'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const links = [
  { href: '/dashboard', label: '🏠 Início' },
  { href: '/palpites', label: '✏️ Palpites' },
  { href: '/ranking', label: '🏆 Ranking' },
  { href: '/ligas', label: '⚽ Ligas' },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="bg-green-700 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-lg">⚽ Copa dos Amigos</Link>
        <div className="flex items-center gap-1">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                pathname.startsWith(link.href)
                  ? 'bg-green-900'
                  : 'hover:bg-green-600'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="ml-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-900 hover:bg-red-700 transition"
          >
            Sair
          </button>
        </div>
      </div>
    </nav>
  )
}
