import { useLiveQuery } from 'dexie-react-hooks'
import { changesBetween, filesToPack, packToFiles, type Issue } from '../content/pack'
import { getPublished, isPreviewing, setPreview } from '../content/store'
import type { ContentPack } from '../content/types'
import { db, type AdminBase, type AdminRow, type PublishLog } from '../lib/db'
import { blobToBase64, repoFromLocation, type Repo } from './github'

// The admin panel's state on the owner's device: the draft, the version it started from, the repository
// connection, the publish log and picture files. None of it is part of a progress backup or Drive sync.

export type DraftRow = Extract<AdminRow, { key: 'draft' }>

/** The base for a draft made from this device's copy of the published content (no commit known). */
export const deviceBase = (): AdminBase => ({ commit: null, files: packToFiles(getPublished()), at: Date.now() })

export const basePackOf = (row: DraftRow) => filesToPack(row.base.files).pack

/** The draft, created from the published content the first time the panel opens. */
export async function loadDraft(): Promise<DraftRow> {
  const row = await db.admin.get('draft')
  if (row?.key === 'draft') return row
  const fresh: DraftRow = { key: 'draft', pack: structuredClone(getPublished()), base: deviceBase(), updatedAt: Date.now() }
  await db.admin.put(fresh)
  return fresh
}

export function useDraft(): DraftRow | undefined {
  return useLiveQuery(async () => {
    const r = await db.admin.get('draft')
    return r?.key === 'draft' ? r : undefined
  }, [])
}

/** Unpublished changes in the draft, area by area. */
export const draftChanges = (row: DraftRow) => changesBetween(basePackOf(row), row.pack)

async function afterChange() {
  if (isPreviewing()) setPreview((await loadDraft()).pack)
}

/** Edits the draft atomically (quick successive edits never overwrite each other). */
export async function updateDraft(fn: (p: ContentPack) => ContentPack) {
  await db.transaction('rw', db.admin, async () => {
    const row = await loadDraft()
    await db.admin.put({ ...row, pack: fn(structuredClone(row.pack)), updatedAt: Date.now() })
  })
  await afterChange()
}

/** Replaces the draft and the version it is based on (after loading or publishing). */
export async function setDraft(pack: ContentPack, base: AdminBase) {
  await db.admin.put({ key: 'draft', pack, base, updatedAt: Date.now() })
  await afterChange()
}

/** Throws away unpublished changes. */
export async function discardDraft() {
  const row = await loadDraft()
  await setDraft(basePackOf(row), row.base)
}

export async function previewDraft(on: boolean) {
  setPreview(on ? (await loadDraft()).pack : null)
}

// ── Connection and token ─────────────────────────────────────────

export type Connection = Repo

export function useConnection(): Connection | null | undefined {
  return useLiveQuery(async () => {
    const r = await db.admin.get('connection')
    if (r?.key === 'connection') return { owner: r.owner, repo: r.repo, branch: r.branch }
    const guess = typeof location === 'undefined' ? null : repoFromLocation(location)
    return guess ? { ...guess, branch: 'main' } : null
  }, [])
}

export const saveConnection = (c: Connection) => db.admin.put({ key: 'connection', owner: c.owner.trim(), repo: c.repo.trim(), branch: c.branch.trim() || 'main' })

// The token is kept out of IndexedDB, so it can never end up in a backup file or in Drive.
const TOKEN = 'officer-prep:admin-token'
export function getToken(): string {
  try { return localStorage.getItem(TOKEN) ?? sessionStorage.getItem(TOKEN) ?? '' } catch { return '' }
}
/** remember: keep it on this device; otherwise only until the tab closes. */
export function saveToken(token: string, remember: boolean) {
  try {
    localStorage.removeItem(TOKEN)
    sessionStorage.removeItem(TOKEN)
    if (token) (remember ? localStorage : sessionStorage).setItem(TOKEN, token.trim())
  } catch { /* storage blocked: the token lasts for this page only */ }
}
export const tokenRemembered = () => { try { return !!localStorage.getItem(TOKEN) } catch { return false } }

// ── Publish log ─────────────────────────────────────────────────────

export function useLog(): PublishLog[] {
  return useLiveQuery(async () => {
    const r = await db.admin.get('log')
    return r?.key === 'log' ? r.entries : []
  }, []) ?? []
}
export async function addLog(entry: PublishLog) {
  await db.transaction('rw', db.admin, async () => {
    const r = await db.admin.get('log')
    const entries = r?.key === 'log' ? r.entries : []
    await db.admin.put({ key: 'log', entries: [entry, ...entries].slice(0, 30) })
  })
}

// ── Picture files ──────────────────────────────────────────────────

export const putBlob = (id: string, blob: Blob) => db.adminBlobs.put({ id, blob })
export const getBlob = async (id: string) => (await db.adminBlobs.get(id))?.blob

/** Drops files of pictures that are neither in the draft nor in its base. */
export async function pruneBlobs(row: DraftRow) {
  const keep = new Set([...row.pack.pictures, ...basePackOf(row).pictures].map(p => p.id))
  const all = await db.adminBlobs.toCollection().primaryKeys()
  await db.adminBlobs.bulkDelete(all.filter(id => !keep.has(id)))
}

// ── Draft files: carry a draft to another device, or keep a copy ──────────

type DraftFile = { app: 'officer-prep-content'; version: 1; exportedAt: string; files: Record<string, string>; pictures: Record<string, { type: string; data: string }> }

export async function exportDraft(): Promise<string> {
  const row = await loadDraft()
  const pictures: DraftFile['pictures'] = {}
  for (const p of row.pack.pictures) {
    const b = await getBlob(p.id)
    if (b) pictures[p.id] = { type: b.type || 'image/jpeg', data: await blobToBase64(b) }
  }
  const file: DraftFile = { app: 'officer-prep-content', version: 1, exportedAt: new Date().toISOString(), files: packToFiles(row.pack), pictures }
  return JSON.stringify(file)
}

/** Makes a draft file the draft (the base stays, so publishing still merges with what is live). */
export async function importDraft(text: string): Promise<{ issues: Issue[]; pictures: number; missing: number }> {
  let file: DraftFile
  try { file = JSON.parse(text) } catch { throw new Error('Not a content draft file') }
  if (file?.app !== 'officer-prep-content' || !file.files) throw new Error('Not a content draft file')
  const { pack, issues } = filesToPack(file.files)
  let pictures = 0
  for (const [id, pic] of Object.entries(file.pictures ?? {})) {
    const bytes = Uint8Array.from(atob(pic.data), c => c.charCodeAt(0))
    await putBlob(id, new Blob([bytes], { type: pic.type }))
    pictures++
  }
  const row = await loadDraft()
  const live = new Set(basePackOf(row).pictures.map(p => p.id))
  const missing = pack.pictures.filter(p => !live.has(p.id) && !file.pictures?.[p.id]).length
  await setDraft(pack, row.base)
  return { issues, pictures, missing }
}

