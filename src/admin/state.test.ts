import { beforeEach, describe, expect, it } from 'vitest'
import { emptyPack } from '../content/pack'
import { getContent, resetContentForTests, setPreview } from '../content/store'
import { db, exportAll } from '../lib/db'
import { discardDraft, draftChanges, exportDraft, getBlob, importDraft, loadDraft, pruneBlobs, putBlob, updateDraft } from './state'

const question = { id: 'q-1', exams: ['afcat' as const], subject: 'Mathematics' as const, topic: 'Percentage', text: '10% of 50?', options: ['5', '10'], answer: 0 }

beforeEach(async () => {
  resetContentForTests()
  await Promise.all([db.admin.clear(), db.adminBlobs.clear(), db.published.clear()])
})

describe('the admin draft', () => {
  it('starts from the published content and tracks unpublished changes', async () => {
    resetContentForTests({ ...emptyPack(), hiddenQuestions: ['b1'] })
    const row = await loadDraft()
    expect(row.pack.hiddenQuestions).toEqual(['b1'])
    expect(row.base.commit).toBeNull()
    expect(draftChanges(row)).toEqual([])

    await updateDraft(p => ({ ...p, questions: [...p.questions, question] }))
    expect(draftChanges(await loadDraft())).toEqual([{ area: 'Questions', added: 1, removed: 0, changed: 0 }])

    await discardDraft()
    expect((await loadDraft()).pack.questions).toEqual([])
  })

  it('quick successive edits never overwrite each other', async () => {
    await Promise.all(['a', 'b', 'c'].map(w => updateDraft(p => ({ ...p, ssb: { ...p.ssb, wat: [...p.ssb.wat, w] } }))))
    expect((await loadDraft()).pack.ssb.wat.sort()).toEqual(['a', 'b', 'c'])
  })

  it('a preview follows the draft as it is edited', async () => {
    await loadDraft()
    setPreview((await loadDraft()).pack)
    await updateDraft(p => ({ ...p, ssb: { ...p.ssb, gd: ['Previewed topic'] } }))
    expect(getContent().ssb.gd).toEqual(['Previewed topic'])
    setPreview(null)
    expect(getContent().ssb.gd).toEqual([])
  })

  it('a draft file carries the content and unpublished pictures to another device', async () => {
    await putBlob('pic-1', new Blob(['jpeg bytes'], { type: 'image/jpeg' }))
    await updateDraft(p => ({ ...p, questions: [question], pictures: [{ id: 'pic-1', file: 'pic-1.jpg', test: 'PPDT', addedAt: 1 }] }))
    const file = await exportDraft()

    await Promise.all([db.admin.clear(), db.adminBlobs.clear()])
    const r = await importDraft(file)
    expect(r).toEqual({ issues: [], pictures: 1, missing: 0 })
    expect((await loadDraft()).pack.questions).toEqual([question])
    expect(await (await getBlob('pic-1'))!.text()).toBe('jpeg bytes')
    await expect(importDraft('{"app":"officer-prep"}')).rejects.toThrow('Not a content draft file')
  })

  it('picture files no longer in the draft or the live content are cleared away', async () => {
    await putBlob('pic-keep', new Blob(['a']))
    await putBlob('pic-gone', new Blob(['b']))
    await updateDraft(p => ({ ...p, pictures: [{ id: 'pic-keep', file: 'pic-keep.jpg', test: 'TAT', addedAt: 1 }] }))
    await pruneBlobs(await loadDraft())
    expect(await db.adminBlobs.toCollection().primaryKeys()).toEqual(['pic-keep'])
  })

  it('is never part of a progress backup', async () => {
    await updateDraft(p => ({ ...p, questions: [question] }))
    await db.published.put({ key: 'pack', pack: emptyPack(), at: 1 })
    const backup = JSON.parse(await exportAll()).data
    expect(Object.keys(backup)).not.toContain('admin')
    expect(Object.keys(backup)).not.toContain('adminBlobs')
    expect(Object.keys(backup)).not.toContain('published')
  })
})
