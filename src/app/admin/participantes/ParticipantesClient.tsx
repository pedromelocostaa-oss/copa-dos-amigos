'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Participant, PaymentStatus } from '@/types'
import { useToast } from '@/components/ui/Toast'

const BADGE: Record<PaymentStatus, string> = {
  pago:     'bg-green-100 text-green-700 border-green-200',
  pendente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  isento:   'bg-blue-100 text-blue-700 border-blue-200',
}

export default function ParticipantesClient({ participants: initial }: { participants: Participant[] }) {
  const supabase = createClient()
  const { toast } = useToast()
  const [participants, setParticipants] = useState(initial)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'todos' | PaymentStatus>('todos')

  async function toggleAdmin(id: string, current: boolean) {
    await supabase.from('participants').update({ is_admin: !current }).eq('id', id)
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, is_admin: !current } : p))
    toast(!current ? 'Admin adicionado.' : 'Admin removido.', 'info')
  }

  const filtered = participants.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
    const matchFilter = filter === 'todos' || p.payment_status === filter
    return matchSearch && matchFilter
  })

  const counts = {
    total:    participants.length,
    pago:     participants.filter(p => p.payment_status === 'pago').length,
    pendente: participants.filter(p => p.payment_status === 'pendente').length,
    isento:   participants.filter(p => p.payment_status === 'isento').length,
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">👥 Participantes</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Total',    value: counts.total,    color: 'bg-gray-50 border-gray-200 text-gray-700' },
          { label: 'Pagos',    value: counts.pago,     color: 'bg-green-50 border-green-200 text-green-700' },
          { label: 'Pendente', value: counts.pendente, color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
          { label: 'Isentos',  value: counts.isento,   color: 'bg-blue-50 border-blue-200 text-blue-700' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-xl border p-3 text-center`}>
            <p className="text-xl font-black">{s.value}</p>
            <p className="text-xs font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="space-y-2">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Buscar por nome ou email..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {(['todos', 'pago', 'pendente', 'isento'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`shrink-0 px-4 min-h-[40px] rounded-full text-sm font-medium transition ${filter === f ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
              {f === 'todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Cards (mobile-first) */}
      <div className="space-y-2">
        {!filtered.length ? (
          <div className="bg-white rounded-2xl border p-8 text-center text-gray-400">
            Nenhum participante encontrado.
          </div>
        ) : filtered.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{p.name}</p>
                <p className="text-xs text-gray-400 truncate">{p.email}</p>
                <p className="text-xs text-gray-300 mt-0.5">
                  Desde {new Date(p.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${BADGE[p.payment_status]}`}>
                  {p.payment_status}
                </span>
                {p.is_admin && (
                  <span className="text-xs font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
                    Admin
                  </span>
                )}
              </div>
            </div>

            {/* Toggle admin */}
            <div className="flex items-center justify-between pt-1 border-t border-gray-50">
              <span className="text-xs text-gray-500">Administrador</span>
              <button onClick={() => toggleAdmin(p.id, p.is_admin)}
                className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${p.is_admin ? 'bg-green-500' : 'bg-gray-300'}`}
                aria-label={p.is_admin ? 'Remover admin' : 'Tornar admin'}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${p.is_admin ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
