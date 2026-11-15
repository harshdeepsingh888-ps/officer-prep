import { useMemo, useRef, useState } from 'react'
import { newId } from '../../content/pack'
import type { PictureTest, PubPicture } from '../../content/types'
import { prepareImage } from '../../admin/images'
import { basePackOf, putBlob, updateDraft, useConnection, type DraftRow } from '../../admin/state'
import { Badge, Button, Card, Chip, Empty, inputCls } from '../../components/ui'
import { Flash, PictureThumb, count, plural, useFlash } from './shared'

const TESTS: { id: PictureTest; label: string; hint: string }[] = [
  { id: 'TAT', label: 'TAT', hint: 'Clear pictures with one or more people; the test shows each for 30 seconds.' },
  { id: 'PPDT', label: 'PPDT', hint: 'Shown hazy (blurred, greyscale) for 30 seconds, as in the screening test.' },
  { id: 'both', label: 'Both', hint: 'Used in either test.' },
]

export function PicturesAdmin({ row }: { row: DraftRow }) {
  const conn = useConnection()
  const [test, setTest] = useState<PictureTest>('TAT')
  const [filter, setFilter] = useState<PictureTest | 'all'>('all')
  const [busy, setBusy] = useState('')
  const [dragging, setDragging] = useState(false)
  const [flash, setFlash] = useFlash()
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const pics = row.pack.pictures
  const live = useMemo(() => new Set(basePackOf(row).pictures.map(p => p.id)), [row.base])
  const shown = pics.filter(p => filter === 'all' || p.test === filter).slice().reverse()

  const upload = async (files: File[]) => {
    const images = files.filter(f => f.type.startsWith('image/'))
    if (!images.length) return
    setError('')
    const added: PubPicture[] = []
    const failed: string[] = []
    for (const [i, f] of images.entries()) {
      setBusy(`Preparing ${i + 1} of ${images.length}…`)
      try {
        const { blob, w, h } = await prepareImage(f)
        const id = newId('pic')
        await putBlob(id, blob)
        added.push({ id, file: `${id}.jpg`, test, w, h, addedAt: Date.now() })
      } catch {
        failed.push(f.name)
      }
    }
    if (added.length) await updateDraft(p => ({ ...p, pictures: [...p.pictures, ...added] }))
    setBusy('')
    if (added.length) setFlash(`${plural(added.length, 'picture')} added for ${test === 'both' ? 'TAT and PPDT' : test}. Publish to put them on the site.`)
    if (failed.length) setError(`Couldn't open ${failed.join(', ')}. Use JPEG or PNG.`)
  }

  const edit = (id: string, patch: Partial<PubPicture>) => updateDraft(p => ({ ...p, pictures: p.pictures.map(x => (x.id === id ? { ...x, ...patch } : x)) }))
  const remove = (pic: PubPicture) => {
    if (confirm(live.has(pic.id) ? 'Remove this picture? It is deleted from the site when you publish.' : 'Remove this picture from the draft?'))
      updateDraft(p => ({ ...p, pictures: p.pictures.filter(x => x.id !== pic.id) }))
  }

  return (
    <div className="space-y-4">
      <Card title="Add pictures">
        <p className="mb-4 body-6 text-ink-400">
          Pictures go into the TAT and PPDT tests for everyone, mixed with each student's own uploads; written scenes fill any gap.
          Only publish pictures you have the right to: your own drawings or photos, or images licensed for reuse. SSB boards don't release their picture sets,
          and scans of coaching books are usually copyrighted.
        </p>
        <div className="mb-4">
          <div className="mb-2 caption-1 text-ink-400">Use new pictures in</div>
          <div className="flex flex-wrap gap-2">{TESTS.map(t => <Chip key={t.id} active={test === t.id} onClick={() => setTest(t.id)}>{t.label}</Chip>)}</div>
          <p className="mt-2 caption-5 text-ink-500">{TESTS.find(t => t.id === test)!.hint}</p>
        </div>
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); upload([...e.dataTransfer.files]) }}
          className={`flex flex-col items-center gap-3 rounded-3xl border border-dashed px-6 py-10 text-center transition-colors duration-300 ease-soft ${dragging ? 'border-accent-400 bg-accent-500/10' : 'border-line'}`}>
          <p className="body-6 text-ink-300">Drop pictures here, or</p>
          <Button disabled={!!busy} onClick={() => fileRef.current?.click()}>{busy || 'Choose pictures…'}</Button>
          <p className="caption-5 text-ink-500">Scaled to 1600 px and saved as JPEG (about 300 KB each).</p>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files) upload([...e.target.files]); e.target.value = '' }} />
        </div>
        <div className="mt-3 space-y-1">
          <Flash msg={flash} />
          <Flash msg={error} tone="error" />
        </div>
      </Card>

      <Card title="Pictures" action={<span className="caption-5 text-ink-400">{plural(pics.length, 'picture')}</span>}>
        <div className="mb-4 flex flex-wrap gap-2">
          {(['all', 'TAT', 'PPDT', 'both'] as const).map(f => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>{f === 'all' ? 'All' : f === 'both' ? 'Both' : f} {count(f === 'all' ? pics.length : pics.filter(p => p.test === f).length)}</Chip>
          ))}
        </div>
        {shown.length === 0 ? <Empty>No pictures {filter === 'all' ? 'yet' : 'for this test'}.</Empty> : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map(p => <PictureCard key={p.id} pic={p} isNew={!live.has(p.id)} conn={conn} onEdit={patch => edit(p.id, patch)} onRemove={() => remove(p)} />)}
          </ul>
        )}
      </Card>
    </div>
  )
}

function PictureCard({ pic, isNew, conn, onEdit, onRemove }: {
  pic: PubPicture; isNew: boolean; conn: ReturnType<typeof useConnection>; onEdit: (patch: Partial<PubPicture>) => void; onRemove: () => void
}) {
  const [caption, setCaption] = useState(pic.caption ?? '')
  return (
    <li className="overflow-hidden rounded-3xl bg-surface-2">
      <PictureThumb pic={pic} conn={conn} className="aspect-[4/3] w-full" />
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {TESTS.map(t => <Chip key={t.id} active={pic.test === t.id} onClick={() => onEdit({ test: t.id })} className="!px-2 caption-4">{t.label}</Chip>)}
          {isNew && <Badge tone="saffron">not published yet</Badge>}
        </div>
        <input className={inputCls} value={caption} placeholder="Caption (only labels saved answers)" aria-label="Caption"
          onChange={e => setCaption(e.target.value)} onBlur={() => { if (caption.trim() !== (pic.caption ?? '')) onEdit({ caption: caption.trim() || undefined }) }} />
        <div className="flex items-center justify-between">
          <span className="caption-5 text-ink-500">{pic.w && pic.h ? `${pic.w} × ${pic.h}` : ''}</span>
          <Button variant="danger" size="sm" onClick={onRemove}>Remove</Button>
        </div>
      </div>
    </li>
  )
}
