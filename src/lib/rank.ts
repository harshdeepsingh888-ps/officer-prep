// A rank earned by active study days: any day you practised counts, so a missed day never demotes you.
// Army rank names, for motivation only; the steps get longer as you go up.

export const RANKS = [
  { name: 'Cadet', days: 0 },
  { name: 'Lieutenant', days: 7 },
  { name: 'Captain', days: 21 },
  { name: 'Major', days: 45 },
  { name: 'Lieutenant Colonel', days: 75 },
  { name: 'Colonel', days: 110 },
  { name: 'Brigadier', days: 150 },
  { name: 'Major General', days: 200 },
  { name: 'Lieutenant General', days: 260 },
  { name: 'General', days: 330 },
]

export function rankFor(activeDays: number) {
  let level = 0
  while (level + 1 < RANKS.length && activeDays >= RANKS[level + 1].days) level++
  const rank = RANKS[level]
  const next = RANKS[level + 1]
  return {
    level, rank, next,
    toNext: next ? next.days - activeDays : 0,
    progress: next ? (activeDays - rank.days) / (next.days - rank.days) : 1,
  }
}
