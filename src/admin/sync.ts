import { changedFiles, changesBetween, checkPack, describeChanges, filesToPack, mergePacks, packToFiles, type Issue } from '../content/pack'
import { CONTENT_DIR, CONTENT_FILES, PICTURE_DIR, type ContentFiles, type ContentPack } from '../content/types'
import type { AdminBase } from '../lib/db'
import { GitHubError, blobToBase64, type GitHub, type TreeEntry } from './github'

// Loading and publishing content through the repository. A publish is one commit holding every changed file
// and picture, so the site never deploys half a change. If someone else published since this draft was loaded,
// their changes are merged in first (src/content/pack.ts → mergePacks) instead of being overwritten.

export type Remote = { commit: string; files: ContentFiles; pack: ContentPack; issues: Issue[] }

/** The content files at a commit (the branch head by default). */
export async function loadRemote(gh: GitHub, at?: string): Promise<Remote> {
  const commit = at ?? await gh.head()
  const texts = await Promise.all(CONTENT_FILES.map(f => gh.read(`${CONTENT_DIR}/${f}`, commit)))
  const files = Object.fromEntries(CONTENT_FILES.map((f, i) => [f, texts[i]])) as ContentFiles
  const { pack, issues, unreadable } = filesToPack(files)
  if (unreadable.length) throw new Error(`${unreadable.join(', ')} in the repository isn't a valid content file. Fix or delete it on GitHub, then try again.`)
  return { commit, files, pack, issues }
}

export type Published = { kind: 'published'; commit: string; base: AdminBase; pack: ContentPack; merged: boolean; summary: string }
export type NothingToPublish = { kind: 'nothing'; base: AdminBase; pack: ContentPack; merged: boolean }

export async function publish(gh: GitHub, opts: {
  base: AdminBase
  draft: ContentPack
  /** A picture's file on this device (new pictures are uploaded from here). */
  blob: (id: string) => Promise<Blob | undefined>
  message?: string
  onStep?: (step: string) => void
}): Promise<Published | NothingToPublish> {
  const step = opts.onStep ?? (() => {})
  const basePack = filesToPack(opts.base.files).pack
  const uploaded = new Map<string, string>() // picture id → blob sha, kept across retries

  for (let attempt = 0; attempt < 3; attempt++) {
    step('Checking what is published now…')
    const head = await gh.head()
    const fresh = head === opts.base.commit
    const remote = fresh ? { files: opts.base.files, pack: basePack } : await loadRemote(gh, head)
    // Changes published from elsewhere since this draft was loaded are kept; this draft's own changes go on top.
    const merged = fresh ? opts.draft : mergePacks(basePack, opts.draft, remote.pack)
    const othersChanged = !fresh && changesBetween(basePack, remote.pack).length > 0

    const blocking = checkPack(merged).filter(i => !i.warn)
    if (blocking.length) throw new Error(`Fix this first: ${blocking[0].area}${blocking[0].id ? ` (${blocking[0].id})` : ''}: ${blocking[0].text}`)

    const files = packToFiles(merged)
    const baseAfter = (commit: string): AdminBase => ({ commit, files, at: Date.now() })
    const changed = changedFiles(remote.files, files)
    const live = new Set(remote.pack.pictures.map(p => p.id))
    const kept = new Set(merged.pictures.map(p => p.id))
    const added = merged.pictures.filter(p => !live.has(p.id))
    const removed = remote.pack.pictures.filter(p => !kept.has(p.id))
    if (!changed.length && !added.length && !removed.length) return { kind: 'nothing', base: baseAfter(head), pack: merged, merged: othersChanged }

    const entries: TreeEntry[] = changed.map(f => ({ path: `${CONTENT_DIR}/${f}`, mode: '100644', type: 'blob', content: files[f] }))
    for (const [i, p] of added.entries()) {
      step(`Uploading picture ${i + 1} of ${added.length}…`)
      if (!uploaded.has(p.id)) {
        const b = await opts.blob(p.id)
        if (!b) throw new Error(`The picture "${p.caption || p.file}" isn't on this device, so it can't be uploaded. Remove it from the draft and add it again.`)
        uploaded.set(p.id, await gh.blob(await blobToBase64(b)))
      }
      entries.push({ path: `${PICTURE_DIR}/${p.file}`, mode: '100644', type: 'blob', sha: uploaded.get(p.id)! })
    }
    if (removed.length) {
      const present = new Set((await gh.list(PICTURE_DIR, head)).map(f => f.name))
      for (const p of removed) if (present.has(p.file)) entries.push({ path: `${PICTURE_DIR}/${p.file}`, mode: '100644', type: 'blob', sha: null })
    }

    step('Saving the commit…')
    const summary = describeChanges(changesBetween(remote.pack, merged))
    const title = opts.message?.trim() || `Content: ${summary.length > 120 ? summary.slice(0, 117) + '…' : summary}`
    const tree = await gh.tree(await gh.treeOf(head), entries)
    const commit = await gh.commit(`${title}\n\nPublished from the admin panel.`, tree, head)
    try {
      await gh.moveBranch(commit)
    } catch (e) {
      // Someone pushed between reading the head and moving the branch: start again from the new head.
      if (e instanceof GitHubError && e.status === 422 && /fast.?forward/i.test(e.message) && attempt < 2) continue
      throw e
    }
    return { kind: 'published', commit, base: baseAfter(commit), pack: merged, merged: othersChanged, summary }
  }
  throw new Error('The branch kept changing while publishing. Wait a minute and try again.')
}
