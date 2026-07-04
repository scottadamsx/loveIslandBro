import { useState } from 'react'
import type { PlayerId, Scene, SceneMode, ScenePick } from '../types'
import { firstName, islanderById, pickKey, scoreEntry, uid } from '../lib/helpers'
import { useStore } from '../store'
import { IslanderChip, PairChip } from '../components/Chips'

/* ---------- pick builder (used for player guesses and the show's answer) ---------- */

function PickBuilder({
  mode,
  count,
  picks,
  onChange,
}: {
  mode: SceneMode
  count: number
  picks: ScenePick[]
  onChange: (p: ScenePick[]) => void
}) {
  const { state } = useStore()
  const [pending, setPending] = useState<string[]>([])
  const [showEveryone, setShowEveryone] = useState(false)

  const usedIds = new Set([...picks.flat(), ...pending])
  const full = picks.length >= count
  const pool = state.islanders.filter((i) => (showEveryone ? true : i.status === 'villa'))

  function addPick(p: ScenePick) {
    const key = pickKey(p)
    if (picks.some((x) => pickKey(x) === key)) return
    onChange([...picks, p])
    setPending([])
  }

  function clickIslander(id: string) {
    if (mode === 'islanders') {
      addPick([id])
      return
    }
    const next = pending.includes(id) ? pending.filter((x) => x !== id) : [...pending, id]
    if (next.length === 2) addPick(next)
    else setPending(next)
  }

  return (
    <div className="space-y-2">
      <div className="flex min-h-8 flex-wrap gap-1.5">
        {picks.map((p, n) => {
          const a = islanderById(state, p[0])
          if (!a) return null
          return (
            <PairChip
              key={n}
              a={a}
              b={p[1] ? islanderById(state, p[1]) : undefined}
              onRemove={() => onChange(picks.filter((_, i) => i !== n))}
            />
          )
        })}
        {Array.from({ length: Math.max(0, count - picks.length) }).map((_, n) => (
          <span
            key={`empty-${n}`}
            className="inline-flex items-center rounded-full border border-dashed border-white/20 px-3 py-1 text-xs text-slate-500"
          >
            {mode === 'couples' ? 'pick a couple' : 'pick an islander'}
          </span>
        ))}
      </div>

      {!full && (
        <>
          {mode === 'couples' && state.couples.length > 0 && (
            <div>
              <div className="mb-1 text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                Current couples
              </div>
              <div className="flex flex-wrap gap-1.5">
                {state.couples
                  .filter((c) => !picks.some((p) => pickKey(p) === pickKey([...c.members])))
                  .map((c) => {
                    const a = islanderById(state, c.members[0])
                    const b = islanderById(state, c.members[1])
                    if (!a || !b) return null
                    return (
                      <button key={c.id} type="button" onClick={() => addPick([...c.members])}>
                        <PairChip a={a} b={b} />
                      </button>
                    )
                  })}
              </div>
            </div>
          )}
          <div>
            <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
              {mode === 'couples' ? 'or build your own pair' : 'Islanders'}
              {mode === 'couples' && pending.length === 1 && (
                <span className="normal-case text-pink-300">
                  {firstName(islanderById(state, pending[0])?.name ?? '')} + pick a partner…
                </span>
              )}
              <label className="ml-auto flex items-center gap-1 font-normal normal-case">
                <input
                  type="checkbox"
                  checked={showEveryone}
                  onChange={(e) => setShowEveryone(e.target.checked)}
                />
                everyone
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {pool.map((i) => (
                <IslanderChip
                  key={i.id}
                  islander={i}
                  selected={pending.includes(i.id)}
                  dimmed={usedIds.has(i.id) && !pending.includes(i.id)}
                  onClick={() => clickIslander(i.id)}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ---------- one player's column inside a scene ---------- */

function PlayerColumn({ scene, playerId }: { scene: Scene; playerId: PlayerId }) {
  const { state, set, player } = useStore()
  const info = state.players.find((p) => p.id === playerId)!
  const entry = scene.entries[playerId]
  const mine = playerId === player
  const myEntry = scene.entries[player]

  function patchEntry(picks: ScenePick[], stampedAt: number | null) {
    set((s) => ({
      ...s,
      scenes: s.scenes.map((sc) =>
        sc.id === scene.id
          ? { ...sc, entries: { ...sc.entries, [playerId]: { picks, stampedAt } } }
          : sc,
      ),
    }))
  }

  const actualKeys = scene.actual ? new Set(scene.actual.map(pickKey)) : null
  const score = scene.actual && entry.stampedAt ? scoreEntry(entry, scene.actual) : null

  // Anti-cheat: the other player's stamped picks stay sealed until you stamp yours
  // (or the real result is in).
  const sealed = !mine && entry.stampedAt !== null && !myEntry.stampedAt && !scene.actual

  return (
    <div
      className="rounded-xl bg-white/4 p-3 ring-1 ring-white/10"
      style={{ borderTop: `3px solid ${info.color}` }}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-bold" style={{ color: info.color }}>
          {info.name}
        </span>
        {entry.stampedAt ? (
          <span className="text-[10px] text-slate-400">
            🔒 stamped {new Date(entry.stampedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </span>
        ) : (
          <span className="text-[10px] text-slate-500">not stamped yet</span>
        )}
        {score !== null && (
          <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold">
            {score}/{scene.count} ✓
          </span>
        )}
      </div>

      {sealed ? (
        <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-white/15 text-xs text-slate-400">
          🙈 Sealed — stamp your own picks to reveal
        </div>
      ) : mine && !entry.stampedAt ? (
        <>
          <PickBuilder
            mode={scene.mode}
            count={scene.count}
            picks={entry.picks}
            onChange={(p) => patchEntry(p, null)}
          />
          <button
            type="button"
            disabled={entry.picks.length !== scene.count}
            onClick={() => patchEntry(entry.picks, Date.now())}
            className="mt-2 rounded-lg bg-pink-500 px-3 py-1.5 text-xs font-bold text-white transition enabled:hover:bg-pink-400 disabled:opacity-30"
          >
            Stamp it 🔒
          </button>
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {entry.picks.length === 0 && <span className="text-xs text-slate-500">no picks</span>}
            {entry.picks.map((p, n) => {
              const a = islanderById(state, p[0])
              if (!a) return null
              return (
                <PairChip
                  key={n}
                  a={a}
                  b={p[1] ? islanderById(state, p[1]) : undefined}
                  verdict={actualKeys ? (actualKeys.has(pickKey(p)) ? 'hit' : 'miss') : undefined}
                />
              )
            })}
          </div>
          {mine && entry.stampedAt && !scene.actual && (
            <button
              type="button"
              onClick={() => patchEntry(entry.picks, null)}
              className="mt-2 rounded-lg bg-white/8 px-3 py-1.5 text-[11px] ring-1 ring-white/10 hover:bg-white/15"
            >
              Unstamp &amp; edit
            </button>
          )}
        </>
      )}
    </div>
  )
}

/* ---------- scene card ---------- */

function SceneCard({ scene }: { scene: Scene }) {
  const { state, set } = useStore()
  const [enteringActual, setEnteringActual] = useState(false)
  const [actualDraft, setActualDraft] = useState<ScenePick[]>([])

  function patchScene(p: Partial<Scene>) {
    set((s) => ({ ...s, scenes: s.scenes.map((sc) => (sc.id === scene.id ? { ...sc, ...p } : sc)) }))
  }

  function removeScene() {
    if (!window.confirm(`Delete scene "${scene.title}"?`)) return
    set((s) => ({ ...s, scenes: s.scenes.filter((sc) => sc.id !== scene.id) }))
  }

  let banner: string | null = null
  if (scene.actual) {
    const s1 = scene.entries.p1.stampedAt ? scoreEntry(scene.entries.p1, scene.actual) : -1
    const s2 = scene.entries.p2.stampedAt ? scoreEntry(scene.entries.p2, scene.actual) : -1
    const [a, b] = state.players
    if (s1 < 0 && s2 < 0) banner = 'Nobody stamped picks for this one 😅'
    else if (s1 === s2) banner = `Dead tie — ${a.name} and ${b.name} both scored ${s1}/${scene.count} 🤝`
    else {
      const winner = s1 > s2 ? a : b
      banner = `${winner.name} called it! ${Math.max(s1, s2)}/${scene.count} vs ${Math.min(s1 < 0 ? 0 : s1, s2 < 0 ? 0 : s2)} 🏆`
    }
  }

  return (
    <div className="rounded-2xl bg-slate-900 p-4 ring-1 ring-white/10">
      <div className="mb-3 flex items-start gap-3">
        <div className="min-w-0">
          <h3 className="font-bold">{scene.title}</h3>
          <p className="text-[11px] text-slate-400">
            {scene.episode ? `${scene.episode} · ` : ''}
            {scene.mode === 'couples' ? 'couples' : 'islanders'} · pick {scene.count} ·{' '}
            {new Date(scene.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </p>
        </div>
        <button
          type="button"
          onClick={removeScene}
          className="ml-auto rounded-md bg-white/8 px-2 py-1 text-xs ring-1 ring-white/10 hover:bg-red-500/30"
          title="Delete scene"
        >
          🗑
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <PlayerColumn scene={scene} playerId="p1" />
        <PlayerColumn scene={scene} playerId="p2" />
      </div>

      <div className="mt-3 rounded-xl bg-white/4 p-3 ring-1 ring-white/10">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-sm font-bold text-amber-300">📺 The show's answer</span>
          {scene.actual && (
            <button
              type="button"
              onClick={() => {
                setActualDraft(scene.actual ?? [])
                patchScene({ actual: null })
                setEnteringActual(true)
              }}
              className="ml-auto rounded-md bg-white/8 px-2 py-1 text-[11px] ring-1 ring-white/10 hover:bg-white/15"
            >
              Edit
            </button>
          )}
        </div>

        {scene.actual ? (
          <>
            <div className="flex flex-wrap gap-1.5">
              {scene.actual.map((p, n) => {
                const a = islanderById(state, p[0])
                if (!a) return null
                return (
                  <PairChip key={n} a={a} b={p[1] ? islanderById(state, p[1]) : undefined} verdict="hit" />
                )
              })}
            </div>
            {banner && (
              <div className="mt-3 rounded-lg bg-amber-400/10 px-3 py-2 text-center text-sm font-bold text-amber-200 ring-1 ring-amber-400/30">
                {banner}
              </div>
            )}
          </>
        ) : enteringActual ? (
          <>
            <PickBuilder mode={scene.mode} count={scene.count} picks={actualDraft} onChange={setActualDraft} />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                disabled={actualDraft.length !== scene.count}
                onClick={() => {
                  patchScene({ actual: actualDraft })
                  setEnteringActual(false)
                  setActualDraft([])
                }}
                className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-amber-950 transition enabled:hover:bg-amber-300 disabled:opacity-30"
              >
                Save result &amp; score it
              </button>
              <button
                type="button"
                onClick={() => {
                  setEnteringActual(false)
                  setActualDraft([])
                }}
                className="rounded-lg bg-white/8 px-3 py-1.5 text-xs ring-1 ring-white/10"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setEnteringActual(true)}
            className="rounded-lg bg-white/8 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/10 hover:bg-white/15"
          >
            Watched the episode? Enter what actually happened →
          </button>
        )}
      </div>
    </div>
  )
}

/* ---------- new scene form + tab ---------- */

function NewSceneForm() {
  const { set } = useStore()
  const [title, setTitle] = useState('')
  const [episode, setEpisode] = useState('')
  const [mode, setMode] = useState<SceneMode>('couples')
  const [count, setCount] = useState(2)

  function create() {
    if (!title.trim()) return
    set((s) => ({
      ...s,
      scenes: [
        {
          id: uid(),
          title: title.trim(),
          episode: episode.trim() || undefined,
          mode,
          count,
          createdAt: Date.now(),
          entries: {
            p1: { picks: [], stampedAt: null },
            p2: { picks: [], stampedAt: null },
          },
          actual: null,
        },
        ...s.scenes,
      ],
    }))
    setTitle('')
    setEpisode('')
  }

  return (
    <div className="rounded-2xl bg-slate-900/60 p-4 ring-1 ring-white/10">
      <h2 className="mb-3 text-lg font-bold">New scene</h2>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-64 flex-1 flex-col gap-1 text-xs text-slate-400">
          What did the show announce?
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
            placeholder='e.g. "America will be choosing the two least compatible couples"'
            className="rounded-lg bg-white/8 px-3 py-2 text-sm text-slate-100 ring-1 ring-white/10 outline-none focus:ring-pink-400"
          />
        </label>
        <label className="flex w-28 flex-col gap-1 text-xs text-slate-400">
          Episode
          <input
            value={episode}
            onChange={(e) => setEpisode(e.target.value)}
            placeholder="Ep 28"
            className="rounded-lg bg-white/8 px-3 py-2 text-sm text-slate-100 ring-1 ring-white/10 outline-none focus:ring-pink-400"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Picking
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as SceneMode)}
            className="rounded-lg bg-white/8 px-3 py-2 text-sm text-slate-100 ring-1 ring-white/10 outline-none focus:ring-pink-400"
          >
            <option value="couples">Couples</option>
            <option value="islanders">Individual islanders</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          How many
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="rounded-lg bg-white/8 px-3 py-2 text-sm text-slate-100 ring-1 ring-white/10 outline-none focus:ring-pink-400"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={!title.trim()}
          onClick={create}
          className="rounded-xl bg-pink-500 px-4 py-2 text-sm font-bold text-white transition enabled:hover:bg-pink-400 disabled:opacity-30"
        >
          Create scene
        </button>
      </div>
    </div>
  )
}

export function ScenesTab() {
  const { state } = useStore()
  return (
    <div className="space-y-6">
      <NewSceneForm />
      {state.scenes.length === 0 && (
        <p className="text-center text-sm text-slate-500">
          No scenes yet. When the show announces a vote — "America will be choosing the two least
          compatible couples" — create a scene, you each stamp your guesses, then score it against
          what actually happens.
        </p>
      )}
      {state.scenes.map((sc) => (
        <SceneCard key={sc.id} scene={sc} />
      ))}
    </div>
  )
}
