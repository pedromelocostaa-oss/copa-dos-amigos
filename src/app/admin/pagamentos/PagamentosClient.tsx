'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Participant, PaymentStatus } from '@/types'

export default function PagamentosClient({ participants: initial }: { participants: Participant[] }) {
  const supabase = createClient()
  const [participants, setParticipants] = useState(initial)

  async function updateStatus(id: string, status: PaymentStatus) {
    await supabase.from('participants').update({ payment_status: status }).eq('id', id)
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, payment_status: status } : p))
  }

  const badge: Record<PaymentStatus, string> = {
    pago: 'bg-green-100 text-green-700',
    pendente: 'bg-yellow-100 text-yellow-700',
    isento: 'bg-blue-100 text-blue-700',
  }

  const paidCount = participants.filter(p => p.payment_status === 'pago').length
  const arrecadado = paidCount * 20

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">💰 Pagamentos</h1>
        <div className="text-right">
          <p className="text-sm text-gray-500">{paidCount} pagos</p>
          <p className="text-lg font-bold text-green-700">R$ {arrecadado} arrecadados</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Participante</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {participants.map(p => (
              <tr key={p.id} className="border-t border-gray-50">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-gray-500">{p.email}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${badge[p.payment_status]}`}>
                    {p.payment_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-2">
                    {p.payment_status !== 'pago' && (
                      <button
                        onClick={() => updateStatus(p.id, 'pago')}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition"
                      >
                        Confirmar
                      </button>
                    )}
                    {p.payment_status !== 'pendente' && (
                      <button
                        onClick={() => updateStatus(p.id, 'pendente')}
                        className="px-3 py-1 bg-yellow-500 text-white text-xs rounded-lg hover:bg-yellow-600 transition"
                      >
                        Pendente
                      </button>
                    )}
                    {p.payment_status !== 'isento' && (
                      <button
                        onClick={() => updateStatus(p.id, 'isento')}
                        className="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition"
                      >
                        Isentar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
