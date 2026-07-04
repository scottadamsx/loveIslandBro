import type { Islander } from '../types'
import { firstName } from '../lib/helpers'
import { Avatar } from './Avatar'

export function IslanderChip({
  islander,
  onClick,
  selected = false,
  dimmed = false,
  title,
}: {
  islander: Islander
  onClick?: () => void
  selected?: boolean
  dimmed?: boolean
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      title={title ?? islander.name}
      className={`flex items-center gap-1.5 rounded-full py-1 pr-2.5 pl-1 text-xs font-medium transition
        ${selected ? 'bg-pink-500/90 text-white ring-2 ring-pink-300' : 'bg-white/8 ring-1 ring-white/10 hover:bg-white/15'}
        ${dimmed ? 'opacity-40' : ''}
        ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <Avatar islander={islander} className="h-6 w-6 rounded-full text-[9px]" />
      {firstName(islander.name)}
    </button>
  )
}

export function PairChip({
  a,
  b,
  onRemove,
  verdict,
}: {
  a: Islander
  b?: Islander
  onRemove?: () => void
  verdict?: 'hit' | 'miss'
}) {
  const ring =
    verdict === 'hit'
      ? 'ring-2 ring-emerald-400 bg-emerald-500/15'
      : verdict === 'miss'
        ? 'ring-1 ring-red-400/60 bg-red-500/10 opacity-80'
        : 'ring-1 ring-white/15 bg-white/8'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full py-1 pr-2 pl-1 text-xs font-medium ${ring}`}>
      <span className="flex -space-x-2">
        <Avatar islander={a} className="h-6 w-6 rounded-full text-[9px] ring-2 ring-slate-900" />
        {b && <Avatar islander={b} className="h-6 w-6 rounded-full text-[9px] ring-2 ring-slate-900" />}
      </span>
      {firstName(a.name)}
      {b && <span className="text-pink-300">&hearts;</span>}
      {b && firstName(b.name)}
      {verdict === 'hit' && <span className="text-emerald-300">✓</span>}
      {verdict === 'miss' && <span className="text-red-300">✗</span>}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 rounded-full px-1 text-slate-400 hover:bg-white/10 hover:text-white"
        >
          ×
        </button>
      )}
    </span>
  )
}
