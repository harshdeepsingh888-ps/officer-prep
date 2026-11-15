import { describe, expect, it } from 'vitest'
import { BUILTIN_QUESTIONS } from '../data/questions'
import { checkPack, filesToPack } from './pack'
import { CONTENT_FILES } from './types'

// The content published from the admin panel, as committed in the repository. The deploy runs the tests first,
// so content that fails these checks never reaches the site (the panel checks before publishing, too).

const raw = import.meta.glob('/public/content/*.json', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const pictureFiles = new Set(Object.keys(import.meta.glob('/public/content/pictures/*')).map(p => p.split('/').pop()))
const files = Object.fromEntries(CONTENT_FILES.map(f => [f, raw[`/public/content/${f}`] ?? '']))

describe('published content (public/content)', () => {
  const { pack, issues, unreadable } = filesToPack(files)

  it('all six files are there', () => {
    expect(CONTENT_FILES.filter(f => !raw[`/public/content/${f}`])).toEqual([])
  })

  it('every file is readable and every entry passes the checks', () => {
    expect(unreadable).toEqual([])
    expect(issues).toEqual([])
    expect(checkPack(pack).filter(i => !i.warn)).toEqual([])
  })

  it('every picture has its file', () => {
    expect(pack.pictures.filter(p => !pictureFiles.has(p.file)).map(p => p.file)).toEqual([])
  })

  it('published question ids never collide with built-in ones', () => {
    const builtIn = new Set(BUILTIN_QUESTIONS.map(q => q.id))
    expect(pack.questions.filter(q => builtIn.has(q.id)).map(q => q.id)).toEqual([])
  })
})
