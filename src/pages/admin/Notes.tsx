import { useState } from 'react'
import { GUIDES, guideById, type NoteBlock, type Track } from '../../data/study'
import { blockProblem, newId } from '../../content/pack'
import type { PubNote } from '../../content/types'
import { updateDraft, type DraftRow } from '../../admin/state'
import { Button, Card, Chip, Empty, inputCls } from '../../components/ui'
import { NoteBlockView } from '../study/TopicPage'
import { Field, plural } from './shared'

const TRACKS: Track[] = ['Maths', 'English', 'GK', 'Reasoning']
type Kind = NoteBlock['kind']
const KIND_LABEL: Record<Kind, string> = { points: 'Points', table: 'Table', example: 'Worked example' }

export function NotesAdmin({ row }: { row: DraftRow }) {
  const [guideId, setGuideId] = useState(GUIDES[0].id)
  const [editing, setEditing] = useState<PubNote | 'new' | null>(null)
  const g = guideById(guideId)!
  const mine = row.pack.notes.filter(n => n.guideId === guideId)
  const countFor = (id: string) => row.pack.notes.filter(n => n.guideId === id).length

  const save = async (block: NoteBlock) => {
    const id = editing === 'new' || !editing ? newId('n') : editing.id
    await updateDraft(p => ({
      ...p,
      notes: p.notes.some(n => n.id === id) ? p.notes.map(n => (n.id === id ? { ...n, block } : n)) : [...p.notes, { id, guideId, block }],
    }))
    setEditing(null)
  }
  const remove = (n: PubNote) => { if (confirm('Delete this block?')) updateDraft(p => ({ ...p, notes: p.notes.filter(x => x.id !== n.id) })) }
  /** Moves a block up or down among this topic's blocks (other topics' blocks keep their places). */
  const move = (n: PubNote, by: -1 | 1) => updateDraft(p => {
    const ids = p.notes.filter(x => x.guideId === guideId).map(x => x.id)
    const i = ids.indexOf(n.id), j = i + by
    if (j < 0 || j >= ids.length) return p
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    const order = new Map(ids.map((id, k) => [id, k]))
    const theirs = p.notes.filter(x => x.guideId === guideId).sort((a, b) => order.get(a.id)! - order.get(b.id)!)
    let k = 0
    return { ...p, notes: p.notes.map(x => (x.guideId === guideId ? theirs[k++] : x)) }
  })

  return (
    <div className="space-y-4">
      <Card title="Study notes">
        <p className="mb-4 body-6 text-ink-400">
          Add notes to any study topic. They appear on the topic page after the built-in notes, in the order below. Write <span className="font-mono">*like this*</span> to make words bold.
        </p>
        <Field label="Topic">
          <select className={inputCls} value={guideId} onChange={e => { setGuideId(e.target.value); setEditing(null) }}>
            {TRACKS.map(t => (
              <optgroup key={t} label={t}>
                {GUIDES.filter(x => x.track === t).map(x => <option key={x.id} value={x.id}>{x.topic}{countFor(x.id) ? ` (${countFor(x.id)} added)` : ''}</option>)}
              </optgroup>
            ))}
          </select>
        </Field>
        <p className="mt-3 caption-5 text-ink-500">
          Built in: {plural(g.notes.length, 'block')}{g.notes.length ? ` (${g.notes.map(b => b.h).join(' · ')})` : ''}. <a className="text-saffron-400 hover:underline" href={`#/study/${g.id}`}>Open the topic page →</a>
        </p>
      </Card>

      {editing && <BlockForm key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? undefined : editing.block} onSave={save} onCancel={() => setEditing(null)} />}

      <Card title={`Your notes on ${g.topic}`} action={!editing && <Button onClick={() => setEditing('new')}>Add block</Button>}>
        {mine.length === 0 ? <Empty>No notes added to this topic yet.</Empty> : (
          <ol className="space-y-6">
            {mine.map((n, i) => (
              <li key={n.id} className="rounded-3xl bg-surface-2 p-6">
                <NoteBlockView b={n.block} />
                <div className="mt-4 flex flex-wrap gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(n)}>Edit</Button>
                  <Button variant="ghost" size="sm" disabled={i === 0} onClick={() => move(n, -1)} aria-label="Move up">↑</Button>
                  <Button variant="ghost" size="sm" disabled={i === mine.length - 1} onClick={() => move(n, 1)} aria-label="Move down">↓</Button>
                  <Button variant="danger" size="sm" onClick={() => remove(n)}>Delete</Button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  )
}

/** One block of notes: a heading with points, a two-column table, or a worked example. */
function BlockForm({ initial, onSave, onCancel }: { initial?: NoteBlock; onSave: (b: NoteBlock) => void; onCancel: () => void }) {
  const [kind, setKind] = useState<Kind>(initial?.kind ?? 'points')
  const [h, setH] = useState(initial?.h ?? '')
  const [lines, setLines] = useState(initial?.kind === 'points' ? initial.points.join('\n') : initial?.kind === 'table' ? initial.rows.map(r => r.join(' | ')).join('\n') : '')
  const [q, setQ] = useState(initial?.kind === 'example' ? initial.q : '')
  const [a, setA] = useState(initial?.kind === 'example' ? initial.a : '')
  const [tried, setTried] = useState(false)

  const rows = lines.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const block: NoteBlock =
    kind === 'points' ? { kind, h: h.trim(), points: rows }
    : kind === 'table' ? { kind, h: h.trim(), rows: rows.map(r => { const i = r.indexOf('|'); return (i < 0 ? [r, ''] : [r.slice(0, i).trim(), r.slice(i + 1).trim()]) as [string, string] }) }
    : { kind, h: h.trim(), q: q.trim(), a: a.trim() }
  const problem = blockProblem(block)

  return (
    <Card title={initial ? 'Edit block' : 'New block'}>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">{(Object.keys(KIND_LABEL) as Kind[]).map(k => <Chip key={k} active={kind === k} onClick={() => setKind(k)}>{KIND_LABEL[k]}</Chip>)}</div>
          <Field label="Heading"><input className={inputCls} value={h} onChange={e => setH(e.target.value)} placeholder="e.g. Fundamental Rights at a glance" /></Field>
          {kind === 'points' && <Field label="Points, one per line"><textarea className={`${inputCls} h-48`} value={lines} onChange={e => setLines(e.target.value)} /></Field>}
          {kind === 'table' && (
            <Field label="Rows, one per line: term | meaning" hint="Everything after the first | is the meaning.">
              <textarea className={`${inputCls} h-48 font-mono`} value={lines} onChange={e => setLines(e.target.value)} placeholder={'Article 14 | Equality before law\nArticle 21 | Protection of life and personal liberty'} />
            </Field>
          )}
          {kind === 'example' && (
            <>
              <Field label="Question"><textarea className={`${inputCls} h-24`} value={q} onChange={e => setQ(e.target.value)} /></Field>
              <Field label="Worked answer"><textarea className={`${inputCls} h-24`} value={a} onChange={e => setA(e.target.value)} /></Field>
            </>
          )}
          {tried && problem && <p className="body-6 text-ember-300">Can't save yet: {problem}.</p>}
          <div className="flex gap-2">
            <Button onClick={() => { setTried(true); if (!problem) onSave(block) }}>{initial ? 'Save changes' : 'Add block'}</Button>
            <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          </div>
        </div>
        <div>
          <div className="mb-2 caption-1 text-ink-400">Preview</div>
          <div className="rounded-3xl bg-surface-2 p-6">{problem && !h.trim() ? <p className="body-6 text-ink-500">Start typing to see the block.</p> : <NoteBlockView b={block} />}</div>
        </div>
      </div>
    </Card>
  )
}
