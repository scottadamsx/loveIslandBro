import { useState } from 'react'
import { firstName, islanderById, uid } from '../lib/helpers'
import { useStore } from '../store'
import { Avatar } from '../components/Avatar'
import { IslanderChip } from '../components/Chips'

export function CouplesTab() {
  const { state, set } = useStore()
  const [selected, setSelected] = useState<string[]>([])
  const [showEveryone, setShowEveryone] = useState(false)

  const coupledIds = new Set(state.couples.flatMap((c) => c.members))
  const pool = state.islanders.filter((i) => (showEveryone ? true : i.status === 'villa'))

  function toggle(id: string) {
    setSelected((sel) =>
      sel.includes(id) ? sel.filter((x) => x !== id) : sel.length < 2 ? [...sel, id] : [sel[1], id],
    )
  }

  function coupleUp() {
    if (selected.length !== 2) return
    const [a, b] = selected
    set((s) => ({
      ...s,
      // an islander can only be in one couple — splitting any they were in
      couples: [
        ...s.couples.filter((c) => !c.members.includes(a) && !c.members.includes(b)),
        { id: uid(), members: [a, b] },
      ],
    }))
    setSelected([])
  }

  function split(coupleId: string) {
    set((s) => ({ ...s, couples: s.couples.filter((c) => c.id !== coupleId) }))
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-bold">
          Current couples <span className="text-sm font-normal text-slate-400">({state.couples.length})</span>
        </h2>
        {state.couples.length === 0 && (
          <p className="text-sm text-slate-400">No couples yet — build one below.</p>
        )}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {state.couples.map((c) => {
            const a = islanderById(state, c.members[0])
            const b = islanderById(state, c.members[1])
            if (!a || !b) return null
            return (
              <div
                key={c.id}
                className="overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-white/10 transition hover:ring-pink-400/50"
              >
                <div className="relative flex">
                  <Avatar islander={a} className="aspect-[3/4] w-1/2 text-2xl" />
                  <Avatar islander={b} className="aspect-[3/4] w-1/2 text-2xl" />
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/60 px-2 py-1 text-lg">
                    💘
                  </span>
                </div>
                <div className="flex items-center gap-2 p-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold">
                      {firstName(a.name)} &amp; {firstName(b.name)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => split(c.id)}
                    className="ml-auto shrink-0 rounded-md bg-white/8 px-2 py-1 text-xs ring-1 ring-white/10 hover:bg-red-500/30"
                    title="Split this couple"
                  >
                    Split 💔
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="rounded-2xl bg-slate-900/60 p-4 ring-1 ring-white/10">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-bold">Couple up</h2>
          <span className="text-sm text-slate-400">Pick two islanders, then make it official.</span>
          <label className="ml-auto flex items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={showEveryone}
              onChange={(e) => setShowEveryone(e.target.checked)}
            />
            include dumped/removed
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {pool.map((i) => (
            <IslanderChip
              key={i.id}
              islander={i}
              selected={selected.includes(i.id)}
              dimmed={coupledIds.has(i.id) && !selected.includes(i.id)}
              title={coupledIds.has(i.id) ? `${i.name} (already coupled — picking them re-couples)` : i.name}
              onClick={() => toggle(i.id)}
            />
          ))}
        </div>
        <button
          type="button"
          disabled={selected.length !== 2}
          onClick={coupleUp}
          className="mt-4 rounded-xl bg-pink-500 px-4 py-2 text-sm font-bold text-white transition enabled:hover:bg-pink-400 disabled:opacity-30"
        >
          Couple up 💍
        </button>
      </section>
    </div>
  )
}
