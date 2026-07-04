import type { AppState, Islander, PlayerId, SceneEntry, ScenePick } from '../types'

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function otherPlayer(p: PlayerId): PlayerId {
  return p === 'p1' ? 'p2' : 'p1'
}

export function islanderById(state: AppState, id: string): Islander | undefined {
  return state.islanders.find((i) => i.id === id)
}

export function firstName(name: string): string {
  return name.split(' ')[0]
}

/** Order-insensitive key for a pick, so [a,b] === [b,a]. */
export function pickKey(pick: ScenePick): string {
  return [...pick].sort().join('+')
}

export function scoreEntry(entry: SceneEntry, actual: ScenePick[]): number {
  const actualKeys = new Set(actual.map(pickKey))
  return entry.picks.filter((p) => actualKeys.has(pickKey(p))).length
}

export interface Scoreboard {
  points: Record<PlayerId, number>
  wins: Record<PlayerId, number>
  scenesScored: number
}

export function computeScoreboard(state: AppState): Scoreboard {
  const points: Record<PlayerId, number> = { p1: 0, p2: 0 }
  const wins: Record<PlayerId, number> = { p1: 0, p2: 0 }
  let scenesScored = 0
  for (const scene of state.scenes) {
    if (!scene.actual) continue
    scenesScored++
    const s1 = scene.entries.p1.stampedAt ? scoreEntry(scene.entries.p1, scene.actual) : 0
    const s2 = scene.entries.p2.stampedAt ? scoreEntry(scene.entries.p2, scene.actual) : 0
    points.p1 += s1
    points.p2 += s2
    if (s1 > s2) wins.p1++
    else if (s2 > s1) wins.p2++
  }
  return { points, wins, scenesScored }
}

export function googleImagesUrl(name: string): string {
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(name + ' Love Island USA')}`
}

export function hashHue(s: string): number {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360
  return h
}
