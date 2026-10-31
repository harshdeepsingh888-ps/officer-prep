import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, useSetting, type Card, type Grade } from '../../lib/db'
import { REASONS, reviewCard, reviewQueue } from '../../lib/learning'
import { isNew, preview, startOfDay } from '../../lib/srs'
import { fmtDateTime } from '../../lib/util'
import { Badge, Button, Card as Section, Empty, Progress, Stat, inputBase } from '../../components/ui'

const GRADES: { g: Grade; label: string; key: string }[] = [
  { g: 0, label: 'Again', key: '1' },
  { g: 1, label: 'Hard', key: '2' },
  { g: 2, label: 'Good', key: '3' },
  { g: 3, label: 'Easy', key: '4' },
]

export default function Review({ onOpenDecks }: { onOpenDecks: () => void }) {
  const [newLimit, setNewLimit] = useSetting<number>('newPerDay', 20)
  const [queue, setQueue] = useState<Card[] | null>(null)
  const [i, setI] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [picked, setPicked] = useState<number | null>(null)
  const [tally, setTally] = useState({ reviewed: 0, again: 0 })

  const stats = useLiveQuery(async () => {
    const cards = await db.cards.where('status').equals('active').toArray()
    const today = await db.reviews.where('at').aboveOrEqual(startOfDay(Date.now())).toArray()
    const due = cards.filter(c => c.due <= Date.now())
    const next = cards.filter(c => c.due > Date.now()).sort((a, b) => a.due - b.due)[0]
    return {
      total: cards.length,
      dueMistakes: due.filter(c => c.kind === 'mistake').length,
      dueReviews: due.filter(c => c.kind === 'flash' && !isNew(c)).length,
      newWaiting: due.filter(c => c.kind === 'flash' && isNew(c)).length,
      newToday: today.filter(r => r.wasNew).length,
      reviewedToday: today.length,
      nextDue: next?.due,
    }
  }, [queue, i])
  const card = queue?.[i]
  const mistake = useLiveQuery(() => (card?.mistakeId ? db.mistakes.get(card.mistakeId) : undefined), [card?.mistakeId])
  const mcq = card?.kind === 'mistake' && mistake?.question ? mistake.question : null

  const start = async () => {
    setQueue(await reviewQueue(newLimit))
    setI(0)
    setRevealed(false)
    setPicked(null)
    setTally({ reviewed: 0, again: 0 })
  }

  const grade = async (g: Grade) => {
    if (!card || !queue) return
    const next = await reviewCard(card, g)
    setTally(t => ({ reviewed: t.reviewed + 1, again: t.again + (g === 0 ? 1 : 0) }))
    // "Again" comes back later in this same session.
    if (g === 0) setQueue([...queue, { ...card, ...next }])
    setI(i + 1)
    setRevealed(false)
    setPicked(null)
  }

  const pick = (opt: number) => {
    if (revealed) return
    setPicked(opt)
    setRevealed(true)
  }

  const suggested: Grade = mcq && picked !== null ? (picked === mcq.answer ? 2 : 0) : 2

  useEffect(() => {
    if (!card) return
    const on = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      if (!revealed) {
        if (mcq) { const n = 'abcd'.indexOf(e.key.toLowerCase()); if (n >= 0 && n < mcq.options.length) pick(n) }
        else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setRevealed(true) }
        return
      }
      const g = GRADES.find(x => x.key === e.key)
      if (g) grade(g.g)
      else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); grade(suggested) }
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  })

  // ── Session finished ──
  if (queue && !card) {
    return (
      <Section>
        <div className="text-[42px] font-normal leading-none tracking-display text-fg">Done for now.</div>
        <p className="mt-4 text-lead font-extralight text-ink-300">
          {tally.reviewed} reviews · {tally.again} sent back. {stats?.nextDue ? `Next card is due ${fmtDateTime(stats.nextDue)}.` : ''}
        </p>
        <Button className="mt-6" variant="subtle" onClick={() => setQueue(null)}>Back</Button>
      </Section>
    )
  }

  // ── Start screen ──
  if (!queue) {
    const dueTotal = (stats?.dueMistakes ?? 0) + (stats?.dueReviews ?? 0) + Math.min(stats?.newWaiting ?? 0, Math.max(0, newLimit - (stats?.newToday ?? 0)))
    return (
      <div className="space-y-12">
        <section className="grid grid-cols-2 gap-x-14 gap-y-10 lg:grid-cols-4">
          <Stat label="Due now" value={dueTotal} hint="in today's session" />
          <Stat label="Mistakes due" value={stats?.dueMistakes ?? 0} hint="re-attempt these first" />
          <Stat label="Reviewed today" value={stats?.reviewedToday ?? 0} />
          <Stat label="Cards in rotation" value={stats?.total ?? 0} />
        </section>
        {stats?.total === 0 ? (
          <Empty>
            Nothing to revise yet. Wrong answers from quizzes land here automatically. You can also
            <button className="mx-1 text-saffron-400 hover:underline" onClick={onOpenDecks}>add a starter flashcard deck</button>.
          </Empty>
        ) : dueTotal === 0 ? (
          <Empty>All caught up. {stats?.nextDue ? `Next card is due ${fmtDateTime(stats.nextDue)}.` : ''}</Empty>
        ) : (
          <Button size="lg" onClick={start}>Start review · {dueTotal} cards</Button>
        )}
        <div className="flex items-center gap-3 text-sm text-ink-400">
          New flashcards per day
          <input type="number" min={0} max={100} className={`${inputBase} w-20 px-3 py-1.5 text-sm`} value={newLimit} onChange={e => setNewLimit(Math.max(0, Number(e.target.value)))} />
        </div>
      </div>
    )
  }

  // ── A card ──
  const total = queue.length
  return (
    <div className="space-y-8">
      <div>
        <div className="mb-2 flex items-center justify-between text-sm text-ink-400">
          <span className="flex items-center gap-2">
            Card {i + 1} of {total}
            <Badge tone={card!.kind === 'mistake' ? 'ember' : isNew(card!) ? 'saffron' : 'iris'}>{card!.kind === 'mistake' ? 'Mistake' : isNew(card!) ? 'New' : card!.deck}</Badge>
            {mistake && <span className="text-xs text-ink-500">{mistake.subject} · {mistake.topic}</span>}
          </span>
          <button className="label text-[11px] text-ink-500 hover:text-fg" onClick={() => setQueue(queue.slice(0, i))}>End session</button>
        </div>
        <Progress value={(i / total) * 100} />
      </div>

      <Section>
        {mcq ? (
          <>
            <div className="text-[clamp(1.5rem,2.6vw,2rem)] font-normal leading-snug tracking-tight text-fg">{mcq.text}</div>
            <div className="mt-8 grid gap-2.5">
              {mcq.options.map((o, j) => {
                const cls = !revealed ? 'bg-fg/[0.04] text-ink-200 hover:bg-fg/[0.08]'
                  : j === mcq.answer ? 'bg-verdant-500/15 text-verdant-300'
                  : j === picked ? 'bg-ember-500/15 text-ember-200' : 'text-ink-500'
                return (
                  <button key={j} onClick={() => pick(j)} disabled={revealed} className={`rounded-3xl px-5 py-4 text-left text-[15px] transition-colors ${cls}`}>
                    <span className="mr-3 text-ink-500">{'ABCD'[j]}</span>{o}
                  </button>
                )
              })}
            </div>
            {!revealed && <p className="mt-3 text-xs text-ink-600">Press A–D to answer.</p>}
          </>
        ) : (
          <>
            <div className="whitespace-pre-wrap text-[clamp(1.6rem,3vw,2.4rem)] font-normal leading-tight tracking-tight text-fg">{card!.front}</div>
            {mistake?.paperUrl && <a href={mistake.paperUrl} target="_blank" rel="noreferrer" className="label mt-4 inline-block text-[11px] text-saffron-400 hover:underline">Open paper ↗</a>}
            {revealed
              ? <div className="mt-8 whitespace-pre-wrap text-xl font-light text-ink-200">{card!.back}</div>
              : <Button className="mt-8" variant="subtle" onClick={() => setRevealed(true)}>Show answer (space)</Button>}
          </>
        )}

        {revealed && mistake && (
          <div className="mt-6 space-y-1 text-sm">
            {mcq && mistake.yourAnswer !== undefined && mistake.yourAnswer !== null && (
              <div className="text-ink-400">Last time you chose <span className="text-ember-300">{'ABCD'[mistake.yourAnswer]}. {mcq.options[mistake.yourAnswer]}</span> · wrong {mistake.count}×</div>
            )}
            {mistake.reason && <div className="text-ink-400">Reason: {REASONS.find(r => r.id === mistake.reason)?.label}</div>}
            {mistake.note && <div className="text-ink-300">📝 {mistake.note}</div>}
            {mcq?.explanation && <div className="text-ink-300">💡 {mcq.explanation}</div>}
          </div>
        )}
      </Section>

      {revealed && (
        <div className="flex flex-wrap items-center gap-2">
          {GRADES.map(({ g, label }) => (
            <Button key={g} variant={g === suggested ? 'primary' : g === 0 ? 'danger' : 'subtle'} onClick={() => grade(g)}>
              {label} <span className="font-normal normal-case opacity-70">{preview(card!, g)}</span>
            </Button>
          ))}
          <span className="ml-2 text-xs text-ink-600">Keys 1–4, or space for the highlighted choice</span>
        </div>
      )}
    </div>
  )
}
