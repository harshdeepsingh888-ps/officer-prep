// A level earned by active study days: any day you practised counts, so a missed day never takes a level away.
// Plain learner titles, not military ranks (those belong to the people who earn them); the steps get longer as you go up.

export const LEVELS = [
  { name: 'Rookie', days: 0 },
  { name: 'Learner', days: 7 },
  { name: 'Striver', days: 21 },
  { name: 'Achiever', days: 45 },
  { name: 'Contender', days: 75 },
  { name: 'Challenger', days: 110 },
  { name: 'Pathfinder', days: 150 },
  { name: 'Trailblazer', days: 200 },
  { name: 'Elite', days: 260 },
  { name: 'Legend', days: 330 },
]

export function levelFor(activeDays: number) {
  let level = 0
  while (level + 1 < LEVELS.length && activeDays >= LEVELS[level + 1].days) level++
  const current = LEVELS[level]
  const next = LEVELS[level + 1]
  return {
    level, current, next,
    toNext: next ? next.days - activeDays : 0,
    progress: next ? (activeDays - current.days) / (next.days - current.days) : 1,
  }
}
