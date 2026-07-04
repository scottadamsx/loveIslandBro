import type { AppState, Islander, IslanderStatus, TierBoard } from '../types'
import cast from './cast.json'
import photos from './photos.json'

const photoMap = photos as Record<string, string>

export const SEASON_LABEL: string = cast.seasonLabel
export const DATA_AS_OF: string = cast.dataAsOf

export function seedPhotoFor(id: string): string | undefined {
  return photoMap[id]
}

function emptyTiers(): TierBoard {
  return { S: [], A: [], B: [], C: [], D: [] }
}

export function buildSeed(): AppState {
  const islanders: Islander[] = cast.islanders.map((i) => ({
    ...i,
    status: i.status as IslanderStatus,
    photo: photoMap[i.id],
  }))
  return {
    players: [
      { id: 'p1', name: 'Scott', color: '#38bdf8' },
      { id: 'p2', name: 'Maria', color: '#f472b6' },
    ],
    islanders,
    couples: cast.couples.map(([a, b], n) => ({
      id: `seed-couple-${n}`,
      members: [a, b] as [string, string],
    })),
    scenes: [],
    tiers: { p1: emptyTiers(), p2: emptyTiers() },
  }
}
