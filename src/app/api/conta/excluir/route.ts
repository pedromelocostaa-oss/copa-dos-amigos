import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function DELETE() {
  const cookieStore = await cookies()

  // Cliente normal para pegar o usuário autenticado
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // Cliente admin para deletar o usuário (requer service_role)
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Remove dados do usuário em cascata (participants tem ON DELETE CASCADE)
  // Mas por segurança também limpamos league_members e predictions manualmente
  await Promise.all([
    supabase.from('predictions').delete().eq('user_id', user.id),
    supabase.from('extra_predictions').delete().eq('user_id', user.id),
    supabase.from('league_members').delete().eq('user_id', user.id),
  ])

  // Deleta o usuário no Supabase Auth (isso dispara ON DELETE CASCADE no participants)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)

  if (error) {
    return NextResponse.json({ error: 'Erro ao excluir conta' }, { status: 500 })
  }

  // Faz logout
  await supabase.auth.signOut()

  return NextResponse.json({ success: true })
}
