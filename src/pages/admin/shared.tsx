import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { EXAMS, type ExamId } from '../../data/exams'
import { BUILTIN_QUESTIONS, type Question } from '../../data/questions'
import { GUIDES } from '../../data/study'
import { SUBJECTS } from '../../content/pack'
import { pictureUrl } from '../../content/store'
import type { PubPicture } from '../../content/types'
import { db } from '../../lib/db'
import { Chip, inputCls, labelCls } from '../../components/ui'
import type { Connection } from '../../admin/state'

export { SUBJECTS }

export function Field({ label, hint, children, className = '' }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className={labelCls}>{label}</span>
      {children}
      {hint && <span className="mt-1 block caption-5 text-ink-500">{hint}</span>}
    </label>
  )
}

export function ExamChips({ value, onChange }: { value: ExamId[]; onChange: (v: ExamId[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Exams">
      {EXAMS.map(e => (
        <Chip key={e.id} active={value.includes(e.id)} onClick={() => onChange(value.includes(e.id) ? value.filter(x => x !== e.id) : [...value, e.id])}>{e.short}</Chip>
      ))}
    </div>
  )
}

export function SubjectSelect({ value, onChange, id }: { value: Question['subject']; onChange: (s: Question['subject']) => void; id?: string }) {
  return (
    <select id={id} className={inputCls} value={value} onChange={e => onChange(e.target.value as Question['subject'])}>
      {SUBJECTS.map(s => <option key={s}>{s}</option>)}
    </select>
  )
}

/** Topic names already in use for a subject: the study guides' first (so new questions land on a topic page), then the rest. */
export function topicsFor(subject: Question['subject'], extra: Question[] = []): string[] {
  const guide = GUIDES.filter(g => g.subject === subject).map(g => g.topic)
  const other = [...BUILTIN_QUESTIONS, ...extra].filter(q => q.subject === subject).map(q => q.topic)
  return [...new Set([...guide, ...other])]
}

/** A message that clears itself after a few seconds. */
export function useFlash(): [string, (m: string) => void] {
  const [msg, setMsg] = useState('')
  const t = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(t.current), [])
  return [msg, m => { setMsg(m); clearTimeout(t.current); t.current = setTimeout(() => setMsg(''), 5000) }]
}

export function Flash({ msg, tone = 'ok' }: { msg: string; tone?: 'ok' | 'error' }) {
  if (!msg) return null
  return <p role="status" className={`body-6 ${tone === 'ok' ? 'text-verdant-300' : 'text-ember-300'}`}>{msg}</p>
}

/** "Show 50 more" under a long list. */
export function More({ shown, total, onMore }: { shown: number; total: number; onMore: () => void }) {
  if (shown >= total) return null
  return (
    <div className="mt-4 text-center">
      <button className="rounded-lg px-3 py-2 button-sm text-ink-300 hover:text-fg" onClick={onMore}>Show more ({total - shown} left)</button>
    </div>
  )
}

/** The text that says what a list holds, for counts on chips: "TAT 12". */
export const count = (n: number) => <span className="opacity-60">{n}</span>

/** Where to show a picture from: this device's file if it has one, else the site, else GitHub (just published, not deployed yet). */
export function PictureThumb({ pic, conn, className = '' }: { pic: PubPicture; conn?: Connection | null; className?: string }) {
  const local = useLiveQuery(async () => (await db.adminBlobs.get(pic.id)) ?? null, [pic.id]) // undefined while loading
  const [blobUrl, setBlobUrl] = useState<string>()
  const [failed, setFailed] = useState(0)
  useEffect(() => {
    if (!local) { setBlobUrl(undefined); return }
    const u = URL.createObjectURL(local.blob)
    setBlobUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [local])
  const box = `bg-surface-2 ${className}`
  if (local === undefined || (local && !blobUrl)) return <div className={box} />
  const raw = conn ? `https://raw.githubusercontent.com/${conn.owner}/${conn.repo}/${conn.branch}/public/content/pictures/${pic.file}` : ''
  const src = (blobUrl ? [blobUrl] : [pictureUrl(pic.file), raw].filter(Boolean))[failed]
  if (!src) return <div className={`flex items-center justify-center px-3 text-center caption-5 text-ink-500 ${box}`}>Not on the site yet</div>
  return <img key={src} src={src} alt={pic.caption ?? ''} className={`object-cover ${box}`} onError={() => setFailed(f => f + 1)} />
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
