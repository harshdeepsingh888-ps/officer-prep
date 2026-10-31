import { go } from '../lib/hooks'
import { PageHeader, Tabs } from '../components/ui'
import Quiz from './practice/Quiz'
import PastPapers from './practice/PastPapers'
import MyQuestions from './practice/MyQuestions'
import History from './practice/History'

type Tab = 'quiz' | 'papers' | 'mine' | 'history'

export default function Practice({ sub }: { sub?: string }) {
  const tab: Tab = sub === 'papers' || sub === 'mine' || sub === 'history' ? sub : 'quiz'
  return (
    <div>
      <PageHeader title="Practice" subtitle="Timed quizzes with real negative marking, official past papers on an OMR sheet, and your own question bank." />
      <Tabs<Tab>
        value={tab}
        onChange={t => go(t === 'quiz' ? 'practice' : `practice/${t}`)}
        tabs={[
          { id: 'quiz', label: 'Quick quiz' },
          { id: 'papers', label: 'Past papers (OMR)' },
          { id: 'mine', label: 'My questions' },
          { id: 'history', label: 'History' },
        ]}
      />
      {tab === 'quiz' && <Quiz />}
      {tab === 'papers' && <PastPapers />}
      {tab === 'mine' && <MyQuestions />}
      {tab === 'history' && <History />}
    </div>
  )
}
