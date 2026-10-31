import { go } from '../lib/hooks'
import { PageHeader, Tabs } from '../components/ui'
import Quiz from './practice/Quiz'
import PastPapers from './practice/PastPapers'
import MyQuestions from './practice/MyQuestions'
import Analytics from './practice/Analytics'

type Tab = 'quiz' | 'papers' | 'mine' | 'analytics'

export default function Practice({ sub, arg }: { sub?: string; arg?: string }) {
  const tab: Tab = sub === 'papers' || sub === 'mine' ? sub : sub === 'analytics' || sub === 'history' ? 'analytics' : 'quiz'
  return (
    <div>
      <PageHeader title="Practice" subtitle="Quick tests, sectional tests and full mocks in each exam's pattern with real negative marking, a weekly quiz, official PYQ papers on an OMR sheet, and analytics that show where marks are slipping." />
      <Tabs<Tab>
        value={tab}
        onChange={t => go(t === 'quiz' ? 'practice' : `practice/${t}`)}
        tabs={[
          { id: 'quiz', label: 'Tests' },
          { id: 'papers', label: 'PYQ papers' },
          { id: 'mine', label: 'My questions' },
          { id: 'analytics', label: 'Analytics' },
        ]}
      />
      {tab === 'quiz' && <Quiz />}
      {tab === 'papers' && <PastPapers />}
      {tab === 'mine' && <MyQuestions paperId={arg} />}
      {tab === 'analytics' && <Analytics />}
    </div>
  )
}
