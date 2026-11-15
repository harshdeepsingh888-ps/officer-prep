import { useSyncExternalStore } from 'react'
import { db } from '../lib/db'
import { emptyPack, filesToPack, packToFiles } from './pack'
import { CONTENT_FILES, type ContentFile, type ContentPack } from './types'

// The published content on this device. On start it is read from IndexedDB (instant, and works offline), then
// fetched fresh from the site. Pages read it with useContent(); event handlers with getContent().
// The owner can preview their unpublished draft in the app: getContent() then returns the draft instead.

const PREVIEW_FLAG = 'officer-prep:admin-preview'

let published: ContentPack = emptyPack()
let preview: ContentPack | null = null
let fetchedAt: number | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach(l => l())
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
/** A stored pack is re-checked on load: an older app version may have stored entries this one rejects. */
const recheck = (p: ContentPack) => filesToPack(packToFiles({ ...emptyPack(), ...p, ssb: { ...emptyPack().ssb, ...p.ssb } })).pack

export const contentUrl = (file: string) => `${import.meta.env.BASE_URL}content/${file}`
export const pictureUrl = (file: string) => contentUrl(`pictures/${file}`)

/** What students see: the published content, or the owner's draft while previewing. */
export const getContent = () => preview ?? published
export const getPublished = () => published
export const isPreviewing = () => preview !== null
export const lastFetched = () => fetchedAt

export function useContent(): ContentPack {
  return useSyncExternalStore(subscribe, getContent, getContent)
}
export function usePreviewing(): boolean {
  return useSyncExternalStore(subscribe, isPreviewing, isPreviewing)
}

function previewFlag() {
  try { return localStorage.getItem(PREVIEW_FLAG) === '1' } catch { return false }
}

/** Turns the draft preview on (with the draft to show) or off. Remembered on this device across reloads. */
export function setPreview(pack: ContentPack | null) {
  preview = pack
  try {
    if (pack) localStorage.setItem(PREVIEW_FLAG, '1')
    else localStorage.removeItem(PREVIEW_FLAG)
  } catch { /* private mode: the preview lasts until the tab closes */ }
  emit()
}

/** Reads the stored copy (and the draft, if previewing). Call once before the first render. */
export async function hydrateContent() {
  try {
    const row = await db.published.get('pack')
    if (row) { published = recheck(row.pack); fetchedAt = row.at }
    if (previewFlag()) {
      const d = await db.admin.get('draft')
      if (d?.key === 'draft') preview = recheck(d.pack)
    }
  } catch { /* storage unavailable: start empty, the fetch below fills it */ }
  emit()
}

/**
 * Downloads the published files. A missing file counts as empty (nothing published yet). If the network fails
 * or a file is unreadable, the copy already on this device stays in use.
 */
export async function refreshContent(fetcher: typeof fetch = fetch): Promise<'updated' | 'unchanged' | 'offline'> {
  let texts: [ContentFile, string][]
  try {
    texts = await Promise.all(CONTENT_FILES.map(async f => {
      const res = await fetcher(contentUrl(f), { cache: 'no-cache' })
      if (res.status === 404) return [f, ''] as [ContentFile, string]
      if (!res.ok) throw new Error(`${f}: ${res.status}`)
      const type = res.headers.get('content-type') ?? ''
      if (type.includes('text/html')) return [f, ''] as [ContentFile, string] // a dev server's page fallback, not a file
      return [f, await res.text()] as [ContentFile, string]
    }))
  } catch {
    return 'offline'
  }
  const { pack, unreadable } = filesToPack(Object.fromEntries(texts))
  if (unreadable.length) return 'offline'
  fetchedAt = Date.now()
  const changed = JSON.stringify(pack) !== JSON.stringify(published)
  published = pack
  try { await db.published.put({ key: 'pack', pack, at: fetchedAt }) } catch { /* kept in memory only */ }
  if (changed) emit()
  return changed ? 'updated' : 'unchanged'
}

/** Start-up: the stored copy first (so the first render has it), then a fresh download in the background. */
export function initContent(): Promise<void> {
  const ready = hydrateContent()
  ready.then(() => refreshContent()).catch(() => {})
  // Refresh when the app comes back online or into view after a while, so a long-open tab picks up new content.
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => { void refreshContent() })
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && (!fetchedAt || Date.now() - fetchedAt > 30 * 60_000)) void refreshContent()
    })
  }
  return ready
}

/** Tests: back to an empty store. */
export function resetContentForTests(pack: ContentPack = emptyPack()) {
  published = pack
  preview = null
  fetchedAt = null
  emit()
}
