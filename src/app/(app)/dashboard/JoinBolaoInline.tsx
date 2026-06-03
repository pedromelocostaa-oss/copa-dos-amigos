'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import Link from 'next/link'

export default function JoinBolaoInline({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  async function handleJoin() {
    const c = code.trim().toUpperCase()
    if (c.length < 4) return
    setLoading(true)
    const { data: league } = await supabase.from('leagues').select('id,name').eq('code', c).single()
    if (!league) { toast('Código inválido. Verifique e tente novamente.', 'error'); setLoading(false); return }
    await supabase.from('league_members').upsert(
      { league_id: league.id, user_id: userId },
      { onConflict: 'league_id,user_id' }
    )
    toast(`Entrou em "${league.name}"!`, 'success')
    router.refresh()
    setCode(''); setOpen(false); setLoading(false)
  }

  if (!open) {
    return (
      <div className="flex gap-2">
        <button onClick={() => setOpen(true)}
          className="flex-1 min-h-[56px] flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-green-400 text-gray-500 hover:text-green-600 rounded-2xl text-sm font-medium transition active:opacity-70">
          🔑 Entrar em outro bolão
        </button>
        <Link href="/onboarding"
          className="min-w-[56px] min-h-[56px] flex items-center justify-center border-2 border-dashed border-gray-200 hover:border-green-400 text-gray-500 hover:text-green-600 rounded-2xl text-xl transition active:opacity-70">
          ➕
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-green-500 p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="font-bold text-gray-900">Entrar com código</p>
        <button onClick={() => { setOpen(false); setCode('') }}
          className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition text-xl">
          ×
        </button>
      </div>
      <input value={code} onChange={e => setCode(e.target.value.toUpperCase())}
        onKeyDown={e => e.key === 'Enter' && handleJoin()}
        maxLength={6} placeholder="AB12CD" autoFocus
        className="w-full border-2 border-gray-200 focus:border-green-500 rounded-xl px-4 py-4 text-center text-3xl font-mono font-black tracking-widest uppercase focus:outline-none transition" />
      <button onClick={handleJoin} disabled={code.length < 4 || loading}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-40 min-h-[52px] text-base">
        {loading ? 'Entrando...' : 'Entrar no bolão ⚽'}
      </button>
    </div>
  )
}
