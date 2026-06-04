'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { BetMode } from '@/types'
import { MODE_LABELS } from '@/types'

interface League { id: string; name: string; code: string; enabled_modes: Record<string, boolean> }

const ALL_MODES: BetMode[] = ['campeao', 'artilheiro', 'classificados']

export default function ModosAdminClient({ leagues: initial }: { leagues: League[] }) {
  const supabase = createClient()
  const [leagues, setLeagues] = useState(initial)
  const [saving, setSaving] = useState<string | null>(null)

  async function toggleMode(leagueId: string, mode: BetMode, current: boolean) {
    setSaving(`${leagueId}-${mode}`)
    const league = leagues.find(l => l.id === leagueId)
    if (!league) return

    const newModes = { ...league.enabled_modes, [mode]: !current }
    const { error } = await supabase
      .from('leagues')
      .update({ enabled_modes: newModes })
      .eq('id', leagueId)

    if (!error) {
      setLeagues(prev => prev.map(l => l.id === leagueId ? { ...l, enabled_modes: newModes } : l))
    }
    setSaving(null)
  }

  async function toggleBundle(leagueId: string, enable: boolean) {
    setSaving(`${leagueId}-bundle`)
    const newModes = enable
      ? { campeao: true, artilheiro: true, classificados: true }
      : { campeao: false, artilheiro: false, classificados: false }
    const { error } = await supabase.from('leagues').update({ enabled_modes: newModes }).eq('id', leagueId)
    if (!error) {
      setLeagues(prev => prev.map(l => l.id === leagueId ? { ...l, enabled_modes: newModes } : l))
    }
    setSaving(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">🎯 Modos Bônus por Bolão</h1>
        <span className="text-xs text-gray-400 bg-yellow-50 border border-yellow-200 px-3 py-1 rounded-full">
          Admin — Soft-launch manual
        </span>
      </div>
      <p className="text-sm text-gray-500">
        Ative os modos manualmente para testar antes do gateway de pagamento estar configurado.
        Em produção, os modos serão ativados automaticamente via webhook do Mercado Pago.
      </p>

      <div className="space-y-4">
        {!leagues.length && (
          <p className="text-gray-400 text-sm">Nenhum bolão criado ainda.</p>
        )}
        {leagues.map(league => {
          const allActive = ALL_MODES.every(m => league.enabled_modes[m])
          const bundleSaving = saving === `${league.id}-bundle`
          return (
            <div key={league.id} className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{league.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{league.code}</p>
                </div>
                <button
                  onClick={() => toggleBundle(league.id, !allActive)}
                  disabled={bundleSaving}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50 ${
                    allActive
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {bundleSaving ? '...' : allActive ? '✓ Todos ativos' : 'Ativar todos'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {ALL_MODES.map(mode => {
                  const active = !!league.enabled_modes[mode]
                  const isSaving = saving === `${league.id}-${mode}`
                  const meta = MODE_LABELS[mode]
                  return (
                    <button
                      key={mode}
                      onClick={() => toggleMode(league.id, mode, active)}
                      disabled={isSaving}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition disabled:opacity-50 ${
                        active
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl">{meta.icon}</span>
                      <span className="text-xs font-medium text-center leading-tight">{meta.title}</span>
                      <span className="text-xs font-bold">
                        {isSaving ? '...' : active ? 'Ativo' : 'Inativo'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
