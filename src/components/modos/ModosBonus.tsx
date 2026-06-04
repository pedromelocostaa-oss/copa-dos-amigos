'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import FlagImage from '@/components/ui/FlagImage'
import { TEAMS } from '@/lib/teams-data'
import { ARTILHEIRO_CANDIDATES } from '@/lib/players-data'
import type { BetMode, EnabledModes, ExtraPrediction } from '@/types'
import { MODE_LABELS, MODE_POINTS } from '@/types'

interface Props {
  leagueId: string
  userId: string
  enabledModes: EnabledModes
  existingPredictions: ExtraPrediction[]
  isOwner: boolean
  tournamentStarted: boolean
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error' | 'locked'

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

// Teams por grupo (baseado nos dados do banco)
const GROUP_TEAMS: Record<string, Array<{ team: string; iso: string }>> = {
  A: [{ team: 'México', iso: 'mx' }, { team: 'África do Sul', iso: 'za' }, { team: 'Coreia do Sul', iso: 'kr' }, { team: 'Rep. Tcheca', iso: 'cz' }],
  B: [{ team: 'Canadá', iso: 'ca' }, { team: 'Bósnia e Herz.', iso: 'ba' }, { team: 'Qatar', iso: 'qa' }, { team: 'Suíça', iso: 'ch' }],
  C: [{ team: 'Brasil', iso: 'br' }, { team: 'Marrocos', iso: 'ma' }, { team: 'Haiti', iso: 'ht' }, { team: 'Escócia', iso: 'gb-sct' }],
  D: [{ team: 'Estados Unidos', iso: 'us' }, { team: 'Paraguai', iso: 'py' }, { team: 'Austrália', iso: 'au' }, { team: 'Turquia', iso: 'tr' }],
  E: [{ team: 'Alemanha', iso: 'de' }, { team: 'Curaçao', iso: 'cw' }, { team: 'Costa do Marfim', iso: 'ci' }, { team: 'Equador', iso: 'ec' }],
  F: [{ team: 'Países Baixos', iso: 'nl' }, { team: 'Japão', iso: 'jp' }, { team: 'Suécia', iso: 'se' }, { team: 'Tunísia', iso: 'tn' }],
  G: [{ team: 'Bélgica', iso: 'be' }, { team: 'Egito', iso: 'eg' }, { team: 'Irã', iso: 'ir' }, { team: 'Nova Zelândia', iso: 'nz' }],
  H: [{ team: 'Espanha', iso: 'es' }, { team: 'Cabo Verde', iso: 'cv' }, { team: 'Arábia Saudita', iso: 'sa' }, { team: 'Uruguai', iso: 'uy' }],
  I: [{ team: 'França', iso: 'fr' }, { team: 'Senegal', iso: 'sn' }, { team: 'Iraque', iso: 'iq' }, { team: 'Noruega', iso: 'no' }],
  J: [{ team: 'Argentina', iso: 'ar' }, { team: 'Argélia', iso: 'dz' }, { team: 'Áustria', iso: 'at' }, { team: 'Jordânia', iso: 'jo' }],
  K: [{ team: 'Portugal', iso: 'pt' }, { team: 'Rep. Dem. Congo', iso: 'cd' }, { team: 'Uzbequistão', iso: 'uz' }, { team: 'Colômbia', iso: 'co' }],
  L: [{ team: 'Inglaterra', iso: 'gb-eng' }, { team: 'Croácia', iso: 'hr' }, { team: 'Gana', iso: 'gh' }, { team: 'Panamá', iso: 'pa' }],
}

export default function ModosBonus({
  leagueId,
  userId,
  enabledModes,
  existingPredictions,
  isOwner,
  tournamentStarted,
}: Props) {
  const supabase = createClient()
  const activeModes = (Object.entries(enabledModes) as [BetMode, boolean][]).filter(([, v]) => v)
  const hasAnyMode = activeModes.length > 0

  if (!hasAnyMode) {
    // Teaser para participante
    return (
      <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-5 text-center space-y-3">
        <div className="text-2xl">🎯</div>
        <p className="font-semibold text-gray-700 text-sm">Modos Bônus disponíveis</p>
        <p className="text-xs text-gray-500 leading-relaxed">
          Campeão da Copa, Artilheiro e Seleções Classificadas podem ser desbloqueados pelo organizador do bolão.
        </p>
        {isOwner ? (
          <a
            href="/bolao?tab=modos"
            className="inline-flex items-center justify-center bg-green-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl min-h-[44px]"
          >
            🔓 Desbloquear modos →
          </a>
        ) : (
          <p className="text-xs text-gray-400 italic">
            Peça ao organizador para desbloquear os modos bônus 👀
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="font-bold text-gray-900 text-lg">🎯 Bônus</h2>
        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
          Extra
        </span>
      </div>
      {tournamentStarted && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm text-orange-700">
          🔒 A Copa já começou — os palpites bônus estão travados.
        </div>
      )}
      <p className="text-xs text-gray-500">
        Prazo: antes do 1º jogo (11/06) · Opcional · Pontos somam no ranking
      </p>
      {activeModes.map(([mode]) => (
        <ModoCard
          key={mode}
          mode={mode}
          leagueId={leagueId}
          userId={userId}
          existing={existingPredictions.find(p => p.mode === mode) ?? null}
          locked={tournamentStarted}
          supabase={supabase}
        />
      ))}
    </div>
  )
}

// ── Card individual por modo ─────────────────────────────────────
function ModoCard({
  mode,
  leagueId,
  userId,
  existing,
  locked,
  supabase,
}: {
  mode: BetMode
  leagueId: string
  userId: string
  existing: ExtraPrediction | null
  locked: boolean
  supabase: ReturnType<typeof createClient>
}) {
  const [saveState, setSaveState] = useState<SaveState>(locked ? 'locked' : 'idle')
  const meta = MODE_LABELS[mode]

  const save = useCallback(async (selection: Record<string, unknown>) => {
    if (locked) { setSaveState('locked'); return }
    setSaveState('saving')
    const payload = { league_id: leagueId, user_id: userId, mode, selection }
    const { error } = existing
      ? await supabase.from('extra_predictions').update({ selection, updated_at: new Date().toISOString() }).eq('id', existing.id)
      : await supabase.from('extra_predictions').insert(payload)
    if (error) {
      // RLS error = torneio já começou
      setSaveState(error.code === '42501' || error.message.includes('policy') ? 'locked' : 'error')
    } else {
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    }
  }, [leagueId, userId, mode, existing, locked, supabase])

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${locked ? 'opacity-75' : ''}`}>
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{meta.icon}</span>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{meta.title}</p>
            <p className="text-xs text-gray-500">{meta.description}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-green-600 font-bold">+{
            mode === 'classificados' ? `${MODE_POINTS.classificados_per_team}pts/time` :
            mode === 'artilheiro' ? `${MODE_POINTS.artilheiro}pts` :
            `${MODE_POINTS.campeao}pts`
          }</p>
          {saveState === 'saved' && <p className="text-xs text-green-600">✓ Salvo</p>}
          {saveState === 'error' && <p className="text-xs text-red-500">Erro</p>}
          {saveState === 'locked' && <p className="text-xs text-orange-500">🔒 Travado</p>}
        </div>
      </div>
      <div className="p-4">
        {mode === 'campeao' && (
          <CampeaoInput
            existing={existing?.selection as { team: string; iso: string } | null}
            locked={locked}
            onSave={sel => save(sel as Record<string, unknown>)}
            saving={saveState === 'saving'}
          />
        )}
        {mode === 'artilheiro' && (
          <ArtilheiroInput
            existing={existing?.selection as { player: string; team: string } | null}
            locked={locked}
            onSave={sel => save(sel as Record<string, unknown>)}
            saving={saveState === 'saving'}
          />
        )}
        {mode === 'classificados' && (
          <ClassificadosInput
            existing={existing?.selection as Record<string, string[]> | null}
            locked={locked}
            onSave={sel => save(sel as Record<string, unknown>)}
            saving={saveState === 'saving'}
          />
        )}
      </div>
    </div>
  )
}

// ── Campeão ──────────────────────────────────────────────────────
function CampeaoInput({
  existing, locked, onSave, saving,
}: {
  existing: { team: string; iso: string } | null
  locked: boolean
  onSave: (s: { team: string; iso: string }) => void
  saving: boolean
}) {
  const [selected, setSelected] = useState(existing?.team ?? '')
  const teams = Object.entries(TEAMS).filter(([, d]) => d.fifaRank <= 50)

  function pick(team: string, iso: string) {
    if (locked) return
    setSelected(team)
    onSave({ team, iso })
  }

  return (
    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
      {teams.map(([name, data]) => (
        <button
          key={name}
          disabled={locked || saving}
          onClick={() => pick(name, data.iso)}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition text-xs font-medium ${
            selected === name
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-gray-100 hover:border-gray-200 text-gray-700'
          } disabled:opacity-50`}
        >
          <FlagImage iso={data.iso} name={name} size={20} />
          <span className="leading-tight text-center line-clamp-2">{name}</span>
        </button>
      ))}
    </div>
  )
}

// ── Artilheiro ───────────────────────────────────────────────────
function ArtilheiroInput({
  existing, locked, onSave, saving,
}: {
  existing: { player: string; team: string } | null
  locked: boolean
  onSave: (s: { player: string; team: string; iso: string }) => void
  saving: boolean
}) {
  const [search, setSearch] = useState(existing?.player ?? '')
  const [selected, setSelected] = useState(existing?.player ?? '')

  const filtered = ARTILHEIRO_CANDIDATES.filter(c =>
    c.player.toLowerCase().includes(search.toLowerCase()) ||
    c.team.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 20)

  function pick(c: typeof ARTILHEIRO_CANDIDATES[0]) {
    if (locked) return
    setSelected(c.player)
    setSearch(c.player)
    onSave({ player: c.player, team: c.team, iso: c.iso })
  }

  return (
    <div className="space-y-2">
      {selected && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
          <FlagImage
            iso={ARTILHEIRO_CANDIDATES.find(c => c.player === selected)?.iso ?? ''}
            name={selected}
            size={20}
          />
          <span className="text-sm font-semibold text-green-700">{selected}</span>
          {!locked && (
            <button onClick={() => { setSelected(''); setSearch('') }}
              className="ml-auto text-gray-400 hover:text-gray-600 text-xs">✕</button>
          )}
        </div>
      )}
      {!locked && (
        <>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar jogador ou seleção..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {filtered.map(c => (
              <button
                key={c.player}
                disabled={saving}
                onClick={() => pick(c)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm hover:bg-gray-50 transition text-left ${
                  selected === c.player ? 'bg-green-50' : ''
                } disabled:opacity-50`}
              >
                <FlagImage iso={c.iso} name={c.team} size={20} />
                <div>
                  <p className="font-medium text-gray-900">{c.player}</p>
                  <p className="text-xs text-gray-400">{c.team}</p>
                </div>
                {selected === c.player && <span className="ml-auto text-green-600 text-xs">✓</span>}
              </button>
            ))}
            {search && !filtered.find(c => c.player.toLowerCase() === search.toLowerCase()) && (
              <button
                onClick={() => onSave({ player: search, team: 'Outro', iso: '' })}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition text-left"
              >
                <span>+ Outro: <strong>{search}</strong></span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── Classificados ────────────────────────────────────────────────
function ClassificadosInput({
  existing, locked, onSave, saving,
}: {
  existing: Record<string, string[]> | null
  locked: boolean
  onSave: (s: Record<string, string[]>) => void
  saving: boolean
}) {
  const [selections, setSelections] = useState<Record<string, string[]>>(existing ?? {})
  const [activeGroup, setActiveGroup] = useState<string>('A')

  function toggle(group: string, team: string) {
    if (locked) return
    const current = selections[group] ?? []
    let next: string[]
    if (current.includes(team)) {
      next = current.filter(t => t !== team)
    } else if (current.length >= 2) {
      next = [current[1], team] // substitui o mais antigo
    } else {
      next = [...current, team]
    }
    const updated = { ...selections, [group]: next }
    setSelections(updated)
    onSave(updated)
  }

  const groupTeams = GROUP_TEAMS[activeGroup] ?? []
  const groupSelected = selections[activeGroup] ?? []

  const completedGroups = GROUPS.filter(g => (selections[g] ?? []).length === 2).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">Escolha 2 por grupo que vão se classificar</p>
        <span className="text-xs text-green-600 font-medium">{completedGroups}/12 grupos</span>
      </div>

      {/* Group tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {GROUPS.map(g => {
          const sel = selections[g] ?? []
          return (
            <button key={g} onClick={() => setActiveGroup(g)}
              className={`shrink-0 w-9 h-9 rounded-xl text-xs font-bold transition ${
                activeGroup === g
                  ? 'bg-green-600 text-white'
                  : sel.length === 2
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
              {g}
            </button>
          )
        })}
      </div>

      {/* Teams do grupo ativo */}
      <div className="grid grid-cols-2 gap-2">
        {groupTeams.map(({ team, iso }) => {
          const isSelected = groupSelected.includes(team)
          return (
            <button
              key={team}
              disabled={locked || saving}
              onClick={() => toggle(activeGroup, team)}
              className={`flex items-center gap-2 p-3 rounded-xl border-2 transition ${
                isSelected
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-100 hover:border-gray-200'
              } disabled:opacity-50`}
            >
              <FlagImage iso={iso} name={team} size={20} />
              <span className="text-xs font-medium text-gray-800 truncate">{team}</span>
              {isSelected && <span className="ml-auto text-green-600 text-xs shrink-0">✓</span>}
            </button>
          )
        })}
      </div>

      {groupSelected.length > 0 && (
        <p className="text-xs text-green-600 text-center">
          Grupo {activeGroup}: {groupSelected.join(' · ')}
        </p>
      )}
    </div>
  )
}
