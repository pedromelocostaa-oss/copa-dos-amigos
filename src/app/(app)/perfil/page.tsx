'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  name: string
  email: string
  phone: string
  payment_status: string
  is_admin: boolean
  created_at: string
  paid_at?: string
}

const statusLabel: Record<string, { label: string; color: string }> = {
  pago: { label: 'Pago ✓', color: 'bg-green-100 text-green-700 border-green-200' },
  pendente: { label: 'Pendente ⏳', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  isento: { label: 'Isento ✓', color: 'bg-blue-100 text-blue-700 border-blue-200' },
}

export default function PerfilPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [stats, setStats] = useState({ total: 0, exact: 0, correct: 0, points: 0 })

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('participants').select('*').eq('user_id', user.id).single()
      if (data) {
        setProfile(data)
        setName(data.name)
        setPhone(data.phone ?? '')
      }
      const { data: preds } = await supabase.from('predictions').select('points').eq('user_id', user.id)
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
    const { error } = await supabase.from('participants').update({ name, phone }).eq('user_id', user.id)
    setSaving(false)
    setMsg(error ? 'Erro ao salvar.' : 'Perfil atualizado!')
    setTimeout(() => setMsg(''), 3000)
  }

  if (!profile) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>

  const status = statusLabel[profile.payment_status] ?? statusLabel.pendente

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">👤 Meu Perfil</h1>

      {/* Status de pagamento */}
      <div className={`border rounded-xl p-4 ${status.color}`}>
        <p className="font-semibold text-lg">{status.label}</p>
        {profile.payment_status === 'pendente' && (
          <p className="text-sm mt-1">
            Envie R$20 via PIX para confirmar sua inscrição. Entre em contato com o administrador para mais informações.
          </p>
        )}
        {profile.paid_at && (
          <p className="text-xs mt-1 opacity-70">
            Confirmado em {new Date(profile.paid_at).toLocaleDateString('pt-BR')}
          </p>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pontos', value: stats.points, icon: '⭐' },
          { label: 'Palpites', value: stats.total, icon: '✏️' },
          { label: 'Placar exato', value: stats.exact, icon: '🎯' },
          { label: 'Resultado certo', value: stats.correct, icon: '✓' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border shadow-sm p-4 text-center">
            <div className="text-2xl">{s.icon}</div>
            <div className="text-xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Editar perfil */}
      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Editar dados</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input value={profile.email} disabled
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 text-gray-400" />
        </div>
        {msg && <p className={`text-sm ${msg.startsWith('Erro') ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>}
        <button onClick={saveProfile} disabled={saving}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50">
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR')}
        {profile.is_admin && ' · Administrador'}
      </p>
    </div>
  )
}
