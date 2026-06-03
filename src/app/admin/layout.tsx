import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: participant } = await supabase
    .from('participants')
    .select('is_admin')
    .eq('user_id', user?.id)
    .single()

  if (!participant?.is_admin) redirect('/dashboard')

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-gray-900 text-white px-6 py-3 flex items-center gap-4">
        <span className="font-bold text-yellow-400">⚙️ Admin</span>
        {[
          { href: '/admin', label: 'Dashboard' },
          { href: '/admin/participantes', label: 'Participantes' },
          { href: '/admin/pagamentos', label: 'Pagamentos' },
          { href: '/admin/resultados', label: 'Resultados' },
        ].map(l => (
          <Link key={l.href} href={l.href} className="text-sm hover:text-yellow-400 transition">
            {l.label}
          </Link>
        ))}
        <Link href="/dashboard" className="ml-auto text-sm text-gray-400 hover:text-white">
          ← Voltar ao app
        </Link>
      </nav>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">{children}</main>
    </div>
  )
}
