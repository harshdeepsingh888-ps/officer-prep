import { expect, type Locator, type Page } from '@playwright/test'

// Small helpers shared by the flow specs. Most form labels in the app are not tied to their inputs
// (no htmlFor), so `field()` finds an input by the label text right before it.

/** A titled card (`<section>` with an `<h2>` title), e.g. section(page, 'Write a question'). */
export const section = (page: Page, title: string | RegExp) =>
  page.locator('section').filter({ has: page.getByRole('heading', { name: title, exact: typeof title === 'string' }) })

/** The input / select / textarea that follows a label with exactly this text. */
export const field = (scope: Page | Locator, label: string) =>
  scope.locator(`xpath=.//label[normalize-space(.)=${xq(label)}]/following-sibling::*[1]`)

/** The value of a <Stat> (big number under a small label). */
export const stat = (scope: Page | Locator, label: string) =>
  scope.locator(`xpath=.//div[contains(@class,'label')][normalize-space(.)=${xq(label)}]/following-sibling::div[1]`)

/** XPath string literal. */
const xq = (s: string) => (s.includes('"') ? `'${s}'` : `"${s}"`)

export const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** An answer option of the running quiz (or a review card): "A" + option text. */
export const option = (page: Page, j: number, text: string) =>
  page.getByRole('button', { name: new RegExp(`^${'ABCD'[j]}\\s*${escapeRe(text.trim())}$`) })

/** Accepts the next alert / confirm dialog and resolves with its message. */
export function acceptDialog(page: Page): Promise<string> {
  return new Promise(resolve => {
    page.once('dialog', async d => {
      const msg = d.message()
      await d.accept()
      resolve(msg)
    })
  })
}

/** Every row of an IndexedDB object store of the app's database. */
export async function idbAll<T = Record<string, unknown>>(page: Page, store: string): Promise<T[]> {
  return page.evaluate(store => new Promise<T[]>((resolve, reject) => {
    const req = indexedDB.open('officer-prep')
    req.onerror = () => reject(req.error)
    req.onsuccess = () => {
      const db = req.result
      const r = db.transaction(store, 'readonly').objectStore(store).getAll()
      r.onsuccess = () => { resolve(r.result as T[]); db.close() }
      r.onerror = () => { reject(r.error); db.close() }
    }
  }), store)
}

/** A value from the app's settings store (undefined if unset). */
export async function setting<T = unknown>(page: Page, key: string): Promise<T | undefined> {
  return page.evaluate(key => new Promise<T | undefined>((resolve, reject) => {
    const req = indexedDB.open('officer-prep')
    req.onerror = () => reject(req.error)
    req.onsuccess = () => {
      const db = req.result
      const r = db.transaction('settings', 'readonly').objectStore('settings').get(key)
      r.onsuccess = () => { resolve((r.result as { value: T } | undefined)?.value); db.close() }
      r.onerror = () => { reject(r.error); db.close() }
    }
  }), key)
}

export type Q = { id: string; text: string; options: string[]; answer: number; subject: string; topic: string }
export type Run = { title: string; qs: Q[]; answers: (number | null)[]; marked: boolean[]; idx: number; deadline: number | null }

/** The running test, once the app has saved it. */
export async function savedRun(page: Page, title?: RegExp): Promise<Run> {
  let run: Run | undefined
  await expect.poll(async () => {
    run = await setting<Run>(page, 'quizRun')
    return run && (!title || title.test(run.title))
  }, { message: 'the running test is saved' }).toBe(true)
  return run!
}

/** Local ISO date, `days` from today (the app counts in local days too). */
export function isoPlus(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
