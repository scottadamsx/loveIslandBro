export type PlayerId = 'p1' | 'p2'

export interface PlayerInfo {
  id: PlayerId
  name: string
  color: string
}

export type IslanderStatus = 'villa' | 'dumped' | 'removed'

export interface Islander {
  id: string
  name: string
  age?: number
  hometown?: string
  entered: string
  status: IslanderStatus
  photo?: string
}

export interface Couple {
  id: string
  members: [string, string]
}

export type SceneMode = 'couples' | 'islanders'

/** One pick: a single islander id, or a pair of ids in couples mode. */
export type ScenePick = string[]

export interface SceneEntry {
  picks: ScenePick[]
  stampedAt: number | null
}

export interface Scene {
  id: string
  title: string
  episode?: string
  mode: SceneMode
  count: number
  createdAt: number
  entries: Record<PlayerId, SceneEntry>
  actual: ScenePick[] | null
}

export type TierName = 'S' | 'A' | 'B' | 'C' | 'D'

export type TierBoard = Record<TierName, string[]>

export interface AppState {
  players: [PlayerInfo, PlayerInfo]
  islanders: Islander[]
  couples: Couple[]
  scenes: Scene[]
  tiers: Record<PlayerId, TierBoard>
}
