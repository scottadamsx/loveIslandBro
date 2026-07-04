import { useRef, useState } from 'react'
import type { Islander, IslanderStatus } from '../types'
import { googleImagesUrl, uid } from '../lib/helpers'
import { fileToDataUrl } from '../lib/img'
import { useStore } from '../store'
import { Avatar } from '../components/Avatar'

type Filter = 'all' | 'villa' | 'out'

const STATUS_META: Record<IslanderStatus, { label: string; cls: string }> = {
  villa: { label: 'In the Villa', cls: 'bg-emerald-500/90 text-emerald-950' },
  dumped: { label: 'Dumped', cls: 'bg-slate-500/90 text-slate-950' },
  removed: { label: 'Removed', cls: 'bg-red-500/90 text-red-950' },
}

const NEXT_STATUS: Record<IslanderStatus, IslanderStatus> = {
  villa: 'dumped',
  dumped: 'removed',
  removed: 'villa',
}

function IslanderCard({ islander }: { islander: Islander }) {
  const { set } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const meta = STATUS_META[islander.status]

  function patch(p: Partial<Islander>) {
    set((s) => ({
      ...s,
      islanders: s.islanders.map((i) => (i.id === islander.id ? { ...i, ...p } : i)),
    }))
  }

  function setPhotoUrl() {
    const url = window.prompt(
      `Paste an image URL for ${islander.name}\n(right-click a photo on Google Images → "Copy image address")`,
      islander.photo?.startsWith('http') ? islander.photo : '',
    )?.trim()
    if (url) patch({ photo: url })
  }

  async function onFile(f: File | undefined) {
    if (!f) return
    try {
      patch({ photo: await fileToDataUrl(f) })
    } catch {
      window.alert('Could not read that image.')
    }
  }

  function remove() {
    if (!window.confirm(`Delete ${islander.name}? They'll also leave any couples, picks and tiers.`)) return
    set((s) => ({
      ...s,
      islanders: s.islanders.filter((i) => i.id !== islander.id),
      couples: s.couples.filter((c) => !c.members.includes(islander.id)),
      scenes: s.scenes.map((sc) => ({
        ...sc,
        entries: {
          p1: { ...sc.entries.p1, picks: sc.entries.p1.picks.filter((p) => !p.includes(islander.id)) },
          p2: { ...sc.entries.p2, picks: sc.entries.p2.picks.filter((p) => !p.includes(islander.id)) },
        },
        actual: sc.actual ? sc.actual.filter((p) => !p.includes(islander.id)) : null,
      })),
      tiers: {
        p1: Object.fromEntries(
          Object.entries(s.tiers.p1).map(([t, ids]) => [t, ids.filter((x) => x !== islander.id)]),
        ) as typeof s.tiers.p1,
        p2: Object.fromEntries(
          Object.entries(s.tiers.p2).map(([t, ids]) => [t, ids.filter((x) => x !== islander.id)]),
        ) as typeof s.tiers.p2,
      },
    }))
  }

  return (
    <div className="group overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-white/10 transition hover:ring-pink-400/50">
      <div className="relative aspect-[3/4]">
        <Avatar islander={islander} className="h-full w-full text-3xl" />
        <span
          className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.cls}`}
        >
          {meta.label}
        </span>
        <span className="absolute right-2 bottom-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-slate-200">
          {islander.entered}
        </span>
      </div>
      <div className="p-3">
        <div className="truncate font-bold">{islander.name}</div>
        <div className="truncate text-xs text-slate-400">
          {islander.age ? `${islander.age} · ` : ''}
          {islander.hometown ?? '—'}
        </div>
        <div className="mt-2 flex gap-1 text-xs">
          <button
            type="button"
            title="Search Google Images"
            onClick={() => window.open(googleImagesUrl(islander.name), '_blank')}
            className="rounded-md bg-white/8 px-2 py-1 ring-1 ring-white/10 hover:bg-white/15"
          >
            🔍
          </button>
          <button
            type="button"
            title="Set photo from URL"
            onClick={setPhotoUrl}
            className="rounded-md bg-white/8 px-2 py-1 ring-1 ring-white/10 hover:bg-white/15"
          >
            🔗
          </button>
          <button
            type="button"
            title="Upload photo"
            onClick={() => fileRef.current?.click()}
            className="rounded-md bg-white/8 px-2 py-1 ring-1 ring-white/10 hover:bg-white/15"
          >
            ⬆️
          </button>
          <button
            type="button"
            title={`Status: ${meta.label} (click to change)`}
            onClick={() => patch({ status: NEXT_STATUS[islander.status] })}
            className="rounded-md bg-white/8 px-2 py-1 ring-1 ring-white/10 hover:bg-white/15"
          >
            ↺
          </button>
          <button
            type="button"
            title="Delete"
            onClick={remove}
            className="ml-auto rounded-md bg-white/8 px-2 py-1 ring-1 ring-white/10 hover:bg-red-500/30"
          >
            🗑
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>
    </div>
  )
}

function AddIslander() {
  const { set } = useStore()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [hometown, setHometown] = useState('')

  function add() {
    if (!name.trim()) return
    set((s) => ({
      ...s,
      islanders: [
        ...s.islanders,
        {
          id: uid(),
          name: name.trim(),
          age: age ? Number(age) : undefined,
          hometown: hometown.trim() || undefined,
          entered: 'Bombshell',
          status: 'villa',
        },
      ],
    }))
    setName('')
    setAge('')
    setHometown('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/15 text-slate-400 transition hover:border-pink-400/60 hover:text-pink-300"
      >
        <span className="text-3xl">＋</span>
        <span className="text-sm font-semibold">New bombshell</span>
      </button>
    )
  }

  return (
    <div className="flex min-h-64 flex-col gap-2 rounded-2xl bg-slate-900 p-3 ring-1 ring-pink-400/40">
      <div className="text-sm font-bold text-pink-300">New islander</div>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && add()}
        placeholder="Name"
        className="rounded-lg bg-white/8 px-2.5 py-1.5 text-sm ring-1 ring-white/10 outline-none focus:ring-pink-400"
      />
      <input
        value={age}
        onChange={(e) => setAge(e.target.value.replace(/\D/g, ''))}
        placeholder="Age"
        className="rounded-lg bg-white/8 px-2.5 py-1.5 text-sm ring-1 ring-white/10 outline-none focus:ring-pink-400"
      />
      <input
        value={hometown}
        onChange={(e) => setHometown(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && add()}
        placeholder="Hometown"
        className="rounded-lg bg-white/8 px-2.5 py-1.5 text-sm ring-1 ring-white/10 outline-none focus:ring-pink-400"
      />
      <div className="mt-auto flex gap-2">
        <button
          type="button"
          onClick={add}
          className="flex-1 rounded-lg bg-pink-500 py-1.5 text-sm font-bold text-white hover:bg-pink-400"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg bg-white/8 px-3 text-sm ring-1 ring-white/10"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export function IslandersTab() {
  const { state, set } = useStore()
  const [filter, setFilter] = useState<Filter>('villa')

  const shown = state.islanders.filter((i) =>
    filter === 'all' ? true : filter === 'villa' ? i.status === 'villa' : i.status !== 'villa',
  )

  const outCount = state.islanders.filter((i) => i.status !== 'villa').length

  function everyoneToVilla() {
    if (!window.confirm(`Put ${outCount} dumped/removed islander${outCount === 1 ? '' : 's'} back in the villa?`)) return
    set((s) => ({
      ...s,
      islanders: s.islanders.map((i) => (i.status === 'villa' ? i : { ...i, status: 'villa' as const })),
    }))
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        {(
          [
            ['villa', 'In the Villa'],
            ['out', 'Dumped / Removed'],
            ['all', 'Everyone'],
          ] as [Filter, string][]
        ).map(([f, label]) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
              filter === f ? 'bg-pink-500 text-white' : 'bg-white/5 text-slate-300 ring-1 ring-white/10 hover:bg-white/10'
            }`}
          >
            {label}
          </button>
        ))}
        {outCount > 0 && (
          <button
            type="button"
            onClick={everyoneToVilla}
            className="rounded-full bg-emerald-500/15 px-3 py-1.5 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-400/30 transition hover:bg-emerald-500/25"
            title="Reset every dumped/removed islander back to In the Villa"
          >
            🏝️ Everyone → Villa
          </button>
        )}
        <span className="ml-auto text-xs text-slate-500">
          Photo tools on each card: 🔍 Google Images · 🔗 paste URL · ⬆️ upload
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {shown.map((i) => (
          <IslanderCard key={i.id} islander={i} />
        ))}
        <AddIslander />
      </div>
    </div>
  )
}
