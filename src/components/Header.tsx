import { SEASON_LABEL, DATA_AS_OF } from '../data/seed'
import { computeScoreboard } from '../lib/helpers'
import { useStore } from '../store'

export type Tab = 'islanders' | 'couples' | 'scenes' | 'tiers'

const TABS: { id: Tab; label: string }[] = [
  { id: 'islanders', label: '🏝️ Islanders' },
  { id: 'couples', label: '💘 Couples' },
  { id: 'scenes', label: '🗳️ Scenes' },
  { id: 'tiers', label: '🏆 Tier List' },
]

export function Header({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const { state, set, player, setPlayer } = useStore()
  const score = computeScoreboard(state)

  function rename(id: 'p1' | 'p2') {
    const current = state.players.find((p) => p.id === id)!
    const name = window.prompt('Player name:', current.name)?.trim()
    if (!name) return
    set((s) => ({
      ...s,
      players: s.players.map((p) => (p.id === id ? { ...p, name } : p)) as typeof s.players,
    }))
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <div>
          <h1 className="text-xl font-black tracking-tight">
            Villa<span className="text-pink-400">Vision</span> 🌴
          </h1>
          <p className="text-[11px] text-slate-400">
            {SEASON_LABEL} · {DATA_AS_OF}
          </p>
        </div>

        <nav className="flex gap-1 rounded-xl bg-white/5 p-1 ring-1 ring-white/10">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                tab === t.id ? 'bg-pink-500 text-white shadow' : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right text-[11px] leading-tight text-slate-400 sm:block">
            <div className="font-semibold text-slate-200">Scoreboard</div>
            <div>
              {state.players[0].name} {score.points.p1} pts ({score.wins.p1}W) · {state.players[1].name}{' '}
              {score.points.p2} pts ({score.wins.p2}W)
            </div>
          </div>
          <div className="flex rounded-xl bg-white/5 p-1 ring-1 ring-white/10">
            {state.players.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlayer(p.id)}
                onDoubleClick={() => rename(p.id)}
                title="Click to switch · double-click to rename"
                className="rounded-lg px-3 py-1.5 text-sm font-bold transition"
                style={
                  player === p.id
                    ? { background: p.color, color: '#0f172a' }
                    : { color: 'rgb(148 163 184)' }
                }
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
