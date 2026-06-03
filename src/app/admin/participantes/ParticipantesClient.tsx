'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Participant, PaymentStatus } from '@/types'

export default function ParticipantesClient({ participants: initial }: { participants: Participant[] }) {
  const supabase = createClient()
  const [participants, setParticipants] = useState(initial)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'todos' | PaymentStatus>('todos')

  async function toggleAdmin(id: string, current: boolean) {
    await supabase.from('participants').update({ is_admin: !current }).eq('id', id)
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, is_admin: !current } : p))
  }

  const badge: Record<PaymentStatus, string> = {
    pago: 'bg-green-100 text-green-700',
    pendente: 'bg-yellow-100 text-yellow-700',
    isento: 'bg-blue-100 text-blue-700',
  }

  const filtered = participants.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'todos' || p.payment_status === filter
    return matchSearch && matchFilter
  })

  const counts = {
    total: participants.length,
    pago: participants.filter(p => p.payment_status === 'pago').length,
    pendente: participants.filter(p => p.payment_status === 'pendente').length,
    isento: participants.filter(p => p.payment_status === 'isento').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">👥 Participantes</h1>
        <div className="text-sm text-gray-500">
          {counts.total} total · {counts.pago} pagos · {counts.pendente} pendentes · {counts.isento} isentos
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome ou email..."
          className="flex-1 min-w-48 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        <div className="flex gap-2">
          {(['todos', 'pago', 'pendente', 'isento'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition ${filter === f ? 'bg-green-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Participante</th>
              <th className="px-4 py-3 text-left">Contato</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Admin</th>
              <th className="px-4 py-3 text-left">Cadastro</th>
            </tr>
          </thead>
          <tbody>
            {!filtered.length ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Nenhum participante encontrado.</td></tr>
            ) : filtered.map(p => (
              <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50 transition">
                <td className="px-4 py-3">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.email}</p>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {(p as any).phone || '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${badge[p.payment_status]}`}>
                    {p.payment_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleAdmin(p.id, p.is_admin)}
                    className={`w-10 h-5 rounded-full transition-colors ${p.is_admin ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <span className={`block w-4 h-4 rounded-full bg-white shadow mx-0.5 transition-transform ${p.is_admin ? 'translate-x-4.5' : ''}`} />
                  </button>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {new Date(p.created_at).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
