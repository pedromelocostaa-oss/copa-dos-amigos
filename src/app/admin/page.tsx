import { createClient } from '@/lib/supabase/server'
import { calculatePrizes } from '@/lib/scoring'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = await createClient()

  const { count: total } = await supabase.from('participants').select('*', { count: 'exact', head: true })
  const { count: paid } = await supabase.from('participants').select('*', { count: 'exact', head: true }).eq('payment_status', 'pago')
  const { count: pending } = await supabase.from('participants').select('*', { count: 'exact', head: true }).eq('payment_status', 'pendente')
  const { count: totalMatches } = await supabase.from('matches').select('*', { count: 'exact', head: true })
  const { count: finishedMatches } = await supabase.from('matches').select('*', { count: 'exact', head: true }).eq('is_finished', true)

  const prizes = calculatePrizes(paid ?? 0, 20)
  const arrecadado = (paid ?? 0) * 20

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">⚙️ Painel Administrativo</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total participantes', value: total ?? 0, color: 'text-gray-900' },
          { label: 'Pagamentos confirmados', value: paid ?? 0, color: 'text-green-700' },
          { label: 'Pendentes', value: pending ?? 0, color: 'text-yellow-700' },
          { label: 'Arrecadado', value: `R$ ${arrecadado}`, color: 'text-green-700' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border shadow-sm p-5">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {prizes.map(p => (
          <div key={p.position} className="bg-white rounded-xl border shadow-sm p-4 text-center">
            <p className="text-sm text-gray-500">{p.label} ({p.percentage}%)</p>
            <p className="text-xl font-bold text-gray-900">R$ {p.amount.toFixed(0)}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-5">
        <p className="text-sm text-gray-500">Jogos</p>
        <p className="text-lg font-semibold">{finishedMatches} de {totalMatches} finalizados</p>
        <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
          <div
            className="bg-green-500 h-2 rounded-full"
            style={{ width: `${totalMatches ? ((finishedMatches ?? 0) / totalMatches) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { href: '/admin/participantes', icon: '👥', label: 'Gerenciar Participantes' },
          { href: '/admin/pagamentos', icon: '💰', label: 'Confirmar Pagamentos' },
          { href: '/admin/resultados', icon: '⚽', label: 'Inserir Resultados' },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition flex items-center gap-3"
          >
            <span className="text-3xl">{item.icon}</span>
            <span className="font-medium text-gray-800">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
