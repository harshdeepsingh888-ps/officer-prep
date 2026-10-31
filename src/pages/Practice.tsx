import { go } from '../lib/hooks'
import { PageHeader, Tabs } from '../components/ui'
import Quiz from './practice/Quiz'
import PastPapers from './practice/PastPapers'
import MyQuestions from './practice/MyQuestions'
import Analytics from './practice/Analytics'

type Tab = 'quiz' | 'papers' | 'mine' | 'analytics'

export default function Practice({ sub }: { sub?: string }) {
  const tab: Tab = sub === 'papers' || sub === 'mine' ? sub : sub === 'analytics' || sub === 'history' ? 'analytics' : 'quiz'
  return (
    <div>
      <PageHeader title="Practice" subtitle="Custom tests with real negative marking, official past papers on an OMR sheet, your own question bank, and analytics that show where marks are slipping." />
      <Tabs<Tab>
        value={tab}
        onChange={t => go(t === 'quiz' ? 'practice' : `practice/${t}`)}
        tabs={[
          { id: 'quiz', label: 'Test' },
          { id: 'papers', label: 'Past papers (OMR)' },
          { id: 'mine', label: 'My questions' },
          { id: 'analytics', label: 'Analytics' },
        ]}
      />
      {tab === 'quiz' && <Quiz />}
      {tab === 'papers' && <PastPapers />}
      {tab === 'mine' && <MyQuestions />}
      {tab === 'analytics' && <Analytics />}
    </div>
  )
}
