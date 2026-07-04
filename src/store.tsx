import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppState, PlayerId } from './types'
import { buildSeed, seedPhotoFor } from './data/seed'

const KEY = 'love-island-bro-v2'
const OLD_KEY = 'love-island-bro-v1'

function load(): AppState {
  const seed = buildSeed()
  try {
    let raw = localStorage.getItem(KEY)
    if (!raw) {
      const old = localStorage.getItem(OLD_KEY)
      if (old) {
        // v1 seeded real elimination results (spoilers). Put everyone back in
        // the villa; statuses are set manually from here on. Keep everything else.
        const s = JSON.parse(old) as AppState
        s.islanders = s.islanders.map((i) => ({ ...i, status: 'villa' }))
        localStorage.removeItem(OLD_KEY)
        raw = JSON.stringify(s)
        localStorage.setItem(KEY, raw)
      }
    }
    if (!raw) return seed
    const s = JSON.parse(raw) as AppState
    s.islanders = s.islanders.map((i) => {
      // Drop saved /cast/ paths whose file no longer exists (photo was removed).
      if (i.photo?.startsWith('/cast/') && i.photo !== seedPhotoFor(i.id)) {
        return { ...i, photo: seedPhotoFor(i.id) }
      }
      // Backfill photos added after the state was first saved.
      return i.photo ? i : { ...i, photo: seedPhotoFor(i.id) }
    })
    return s
  } catch {
    return seed
  }
}

interface Store {
  state: AppState
  set: (fn: (s: AppState) => AppState) => void
  player: PlayerId
  setPlayer: (p: PlayerId) => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load)
  const [player, setPlayer] = useState<PlayerId>(
    () =>
      ((localStorage.getItem(KEY + ':player') ?? localStorage.getItem(OLD_KEY + ':player')) as PlayerId) ||
      'p1',
  )

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    localStorage.setItem(KEY + ':player', player)
  }, [player])

  const value = useMemo<Store>(
    () => ({ state, set: (fn) => setState((s) => fn(s)), player, setPlayer }),
    [state, player],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore outside StoreProvider')
  return v
}
