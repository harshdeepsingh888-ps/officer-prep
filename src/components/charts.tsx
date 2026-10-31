// Minimal single-series charts. One hue (iris) per chart, 4px rounded data-ends anchored to the
// baseline, 2px gaps between bars, a hover tooltip on every mark, text in text tokens.

export type Column = { key: string; value: number; label?: string; tip: string }

export function ColumnChart({ data, max, height = 160, empty = 'No data yet.' }: { data: Column[]; max?: number; height?: number; empty?: string }) {
  if (!data.length) return <div className="py-6 text-sm font-light text-ink-500">{empty}</div>
  const top = max ?? Math.max(1, ...data.map(d => d.value))
  const every = Math.ceil(data.length / 8) // label at most ~8 ticks
  return (
    <div>
      <div className="flex items-end gap-[2px] border-b border-fg/10" style={{ height }}>
        {data.map(d => (
          <div key={d.key} className="group relative flex h-full flex-1 items-end">
            <div className="w-full rounded-t-[4px] bg-iris-500 transition-opacity group-hover:opacity-80" style={{ height: `${Math.max(0, d.value / top) * 100}%`, minHeight: d.value > 0 ? 2 : 0 }} />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-max max-w-56 -translate-x-1/2 rounded-2xl bg-ink-900 px-3 py-2 text-xs text-ink-100 shadow-lg ring-1 ring-fg/10 group-hover:block">{d.tip}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-[2px]">
        {data.map((d, i) => <div key={d.key} className="flex-1 truncate text-center text-[10px] text-ink-500">{i % every === 0 ? d.label ?? '' : ''}</div>)}
      </div>
    </div>
  )
}

export function BarRows({ rows, max, empty = 'No data yet.' }: { rows: { key: string; label: string; value: number; display: string; tip?: string; sub?: string }[]; max?: number; empty?: string }) {
  if (!rows.length) return <div className="py-6 text-sm font-light text-ink-500">{empty}</div>
  const top = max ?? Math.max(1, ...rows.map(r => r.value))
  return (
    <ul className="space-y-3">
      {rows.map(r => (
        <li key={r.key} className="group grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm" title={r.tip}>
          <span className="truncate text-ink-200">{r.label}{r.sub && <span className="block truncate text-xs text-ink-500">{r.sub}</span>}</span>
          <span className="h-2.5">
            <span className="block h-full rounded-r-[4px] bg-iris-500 transition-opacity group-hover:opacity-80" style={{ width: `${Math.max(0, r.value / top) * 100}%`, minWidth: r.value > 0 ? 2 : 0 }} />
          </span>
          <span className="w-14 text-right tabular-nums text-ink-300">{r.display}</span>
        </li>
      ))}
    </ul>
  )
}
