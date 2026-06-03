import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminNav from './AdminNav'

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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AdminNav />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-5 pb-8">{children}</main>
    </div>
  )
}
