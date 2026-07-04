import type { Islander } from '../types'
import { hashHue } from '../lib/helpers'

export function Avatar({ islander, className = '' }: { islander: Islander; className?: string }) {
  if (islander.photo) {
    return (
      <img
        src={islander.photo}
        alt={islander.name}
        draggable={false}
        className={`object-cover object-top select-none ${className}`}
      />
    )
  }
  const hue = hashHue(islander.name)
  const initials = islander.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
  return (
    <div
      className={`flex items-center justify-center font-bold text-white/85 select-none ${className}`}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 65% 42%), hsl(${(hue + 70) % 360} 65% 30%))`,
      }}
    >
      {initials}
    </div>
  )
}
