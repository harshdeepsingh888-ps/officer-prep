import { describe, expect, it } from 'vitest'
import type { Question } from '../data/questions'
import { emptyPack, filesToPack, packToFiles } from '../content/pack'
import { CONTENT_DIR, PICTURE_DIR, type ContentPack, type PubPicture } from '../content/types'
import type { AdminBase } from '../lib/db'
import { GitHubError, gitHub, repoFromLocation, type GitHub, type TreeEntry } from './github'
import { loadRemote, publish } from './sync'

// Publishing against an in-memory repository that behaves like GitHub's git API: commits point at trees, a tree
// is a set of files, and the branch only moves forward from the commit it is on.

type Files = Map<string, string>
function fakeRepo(initial: Record<string, string> = {}) {
  const commits = new Map<string, { files: Files; parent: string | null; message: string }>([['c0', { files: new Map(Object.entries(initial)), parent: null, message: 'init' }]])
  const trees = new Map<string, Files>()
  const blobs = new Map<string, string>()
  let head = 'c0', n = 0
  const calls: string[] = []
  /** Pushes after the next head read, once: someone else publishing at the worst moment. */
  let raceOnce: ((files: Files) => void) | null = null

  const push = (edit: (files: Files) => void, message = 'someone else') => {
    const files = new Map(commits.get(head)!.files)
    edit(files)
    const sha = `c${++n}`
    commits.set(sha, { files, parent: head, message })
    head = sha
    return sha
  }
  const gh = {
    repo: { owner: 'o', repo: 'r', branch: 'main' },
    async head() {
      calls.push('head')
      const h = head
      if (raceOnce) { const r = raceOnce; raceOnce = null; push(r) }
      return h
    },
    async treeOf(c: string) { return `tree-of:${c}` },
    async list(dir: string, ref: string) {
      return [...commits.get(ref)!.files.keys()].filter(p => p.startsWith(dir + '/') && !p.slice(dir.length + 1).includes('/'))
        .map(path => ({ name: path.split('/').pop()!, path, sha: 'x', type: 'file' }))
    },
    async read(path: string, ref: string) { return commits.get(ref)!.files.get(path) ?? '' },
    async blob(b64: string) { calls.push('blob'); const sha = `b${blobs.size}`; blobs.set(sha, b64); return sha },
    async tree(baseTree: string, entries: TreeEntry[]) {
      calls.push(`tree:${entries.map(e => `${e.sha === null ? '-' : '+'}${e.path.split('/').pop()}`).join(',')}`)
      const files = new Map(commits.get(baseTree.replace('tree-of:', ''))!.files)
      for (const e of entries) {
        if (e.sha === null) { if (!files.delete(e.path)) throw new GitHubError(422, 'no such path') }
        else files.set(e.path, e.content ?? `blob:${blobs.get(e.sha!)}`)
      }
      const id = `t${trees.size}`
      trees.set(id, files)
      return id
    },
    async commit(message: string, tree: string, parent: string) {
      const sha = `c${++n}`
      commits.set(sha, { files: trees.get(tree)!, parent, message })
      return sha
    },
    async moveBranch(sha: string) {
      calls.push('move')
      if (commits.get(sha)!.parent !== head) throw new GitHubError(422, 'GitHub said: Update is not a fast forward')
      head = sha
    },
  }
  return {
    gh: gh as unknown as GitHub, calls, push,
    get head() { return head },
    filesAt: (sha = head) => commits.get(sha)!.files,
    messageAt: (sha = head) => commits.get(sha)!.message,
    raceNext: (edit: (files: Files) => void) => { raceOnce = edit },
  }
}

const q = (id: string, over: Partial<Question> = {}): Question => ({ id, exams: ['cds'], subject: 'English', topic: 'Idioms & phrases', text: `What is ${id}?`, options: ['A', 'B'], answer: 0, ...over })
const pic = (id: string): PubPicture => ({ id, file: `${id}.jpg`, test: 'TAT', addedAt: 1 })
const pack = (over: Partial<ContentPack> = {}): ContentPack => ({ ...emptyPack(), ...over, ssb: { ...emptyPack().ssb, ...over.ssb } })
const asRepo = (p: ContentPack) => Object.fromEntries(Object.entries(packToFiles(p)).map(([f, t]) => [`${CONTENT_DIR}/${f}`, t]))
/** The content files directly in public/content (not the pictures folder). */
const contentAt = (files: Files) => filesToPack(Object.fromEntries([...files].filter(([p]) => p.startsWith(CONTENT_DIR + '/') && !p.slice(CONTENT_DIR.length + 1).includes('/')).map(([p, t]) => [p.split('/').pop()!, t]))).pack
const baseOf = async (gh: GitHub): Promise<AdminBase> => { const r = await loadRemote(gh); return { commit: r.commit, files: r.files, at: 0 } }
const noBlobs = async () => undefined

describe('publishing', () => {
  it('one commit with only the changed files, and the branch moves to it', async () => {
    const repo = fakeRepo({ ...asRepo(pack({ questions: [q('q-1')] })), 'src/App.tsx': 'code' })
    const base = await baseOf(repo.gh)
    const r = await publish(repo.gh, { base, draft: pack({ questions: [q('q-1'), q('q-2')] }), blob: noBlobs, message: 'Two idioms' })
    expect(r.kind).toBe('published')
    expect(repo.calls.filter(c => c.startsWith('tree'))).toEqual(['tree:+questions.json'])
    expect(repo.messageAt()).toBe('Two idioms\n\nPublished from the admin panel.')
    expect(contentAt(repo.filesAt()).questions.map(x => x.id)).toEqual(['q-1', 'q-2'])
    expect(repo.filesAt().get('src/App.tsx')).toBe('code') // the rest of the repository is untouched
    if (r.kind === 'published') expect(r.base.commit).toBe(repo.head)
  })

  it('uploads new pictures and deletes removed ones in the same commit', async () => {
    const repo = fakeRepo({ ...asRepo(pack({ pictures: [pic('pic-old')] })), [`${PICTURE_DIR}/pic-old.jpg`]: 'old bytes' })
    const base = await baseOf(repo.gh)
    const blob = async (id: string) => (id === 'pic-new' ? new Blob(['new bytes'], { type: 'image/jpeg' }) : undefined)
    await publish(repo.gh, { base, draft: pack({ pictures: [pic('pic-new')] }), blob })
    const files = repo.filesAt()
    expect(files.has(`${PICTURE_DIR}/pic-old.jpg`)).toBe(false)
    expect(files.get(`${PICTURE_DIR}/pic-new.jpg`)).toBe(`blob:${btoa('new bytes')}`)
    expect(contentAt(files).pictures.map(p => p.id)).toEqual(['pic-new'])
    expect(repo.calls.filter(c => c.startsWith('tree'))).toEqual(['tree:+pictures.json,+pic-new.jpg,-pic-old.jpg'])
  })

  it('a new picture whose file is not on this device stops the publish, before anything is written', async () => {
    const repo = fakeRepo(asRepo(pack()))
    const before = repo.head
    await expect(publish(repo.gh, { base: await baseOf(repo.gh), draft: pack({ pictures: [pic('pic-lost')] }), blob: noBlobs })).rejects.toThrow(/isn't on this device/)
    expect(repo.head).toBe(before)
  })

  it('someone else published since the draft was loaded: both sets of changes go out', async () => {
    const repo = fakeRepo(asRepo(pack({ questions: [q('q-1')] })))
    const base = await baseOf(repo.gh)
    repo.push(files => { files.set(`${CONTENT_DIR}/ssb.json`, packToFiles(pack({ ssb: { ...emptyPack().ssb, gd: ['Their GD topic'] } }))['ssb.json']) })
    const r = await publish(repo.gh, { base, draft: pack({ questions: [q('q-1'), q('q-mine')] }), blob: noBlobs })
    expect(r).toMatchObject({ kind: 'published', merged: true })
    const now = contentAt(repo.filesAt())
    expect(now.questions.map(x => x.id)).toEqual(['q-1', 'q-mine'])
    expect(now.ssb.gd).toEqual(['Their GD topic'])
    expect(r.pack.ssb.gd).toEqual(['Their GD topic']) // and the draft now has it
  })

  it('the branch moves while publishing: it starts again from the new head and keeps both', async () => {
    const repo = fakeRepo(asRepo(pack()))
    const base = await baseOf(repo.gh)
    repo.raceNext(files => files.set('README.md', 'edited'))
    const r = await publish(repo.gh, { base, draft: pack({ hiddenQuestions: ['b1'] }), blob: noBlobs })
    expect(r.kind).toBe('published')
    expect(repo.calls.filter(c => c === 'move')).toHaveLength(2)
    expect(repo.filesAt().get('README.md')).toBe('edited')
    expect(contentAt(repo.filesAt()).hiddenQuestions).toEqual(['b1'])
  })

  it('nothing changed: no commit', async () => {
    const repo = fakeRepo(asRepo(pack({ questions: [q('q-1')] })))
    const r = await publish(repo.gh, { base: await baseOf(repo.gh), draft: pack({ questions: [q('q-1')] }), blob: noBlobs })
    expect(r.kind).toBe('nothing')
    expect(repo.calls).not.toContain('move')
  })

  it('a draft that fails the checks is never published', async () => {
    const repo = fakeRepo(asRepo(pack()))
    await expect(publish(repo.gh, { base: await baseOf(repo.gh), draft: pack({ questions: [q('q-1', { answer: 5 })] }), blob: noBlobs })).rejects.toThrow(/Fix this first: Questions \(q-1\)/)
    expect(repo.calls).not.toContain('move')
  })

  it('a draft from this device\'s copy (no commit known) merges with what is live', async () => {
    const repo = fakeRepo(asRepo(pack({ questions: [q('q-live')] })))
    const base: AdminBase = { commit: null, files: packToFiles(pack()), at: 0 }
    await publish(repo.gh, { base, draft: pack({ questions: [q('q-mine')] }), blob: noBlobs })
    expect(contentAt(repo.filesAt()).questions.map(x => x.id)).toEqual(['q-live', 'q-mine'])
  })

  it('an empty repository folder loads as empty content', async () => {
    const repo = fakeRepo({ 'src/App.tsx': 'code' })
    expect((await loadRemote(repo.gh)).pack).toEqual(emptyPack())
  })
})

describe('the GitHub client', () => {
  const recorder = (respond: (url: string, init: RequestInit) => Response) => {
    const seen: { url: string; init: RequestInit }[] = []
    const f = (async (url: string, init: RequestInit) => { seen.push({ url, init }); return respond(url, init) }) as unknown as typeof fetch
    return { f, seen }
  }

  it('sends the token only to api.github.com, never cached', async () => {
    const { f, seen } = recorder(() => Response.json({ object: { sha: 'abc' } }))
    expect(await gitHub('tok', { owner: 'me', repo: 'officer-prep', branch: 'main' }, f).head()).toBe('abc')
    expect(seen[0].url).toBe('https://api.github.com/repos/me/officer-prep/git/ref/heads/main')
    expect(seen[0].init.cache).toBe('no-store')
    expect((seen[0].init.headers as Record<string, string>).Authorization).toBe('Bearer tok')
  })

  it('reads a missing file as empty and explains a bad token', async () => {
    const missing = recorder(() => Response.json({ message: 'Not Found' }, { status: 404 }))
    expect(await gitHub('tok', { owner: 'o', repo: 'r', branch: 'main' }, missing.f).read('public/content/ssb.json', 'c1')).toBe('')
    expect((missing.seen[0].init.headers as Record<string, string>).Accept).toBe('application/vnd.github.raw+json')
    const bad = recorder(() => Response.json({ message: 'Bad credentials' }, { status: 401 }))
    await expect(gitHub('tok', { owner: 'o', repo: 'r', branch: 'main' }, bad.f).head()).rejects.toThrow(/rejected the token/)
  })

  it('finds the repository from a GitHub Pages address', () => {
    expect(repoFromLocation({ hostname: 'someone.github.io', pathname: '/officer-prep/app/' })).toEqual({ owner: 'someone', repo: 'officer-prep' })
    expect(repoFromLocation({ hostname: 'localhost', pathname: '/app/' })).toBeNull()
  })
})
