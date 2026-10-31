import { useLiveQuery } from 'dexie-react-hooks'
import { db, useSetting } from '../lib/db'
import { go } from '../lib/hooks'
import { reviewQueue } from '../lib/learning'
import { PageHeader, Tabs } from '../components/ui'
import Review from './revise/Review'
import Mistakes from './revise/Mistakes'
import Flashcards from './revise/Flashcards'

type Tab = 'review' | 'mistakes' | 'cards'

export default function Revise({ sub }: { sub?: string }) {
  const tab: Tab = sub === 'mistakes' || sub === 'cards' ? sub : 'review'
  const [newLimit] = useSetting<number>('newPerDay', 20)
  const due = useLiveQuery(async () => (await reviewQueue(newLimit)).length, [newLimit]) ?? 0
  const active = useLiveQuery(() => db.mistakes.where('status').equals('active').count(), []) ?? 0

  return (
    <div>
      <PageHeader title="Revise" eyebrow="Spaced repetition"
        subtitle="Every wrong answer comes back after 1 day, then 3, then about a week, then a month, until you stop getting it wrong. Flashcards follow the same rhythm." />
      <Tabs<Tab> value={tab} onChange={t => go(t === 'review' ? 'revise' : `revise/${t}`)} tabs={[
        { id: 'review', label: `Today's review${due ? ` · ${due}` : ''}` },
        { id: 'mistakes', label: `Mistake notebook${active ? ` · ${active}` : ''}` },
        { id: 'cards', label: 'Flashcards' },
      ]} />
      {tab === 'review' && <Review onOpenDecks={() => go('revise/cards')} />}
      {tab === 'mistakes' && <Mistakes />}
      {tab === 'cards' && <Flashcards />}
    </div>
  )
}
