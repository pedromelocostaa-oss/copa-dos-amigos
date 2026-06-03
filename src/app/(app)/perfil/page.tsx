'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

interface Profile {
  name: string
  email: string
  payment_status: string
  is_admin: boolean
  created_at: string
}

const statusConfig: Record<string, { label: string; bg: string; text: string; icon: string; desc: string }> = {
  pago:     { label: 'Pagamento confirmado', bg: 'bg-green-50',  text: 'text-green-700',  icon: '✅', desc: 'Você está habilitado para palpitar!' },
  isento:   { label: 'Isento de pagamento',  bg: 'bg-blue-50',   text: 'text-blue-700',   icon: '✅', desc: 'Você está habilitado para palpitar!' },
  pendente: { label: 'Pagamento pendente',   bg: 'bg-yellow-50', text: 'text-yellow-700', icon: '⏳', desc: 'Faça o pagamento e aguarde a confirmação do organizador.' },
}

export default function PerfilPage() {
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState({ total: 0, exact: 0, correct: 0, points: 0 })

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('participants')
        .select('name, email, payment_status, is_admin, created_at')
        .eq('user_id', user.id)
        .single()
      if (data) {
        setProfile(data)
        setName(data.name)
      }
      const { data: preds } = await supabase
        .from('predictions')
        .select('points')
        .eq('user_id', user.id)
      if (preds) {
        setStats({
          total: preds.length,
          exact: preds.filter(p => p.points === 10).length,
          correct: preds.filter(p => p.points === 5).length,
          points: preds.reduce((sum, p) => sum + (p.points ?? 0), 0),
        })
      }
    })
  }, [])

  async function saveProfile() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('participants').update({ name }).eq('user_id', user.id)
    setSaving(false)
    if (error) {
      toast('Erro ao salvar. Tente novamente.', 'error')
    } else {
      toast('Perfil atualizado!', 'success')
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const status = statusConfig[profile.payment_status] ?? statusConfig.pendente
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="max-w-md mx-auto space-y-5 pb-8">

      {/* Avatar + nome */}
      <div className="flex flex-col items-center gap-3 pt-2">
        <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center text-white text-3xl font-black">
          {initials || '?'}
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">{name}</h1>
          <p className="text-sm text-gray-400">{profile.email}</p>
          {profile.is_admin && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Admin</span>
          )}
        </div>
      </div>

      {/* Status de pagamento */}
      <div className={`${status.bg} rounded-2xl p-4 border ${status.text.replace('text-', 'border-').replace('700', '200')}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{status.icon}</span>
          <div>
            <p className={`font-bold text-sm ${status.text}`}>{status.label}</p>
            <p className={`text-xs mt-0.5 ${status.text} opacity-80`}>{status.desc}</p>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Minhas estatísticas</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: 'Total de pontos',    value: stats.points, icon: '⭐', highlight: true },
            { label: 'Palpites feitos',    value: stats.total,   icon: '✏️' },
            { label: 'Placares exatos',    value: stats.exact,   icon: '🎯' },
            { label: 'Resultados certos',  value: stats.correct, icon: '✓' },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl border p-4 text-center ${s.highlight ? 'bg-green-600 text-white border-green-600' : 'bg-white border-gray-100 shadow-sm'}`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className={`text-2xl font-black ${s.highlight ? 'text-white' : 'text-gray-900'}`}>{s.value}</div>
              <div className={`text-xs font-medium mt-0.5 ${s.highlight ? 'text-green-100' : 'text-gray-400'}`}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Editar nome */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="font-bold text-gray-900">Editar dados</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Seu nome</label>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="Seu nome completo"
            style={{ fontSize: '16px' }}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input value={profile.email} disabled
            className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-400 text-base" />
          <p className="text-xs text-gray-400 mt-1">Email não pode ser alterado</p>
        </div>
        <button onClick={saveProfile} disabled={saving}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-50 min-h-[48px]">
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>

      {/* Info */}
      <p className="text-xs text-gray-400 text-center">
        Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
      </p>

      {/* Logout */}
      <button onClick={handleLogout}
        className="w-full py-3 text-sm text-red-400 hover:text-red-600 font-medium transition border border-red-100 hover:border-red-300 rounded-xl hover:bg-red-50">
        🚪 Sair da conta
      </button>
    </div>
  )
}
