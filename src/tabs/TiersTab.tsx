import { useState } from 'react'
import type { DragEvent } from 'react'
import type { Islander, PlayerId, TierName } from '../types'
import { firstName, islanderById, otherPlayer } from '../lib/helpers'
import { useStore } from '../store'
import { Avatar } from '../components/Avatar'

const TIERS: { name: TierName; label: string; color: string }[] = [
  { name: 'S', label: 'S — obsessed', color: '#f43f5e' },
  { name: 'A', label: 'A — love them', color: '#fb923c' },
  { name: 'B', label: 'B — fine', color: '#fbbf24' },
  { name: 'C', label: 'C — meh', color: '#34d399' },
  { name: 'D', label: 'D — get out', color: '#38bdf8' },
]

function TierCard({
  islander,
  onAssign,
  inTier,
}: {
  islander: Islander
  onAssign: (tier: TierName | null) => void
  inTier: boolean
}) {
  function onDragStart(e: DragEvent) {
    e.dataTransfer.setData('text/plain', islander.id)
    e.dataTransfer.effectAllowed = 'move'
  }
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="group w-16 cursor-grab overflow-hidden rounded-xl bg-slate-900 ring-1 ring-white/10 active:cursor-grabbing"
      title={islander.name}
    >
      <Avatar islander={islander} className="h-16 w-16 text-sm" />
      <div className="truncate px-1 py-0.5 text-center text-[10px] font-semibold">
        {firstName(islander.name)}
      </div>
      <div className="flex justify-center gap-0.5 pb-1 opacity-0 transition group-hover:opacity-100">
        {TIERS.map((t) => (
          <button
            key={t.name}
            type="button"
            onClick={() => onAssign(t.name)}
            className="rounded px-0.5 text-[8px] font-bold text-slate-950"
            style={{ background: t.color }}
            title={`Send to ${t.name}`}
          >
            {t.name}
          </button>
        ))}
        {inTier && (
          <button
            type="button"
            onClick={() => onAssign(null)}
            className="rounded bg-white/20 px-0.5 text-[8px] font-bold"
            title="Back to pool"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}

function MiniBoard({ playerId }: { playerId: PlayerId }) {
  const { state } = useStore()
  const info = state.players.find((p) => p.id === playerId)!
  return (
    <div className="rounded-2xl bg-slate-900/60 p-3 ring-1 ring-white/10">
      <div className="mb-2 text-sm font-bold" style={{ color: info.color }}>
        {info.name}'s tiers
      </div>
      <div className="space-y-1">
        {TIERS.map((t) => (
          <div key={t.name} className="flex items-center gap-2">
            <span
              className="w-6 shrink-0 rounded text-center text-xs font-black text-slate-950"
              style={{ background: t.color }}
            >
              {t.name}
            </span>
            <div className="flex flex-wrap gap-1">
              {state.tiers[playerId][t.name].map((id) => {
                const i = islanderById(state, id)
                if (!i) return null
                return <Avatar key={id} islander={i} className="h-7 w-7 rounded-full text-[8px]" />
              })}
              {state.tiers[playerId][t.name].length === 0 && (
                <span className="text-[10px] text-slate-600">—</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TiersTab() {
  const { state, set, player } = useStore()
  const [compare, setCompare] = useState(false)
  const [dragOver, setDragOver] = useState<TierName | 'pool' | null>(null)

  const board = state.tiers[player]
  const rankedIds = new Set(Object.values(board).flat())
  const pool = state.islanders.filter((i) => !rankedIds.has(i.id) && i.status === 'villa')
  const other = state.players.find((p) => p.id === otherPlayer(player))!

  function assign(id: string, tier: TierName | null) {
    set((s) => {
      const cleaned = Object.fromEntries(
        Object.entries(s.tiers[player]).map(([t, ids]) => [t, ids.filter((x) => x !== id)]),
      ) as typeof board
      if (tier) cleaned[tier] = [...cleaned[tier], id]
      return { ...s, tiers: { ...s.tiers, [player]: cleaned } }
    })
  }

  function onDrop(e: DragEvent, tier: TierName | null) {
    e.preventDefault()
    setDragOver(null)
    const id = e.dataTransfer.getData('text/plain')
    if (id) assign(id, tier)
  }

  function dropZoneProps(zone: TierName | 'pool') {
    return {
      onDragOver: (e: DragEvent) => {
        e.preventDefault()
        setDragOver(zone)
      },
      onDragLeave: () => setDragOver((z) => (z === zone ? null : z)),
      onDrop: (e: DragEvent) => onDrop(e, zone === 'pool' ? null : zone),
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <p className="text-sm text-slate-400">
          Ranking as{' '}
          <span
            className="font-bold"
            style={{ color: state.players.find((p) => p.id === player)!.color }}
          >
            {state.players.find((p) => p.id === player)!.name}
          </span>{' '}
          — drag cards into tiers (or hover a card for quick buttons).
        </p>
        <button
          type="button"
          onClick={() => setCompare((c) => !c)}
          className="ml-auto rounded-full bg-white/5 px-3 py-1.5 text-sm font-semibold text-slate-300 ring-1 ring-white/10 hover:bg-white/10"
        >
          {compare ? 'Hide' : 'Compare with'} {other.name}
        </button>
      </div>

      <div className="space-y-2">
        {TIERS.map((t) => (
          <div
            key={t.name}
            {...dropZoneProps(t.name)}
            className={`flex items-stretch gap-3 rounded-2xl bg-slate-900/60 p-2 ring-1 transition ${
              dragOver === t.name ? 'ring-2 ring-pink-400' : 'ring-white/10'
            }`}
          >
            <div
              className="flex w-16 shrink-0 flex-col items-center justify-center rounded-xl font-black text-slate-950"
              style={{ background: t.color }}
              title={t.label}
            >
              <span className="text-2xl">{t.name}</span>
            </div>
            <div className="flex min-h-20 flex-1 flex-wrap items-center gap-2">
              {board[t.name].map((id) => {
                const i = islanderById(state, id)
                if (!i) return null
                return <TierCard key={id} islander={i} inTier onAssign={(tier) => assign(id, tier)} />
              })}
              {board[t.name].length === 0 && (
                <span className="px-2 text-xs text-slate-600">drop islanders here</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div
        {...dropZoneProps('pool')}
        className={`rounded-2xl bg-slate-900/40 p-3 ring-1 transition ${
          dragOver === 'pool' ? 'ring-2 ring-pink-400' : 'ring-white/10'
        }`}
      >
        <div className="mb-2 text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
          Unranked (in the villa) — drop here to un-rank
        </div>
        <div className="flex flex-wrap gap-2">
          {pool.map((i) => (
            <TierCard key={i.id} islander={i} inTier={false} onAssign={(tier) => assign(i.id, tier)} />
          ))}
          {pool.length === 0 && <span className="text-xs text-slate-600">everyone's ranked 🎉</span>}
        </div>
      </div>

      {compare && (
        <div className="grid gap-4 sm:grid-cols-2">
          <MiniBoard playerId="p1" />
          <MiniBoard playerId="p2" />
        </div>
      )}
    </div>
  )
}
