const pad = (n: number) => String(n).padStart(2, '0')

/** Local-date ISO string (yyyy-mm-dd) — not UTC, so it rolls over at local midnight. */
export const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const todayISO = () => isoOf(new Date())

export function addDays(iso: string, days: number) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return isoOf(d)
}

/** Monday (local ISO date) of the week that contains `iso`. */
export function weekStart(iso = todayISO()) {
  const dow = (new Date(iso + 'T00:00:00').getDay() + 6) % 7
  return addDays(iso, -dow)
}

export function daysUntil(iso: string) {
  const ms = new Date(iso + 'T00:00:00').getTime() - new Date(todayISO() + 'T00:00:00').getTime()
  return Math.round(ms / 86_400_000)
}

export const fmtDate = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export const fmtDateTime = (ms: number) =>
  new Date(ms).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export const fmtClock = (sec: number) => `${Math.floor(sec / 60)}:${pad(sec % 60)}`

export const wordCount = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0)

export const round2 = (n: number) => Math.round(n * 100) / 100

export function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(0)} KB`
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`
  return `${(n / 1024 ** 3).toFixed(1)} GB`
}

export function downloadText(filename: string, text: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Short beep through Web Audio — used when timers run out. */
export function beep(freq = 880, ms = 180) {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = freq
    gain.gain.value = 0.08
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    setTimeout(() => { osc.stop(); ctx.close() }, ms)
  } catch { /* audio unavailable */ }
}
