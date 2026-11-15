import { useEffect, useMemo } from 'react'
import { BUILTIN_QUESTIONS } from '../data/questions'
import { activeNotices, ssbList } from '../content'
import { changeCount, checkPack, type Change } from '../content/pack'
import { usePreviewing } from '../content/store'
import { SSB_LISTS } from '../content/types'
import { draftChanges, loadDraft, previewDraft, useDraft, type DraftRow } from '../admin/state'
import { go } from '../lib/hooks'
import { todayISO } from '../lib/util'
import { Button, Card, Empty, PageHeader, Stat, StatGrid, Tabs, focusRing } from '../components/ui'
import { QuestionsAdmin } from './admin/Questions'
import { PicturesAdmin } from './admin/Pictures'
import { SSBAdmin } from './admin/SSBLists'
import { NotesAdmin } from './admin/Notes'
import { PapersAdmin } from './admin/Papers'
import { SiteAdmin } from './admin/Site'
import { PublishAdmin } from './admin/Publish'
import { plural } from './admin/shared'

// The content admin panel (#/admin): everything students see beyond the built-in content is managed here.
// Loaded only when opened, so it adds nothing to the app students download.

type Tab = 'overview' | 'questions' | 'pictures' | 'ssb' | 'notes' | 'papers' | 'site' | 'publish'
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'questions', label: 'Questions' },
  { id: 'pictures', label: 'TAT & PPDT pictures' },
  { id: 'ssb', label: 'SSB lists' },
  { id: 'notes', label: 'Study notes' },
  { id: 'papers', label: 'Papers & keys' },
  { id: 'site', label: 'Notices & dates' },
  { id: 'publish', label: 'Publish' },
]

export default function Admin({ sub }: { sub?: string }) {
  const row = useDraft()
  useEffect(() => { void loadDraft() }, []) // creates the draft the first time
  const tab: Tab = TABS.some(t => t.id === sub) ? (sub as Tab) : 'overview'
  const changes = useMemo(() => (row ? draftChanges(row) : []), [row])

  return (
    <div>
      <PageHeader eyebrow="Site owner" title="Content admin"
        subtitle="Questions, TAT and PPDT pictures, SSB lists, study notes, papers and notices for everyone who uses the app. Edits are a draft on this device until you publish them." />
      <DraftBar changes={changes} tab={tab} />
      <Tabs<Tab> value={tab} onChange={t => go(t === 'overview' ? 'admin' : `admin/${t}`)} tabs={TABS.map(t => (t.id === 'publish' && changes.length ? { ...t, label: `Publish (${changeCount(changes)})` } : t))} />
      {!row ? <Empty>Loading the draft…</Empty> : (
        <>
          {tab === 'overview' && <Overview row={row} />}
          {tab === 'questions' && <QuestionsAdmin row={row} />}
          {tab === 'pictures' && <PicturesAdmin row={row} />}
          {tab === 'ssb' && <SSBAdmin row={row} />}
          {tab === 'notes' && <NotesAdmin row={row} />}
          {tab === 'papers' && <PapersAdmin row={row} />}
          {tab === 'site' && <SiteAdmin row={row} />}
          {tab === 'publish' && <PublishAdmin row={row} changes={changes} />}
        </>
      )}
    </div>
  )
}

/** The draft's state, always in view: unpublished changes, the preview switch, the way to publish. */
function DraftBar({ changes, tab }: { changes: Change[]; tab: Tab }) {
  const previewing = usePreviewing()
  const n = changeCount(changes)
  return (
    <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-3xl bg-surface px-6 py-4">
      <div className="min-w-0 flex-1 body-5">
        {n ? <span className="text-saffron-300">{plural(n, 'unpublished change')}</span> : <span className="text-ink-400">No unpublished changes</span>}
      </div>
      <label className="flex items-center gap-2 body-6 text-ink-300">
        <input type="checkbox" className="size-4 accent-accent-500" checked={previewing} onChange={e => previewDraft(e.target.checked)} />
        Preview the draft in the app on this device
      </label>
      {tab !== 'publish' && <Button size="sm" disabled={!n} onClick={() => go('admin/publish')}>Review & publish</Button>}
    </div>
  )
}

function Overview({ row }: { row: DraftRow }) {
  const p = row.pack
  const issues = useMemo(() => checkPack(p), [p])
  const ssbAdded = SSB_LISTS.reduce((s, k) => s + p.ssb[k].length, 0) + p.ssb.interview.length
  const tat = p.pictures.filter(x => x.test !== 'PPDT').length, ppdt = p.pictures.filter(x => x.test !== 'TAT').length
  const link = (t: Tab, label: string) => (
    <a href={`#/admin/${t}`} className={`flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3 body-5 text-ink-100 transition-colors duration-300 ease-soft hover:bg-surface-3 ${focusRing}`}>
      {label}<span aria-hidden className="text-ink-400">→</span>
    </a>
  )

  return (
    <div className="space-y-8">
      <StatGrid className="lg:grid-cols-3">
        <Stat label="Published questions" value={p.questions.length} hint={`${BUILTIN_QUESTIONS.length - p.hiddenQuestions.length} built-in in use${p.hiddenQuestions.length ? `, ${p.hiddenQuestions.length} hidden` : ''}`} />
        <Stat label="Pictures" value={p.pictures.length} hint={`${tat} for TAT · ${ppdt} for PPDT`} />
        <Stat label="SSB entries added" value={ssbAdded} hint={`WAT ${ssbList(p, 'wat').length} · SRT ${ssbList(p, 'srt').length} · TAT scenes ${ssbList(p, 'tat').length} in all`} />
        <Stat label="Note blocks" value={p.notes.length} hint={`on ${new Set(p.notes.map(n => n.guideId)).size} topics`} />
        <Stat label="Papers added" value={p.papers.length} hint={`${Object.keys(p.paperKeys).length} answer keys`} />
        <Stat label="Notices showing" value={activeNotices(p, todayISO()).length} hint={`${Object.keys(p.examDates).length} exams with published dates`} />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Add content">
          <div className="grid gap-2">
            {link('questions', 'Add questions, or import a paper with its key')}
            {link('pictures', 'Upload TAT and PPDT pictures')}
            {link('ssb', 'WAT words, SRT situations, GD and lecturette topics, interview questions')}
            {link('notes', 'Add notes to a study topic')}
            {link('papers', 'Add past papers and official answer keys')}
            {link('site', 'Post a notice, update exam dates')}
          </div>
        </Card>
        <Card title="How publishing works">
          <ol className="list-inside list-decimal space-y-2 body-6 text-ink-300">
            <li>Everything you add or change is saved as a draft on this device. Nothing reaches students yet.</li>
            <li>Tick <span className="text-fg">Preview</span> above to use the app with your draft: take a quiz, run a TAT, open a topic.</li>
            <li>Under <span className="text-fg">Publish</span>, connect GitHub once and publish. Every change goes out in one commit.</li>
            <li>The site rebuilds in about two minutes. Each device picks up the new content the next time the app opens, and keeps it for offline use.</li>
          </ol>
          <p className="mt-4 caption-5 text-ink-500">If someone else published in the meantime, both sets of changes are kept. A content check runs before every publish and again before every deploy.</p>
        </Card>
      </div>

      <Card title="Checks">
        {issues.length === 0 ? <p className="body-6 text-verdant-300">Everything in the draft passes the checks.</p> : (
          <ul className="space-y-1 body-6">
            {issues.slice(0, 20).map((i, k) => <li key={k} className={i.warn ? 'text-saffron-300' : 'text-ember-300'}>{i.area}{i.id ? ` (${i.id})` : ''}: {i.text}</li>)}
          </ul>
        )}
      </Card>
    </div>
  )
}
