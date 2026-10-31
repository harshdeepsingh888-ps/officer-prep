import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { OFFICIAL_LINKS, OFFICIAL_PAPERS, DESCRIPTIVE_PAPERS } from '../data/sources'
import { EXAMS } from '../data/exams'
import { db } from '../lib/db'
import { Button, Card, PageHeader, inputCls, labelCls } from '../components/ui'
import { DeviceCard } from '../components/DeviceCard'

export default function Library() {
  const links = useLiveQuery(() => db.links.toArray(), []) ?? []
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [group, setGroup] = useState('')

  const groups = [...new Set(OFFICIAL_LINKS.map(l => l.group))]
  const paperExams = EXAMS.filter(e => OFFICIAL_PAPERS.some(p => p.exam === e.id))

  return (
    <div className="space-y-14">
      <PageHeader title="Library" subtitle="Official sources, linked directly — papers stay on the official sites." />

      <div className="grid gap-x-16 gap-y-12 md:grid-cols-2">
        {groups.map(g => (
          <Card key={g} title={g}>
            <ul className="space-y-2 text-sm">
              {OFFICIAL_LINKS.filter(l => l.group === g).map(l => (
                <li key={l.url}>
                  <a href={l.url} target="_blank" rel="noreferrer" className="text-saffron-400 hover:underline">{l.title} ↗</a>
                  {l.note && <div className="text-xs text-ink-500">{l.note}</div>}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card title="Official previous-year papers (UPSC, 2024–2026)">
        <p className="mb-3 text-xs text-ink-500">To attempt one under exam conditions, use Practice → Past papers. It opens the paper and gives you a timed OMR sheet.</p>
        <div className="space-y-8">
          {paperExams.map(e => (
            <div key={e.id}>
              <div className="mb-1 text-sm font-semibold text-ink-300">{e.short}</div>
              <ul className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                {OFFICIAL_PAPERS.filter(p => p.exam === e.id).map(p => (
                  <li key={p.id} className="flex justify-between gap-2">
                    <a href={p.url} target="_blank" rel="noreferrer" className="truncate hover:text-fg">{p.sitting} — {p.paper}</a>
                    <span className="shrink-0 text-xs text-ink-500">{p.size}</span>
                  </li>
                ))}
                {e.id === 'capf' && DESCRIPTIVE_PAPERS.map(p => (
                  <li key={p.url} className="flex justify-between gap-2">
                    <a href={p.url} target="_blank" rel="noreferrer" className="truncate hover:text-fg">{p.sitting} — {p.paper}</a>
                    <span className="shrink-0 text-xs text-ink-500">{p.size}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <a href="https://www.upsc.gov.in/examinations/previous-question-papers" target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-saffron-400 hover:underline">Older years on UPSC ↗</a>
      </Card>

      <Card title="My links">
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_10rem_auto] sm:items-end">
          <div><label className={labelCls}>Title</label><input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Polity notes" /></div>
          <div><label className={labelCls}>URL</label><input className={inputCls} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" /></div>
          <div><label className={labelCls}>Group</label><input className={inputCls} value={group} onChange={e => setGroup(e.target.value)} placeholder="Notes" /></div>
          <Button disabled={!title.trim() || !/^https?:\/\//.test(url)} onClick={() => { db.links.add({ title: title.trim(), url: url.trim(), group: group.trim() || 'Notes' }); setTitle(''); setUrl('') }}>Add</Button>
        </div>
        {links.length > 0 && (
          <ul className="mt-3 divide-y divide-fg/[0.06] text-sm">
            {links.map(l => (
              <li key={l.id} className="flex items-center justify-between gap-2 py-2">
                <span className="min-w-0 truncate"><span className="mr-2 text-xs text-ink-500">{l.group}</span><a href={l.url} target="_blank" rel="noreferrer" className="hover:text-fg">{l.title} ↗</a></span>
                <Button variant="danger" size="sm" onClick={() => db.links.delete(l.id!)}>Remove</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div id="backup"><DeviceCard /></div>
    </div>
  )
}
