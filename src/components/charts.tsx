// Minimal single-series charts. One hue (the accent) per chart, 4px rounded data-ends anchored to the
// baseline, 2px gaps between bars, a hover tooltip on every mark, text in text tokens.

import { addDays, fmtDate, todayISO, weekStart } from '../lib/util'

export type Column = { key: string; value: number; label?: string; tip: string }

export function ColumnChart({ data, max, height = 160, empty = 'No data yet.' }: { data: Column[]; max?: number; height?: number; empty?: string }) {
  if (!data.length) return <div className="py-6 body-6 text-ink-500">{empty}</div>
  const top = max ?? Math.max(1, ...data.map(d => d.value))
  const every = Math.ceil(data.length / 8) // label at most ~8 ticks
  return (
    <div>
      <div className="flex items-end gap-[2px] border-b border-line" style={{ height }}>
        {data.map(d => (
          <div key={d.key} className="group relative flex h-full flex-1 items-end">
            <div className="w-full rounded-t-[4px] bg-accent-500 transition-opacity group-hover:opacity-80" style={{ height: `${Math.max(0, d.value / top) * 100}%`, minHeight: d.value > 0 ? 2 : 0 }} />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-max max-w-56 -translate-x-1/2 rounded-2xl bg-surface-2 px-3 py-2 caption-5 text-ink-100 shadow-lg ring-1 ring-line group-hover:block">{d.tip}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-[2px]">
        {data.map((d, i) => <div key={d.key} className="flex-1 truncate text-center caption-5 text-ink-500">{i % every === 0 ? d.label ?? '' : ''}</div>)}
      </div>
    </div>
  )
}

export function BarRows({ rows, max, empty = 'No data yet.' }: { rows: { key: string; label: string; value: number; display: string; tip?: string; sub?: string }[]; max?: number; empty?: string }) {
  if (!rows.length) return <div className="py-6 body-6 text-ink-500">{empty}</div>
  const top = max ?? Math.max(1, ...rows.map(r => r.value))
  return (
    <ul className="space-y-3">
      {rows.map(r => (
        <li key={r.key} className="group grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 body-6" title={r.tip}>
          <span className="truncate text-ink-200">{r.label}{r.sub && <span className="block truncate caption-5 text-ink-500">{r.sub}</span>}</span>
          <span className="h-2.5">
            <span className="block h-full rounded-r-[4px] bg-accent-500 transition-opacity group-hover:opacity-80" style={{ width: `${Math.max(0, r.value / top) * 100}%`, minWidth: r.value > 0 ? 2 : 0 }} />
          </span>
          <span className="w-14 text-right tabular-nums text-ink-300">{r.display}</span>
        </li>
      ))}
    </ul>
  )
}

// Sequential shades of the one hue: nothing, then four steps up to the busiest days.
const SHADE = ['bg-fg/[0.07]', 'bg-accent-500/30', 'bg-accent-500/55', 'bg-accent-500/80', 'bg-accent-500']

/** The last `weeks` weeks, Monday first, one square per day, darker on days with more done. */
export function ActivityCalendar({ counts, weeks = 26 }: { counts: Map<string, number>; weeks?: number }) {
  const today = todayISO()
  const first = addDays(weekStart(today), -(weeks - 1) * 7)
  const days = Array.from({ length: weeks * 7 }, (_, i) => addDays(first, i))
  // Shade against your busiest day, on a square-root scale so one huge revision day doesn't wash out the rest.
  const max = Math.max(1, ...days.map(d => counts.get(d) ?? 0))
  const level = (n: number) => (n <= 0 ? 0 : Math.min(4, Math.max(1, Math.ceil(4 * Math.sqrt(n / max)))))
  const active = days.filter(d => (counts.get(d) ?? 0) > 0).length

  const months: { col: number; label: string }[] = []
  for (let w = 0; w < weeks; w++) {
    const d = days[w * 7]
    if (w === 0 || d.slice(5, 7) !== days[(w - 1) * 7].slice(5, 7)) months.push({ col: w, label: new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short' }) })
  }
  if (months.length > 1 && months[1].col - months[0].col < 3) months.shift() // no room for the first label

  return (
    <div role="img" aria-label={`Activity calendar: active on ${active} of the last ${weeks * 7} days`}>
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: `1.75rem repeat(${weeks}, minmax(0, 1fr))` }}>
        {months.map(m => <div key={m.col} className="whitespace-nowrap pb-1 caption-5 text-ink-500" style={{ gridColumn: m.col + 2, gridRow: 1 }}>{m.label}</div>)}
        {['Mon', '', 'Wed', '', 'Fri', '', ''].map((l, r) => <div key={r} className="self-center caption-5 text-ink-500" style={{ gridColumn: 1, gridRow: r + 2 }}>{l}</div>)}
        {days.map((d, i) => {
          const n = counts.get(d) ?? 0
          const future = d > today
          return (
            <div key={d} style={{ gridColumn: Math.floor(i / 7) + 2, gridRow: (i % 7) + 2 }}
              title={future ? undefined : `${fmtDate(d)} · ${n ? `${n} thing${n === 1 ? '' : 's'} done` : 'nothing logged'}`}
              className={`aspect-square rounded-[3px] ${future ? '' : SHADE[level(n)]} ${d === today ? 'ring-1 ring-fg/50' : ''}`} />
          )
        })}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1 caption-5 text-ink-500" aria-hidden>
        Less {SHADE.map(c => <span key={c} className={`size-2.5 rounded-[3px] ${c}`} />)} More
      </div>
    </div>
  )
}
