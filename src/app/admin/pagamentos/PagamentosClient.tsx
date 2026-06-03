'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Participant, PaymentStatus } from '@/types'
import { useToast } from '@/components/ui/Toast'

const STATUS_CONFIG: Record<PaymentStatus, { label: string; badge: string }> = {
  pago:     { label: 'Pago',     badge: 'bg-green-100 text-green-700 border-green-200' },
  pendente: { label: 'Pendente', badge: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  isento:   { label: 'Isento',   badge: 'bg-blue-100 text-blue-700 border-blue-200' },
}

export default function PagamentosClient({ participants: initial }: { participants: Participant[] }) {
  const supabase = createClient()
  const { toast } = useToast()
  const [participants, setParticipants] = useState(initial)
  const [updating, setUpdating] = useState<string | null>(null)

  async function updateStatus(id: string, status: PaymentStatus) {
    setUpdating(id)
    const { error } = await supabase.from('participants').update({ payment_status: status }).eq('id', id)
    setUpdating(null)
    if (error) { toast('Erro ao atualizar.', 'error'); return }
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, payment_status: status } : p))
    toast(`Marcado como ${STATUS_CONFIG[status].label.toLowerCase()}.`, 'success')
  }

  const paidCount = participants.filter(p => p.payment_status === 'pago').length
  const isentoCount = participants.filter(p => p.payment_status === 'isento').length
  // Usa entry_fee da liga se disponível — fallback R$20
  const entryFee = 20
  const arrecadado = paidCount * entryFee

  return (
    <div className="space-y-4">
      {/* Header */}
      <h1 className="text-xl font-bold text-gray-900">💰 Pagamentos</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-green-700">{paidCount}</p>
          <p className="text-xs text-green-600">pagos</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-yellow-700">{participants.filter(p => p.payment_status === 'pendente').length}</p>
          <p className="text-xs text-yellow-600">pendentes</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-green-700">R${arrecadado}</p>
          <p className="text-xs text-gray-500">arrecadado</p>
        </div>
      </div>

      {/* Cards de participantes (mobile-first — sem tabela) */}
      <div className="space-y-2">
        {participants.map(p => {
          const cfg = STATUS_CONFIG[p.payment_status]
          const isLoading = updating === p.id
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400 truncate">{p.email}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${cfg.badge}`}>
                  {cfg.label}
                </span>
              </div>

              {/* Botões de ação — tap targets 44px */}
              <div className="flex gap-2 mt-3">
                {p.payment_status !== 'pago' && (
                  <button onClick={() => updateStatus(p.id, 'pago')} disabled={isLoading}
                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 min-h-[44px]">
                    ✓ Confirmar
                  </button>
                )}
                {p.payment_status !== 'pendente' && (
                  <button onClick={() => updateStatus(p.id, 'pendente')} disabled={isLoading}
                    className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 min-h-[44px]">
                    ⏳ Pendente
                  </button>
                )}
                {p.payment_status !== 'isento' && (
                  <button onClick={() => updateStatus(p.id, 'isento')} disabled={isLoading}
                    className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 min-h-[44px]">
                    🎫 Isentar
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
