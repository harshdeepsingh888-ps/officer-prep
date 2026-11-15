import { useState } from 'react'
import { BUILTIN_SSB, listKey } from '../../content'
import { SSB_LABEL } from '../../content/pack'
import type { InterviewQ, SSBListKey } from '../../content/types'
import { updateDraft, type DraftRow } from '../../admin/state'
import { Button, Card, Chip, inputCls } from '../../components/ui'
import { Flash, count, plural, useFlash } from './shared'

type Key = SSBListKey | 'interview'

const HELP: Record<Key, { hint: string; example: string }> = {
  wat: { hint: 'One word per line. Students see each for 15 seconds.', example: 'Ambition\nCriticism\nSnow' },
  srt: { hint: 'One situation per line, ending with "He…" or "She…" as the built-in ones do.', example: 'He is leading a patrol when the radio fails and the weather turns. He…' },
  tat: { hint: 'Written scenes, one per line. They stand in for pictures when there aren\'t enough.', example: 'A woman stands at a hospital window at night while a doctor speaks to her.' },
  lecturette: { hint: 'One topic per line. Students pick one of four and speak for 3 minutes.', example: 'Drones in modern warfare' },
  gd: { hint: 'One group discussion topic per line.', example: 'Should NCC be compulsory in colleges?' },
  essay: { hint: 'One essay topic per line, for the Writing page.', example: 'Technology and the soldier of tomorrow' },
  interview: { hint: 'One question per line. A line starting with # names the area for the questions below it.', example: '# Motivation\nWhy do you want to join the armed forces?\n# Current affairs\nWhat do you know about the Agnipath scheme?' },
}

const LABEL: Record<Key, string> = { ...SSB_LABEL, interview: 'Interview questions' }
const KEYS: Key[] = ['wat', 'srt', 'tat', 'lecturette', 'gd', 'essay', 'interview']

const toText = (row: DraftRow, key: Key) => {
  if (key !== 'interview') return row.pack.ssb[key].join('\n')
  const out: string[] = []
  let area = ''
  for (const q of row.pack.ssb.interview) {
    if (q.area !== area) { out.push(`# ${q.area}`); area = q.area }
    out.push(q.q)
  }
  return out.join('\n')
}

export function SSBAdmin({ row }: { row: DraftRow }) {
  const [key, setKey] = useState<Key>('wat')
  const size = (k: Key) => (k === 'interview' ? row.pack.ssb.interview.length : row.pack.ssb[k].length)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {KEYS.map(k => <Chip key={k} active={key === k} onClick={() => setKey(k)}>{LABEL[k]} {count(size(k))}</Chip>)}
      </div>
      <ListEditor key={`${key}-${row.base.at}`} row={row} list={key} />
    </div>
  )
}

function ListEditor({ row, list }: { row: DraftRow; list: Key }) {
  const saved = toText(row, list)
  const [text, setText] = useState(saved)
  const [flash, setFlash] = useFlash()
  const builtIn = list === 'interview' ? [] : BUILTIN_SSB[list]
  const dirty = text !== saved

  const save = async () => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    const seen = new Set(builtIn.map(listKey))
    let already = 0, repeated = 0
    if (list === 'interview') {
      const qs: InterviewQ[] = []
      const mine = new Set<string>()
      let area = 'General'
      for (const l of lines) {
        if (l.startsWith('#')) { area = l.replace(/^#+\s*/, '') || 'General'; continue }
        if (mine.has(listKey(l))) { repeated++; continue }
        mine.add(listKey(l))
        qs.push({ area, q: l })
      }
      await updateDraft(p => ({ ...p, ssb: { ...p.ssb, interview: qs } }))
      setText(toText({ ...row, pack: { ...row.pack, ssb: { ...row.pack.ssb, interview: qs } } }, 'interview'))
      setFlash(`Saved ${plural(qs.length, 'question')}${repeated ? ` · ${repeated} repeated, left out` : ''}.`)
      return
    }
    const items: string[] = []
    for (const l of lines) {
      if (seen.has(listKey(l))) { if (builtIn.some(b => listKey(b) === listKey(l))) already++; else repeated++; continue }
      seen.add(listKey(l))
      items.push(l.slice(0, 600))
    }
    await updateDraft(p => ({ ...p, ssb: { ...p.ssb, [list]: items } }))
    setText(items.join('\n'))
    setFlash(`Saved ${plural(items.length, 'entry', 'entries')}${already ? ` · ${already} already built in, left out` : ''}${repeated ? ` · ${repeated} repeated, left out` : ''}.`)
  }

  const lineCount = text.split(/\r?\n/).filter(l => l.trim() && !(list === 'interview' && l.trim().startsWith('#'))).length
  return (
    <Card title={LABEL[list]} action={<span className="caption-5 text-ink-400">{builtIn.length ? `${builtIn.length} built in + ` : ''}{lineCount} published</span>}>
      <p className="mb-3 body-6 text-ink-400">{HELP[list].hint} Published entries are added to the built-in ones; entries already built in are left out.</p>
      <textarea className={`${inputCls} h-80 font-mono`} value={text} onChange={e => setText(e.target.value)} placeholder={HELP[list].example} aria-label={LABEL[list]} />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button disabled={!dirty} onClick={save}>Save list</Button>
        {dirty && <Button variant="ghost" onClick={() => setText(saved)}>Undo edits</Button>}
        {dirty && <span className="caption-5 text-saffron-300">Unsaved edits</span>}
        <Flash msg={flash} />
      </div>
      {builtIn.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer caption-1 text-ink-400">Built-in {LABEL[list].toLowerCase()} ({builtIn.length})</summary>
          <ol className="mt-3 list-inside list-decimal space-y-1 body-6 text-ink-300">{builtIn.map((b, i) => <li key={i}>{b}</li>)}</ol>
        </details>
      )}
    </Card>
  )
}
