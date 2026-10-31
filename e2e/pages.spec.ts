import { expect, noSideScroll, open, test } from './fixtures'

// Every page and tab renders, without errors and without sideways scrolling, on desktop and on a phone in dark mode.

const ROUTES = [
  '', 'study', 'exams', 'planner',
  'practice', 'practice/papers', 'practice/mine', 'practice/analytics',
  'revise', 'revise/mistakes', 'revise/cards',
  'progress', 'news', 'news/notes', 'news/recap',
  'ssb', 'ssb/responses', 'ssb/olq', 'ssb/interview', 'ssb/pictures',
  'writing', 'documents', 'library',
]

for (const route of ROUTES) {
  test(`#/${route} renders`, async ({ page, allowConsole }) => {
    allowConsole(/news\/latest\.json|Failed to load resource/) // headlines are fetched; a local build may have none
    await open(page, route)
    await expect(page.getByRole('heading').first()).toBeVisible()
    expect(await noSideScroll(page)).toBe(true)
  })
}

test('every study guide opens', async ({ page, allowConsole }) => {
  // Forty-odd pages in one test: give it more time, and skip the background animation (the routes above cover it).
  test.slow()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  allowConsole(/Failed to load resource/)
  await open(page, 'study')
  const hrefs = await page.locator('a[href^="#/study/"]').evaluateAll(as => [...new Set(as.map(a => a.getAttribute('href')!))])
  expect(hrefs.length).toBeGreaterThan(30)
  for (const href of hrefs) {
    await page.goto(href)
    await expect(page.getByRole('link', { name: '← Study path' }), href).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 }), href).toBeVisible()
    expect(await noSideScroll(page), href).toBe(true)
  }
})

test('an unknown route falls back to Today', async ({ page, allowConsole }) => {
  allowConsole(/Failed to load resource/)
  await open(page, 'no-such-page')
  await expect(page.getByRole('heading').first()).toBeVisible()
})
