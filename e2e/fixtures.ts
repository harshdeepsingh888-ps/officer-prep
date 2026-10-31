import { test as base, expect, type Page } from '@playwright/test'

/**
 * A page that fails the test on any uncaught error or console error, so every regression test also checks
 * that nothing broke quietly. Call `allowConsole(/pattern/)` for an error a test expects.
 */
export const test = base.extend<{ errors: string[]; allowConsole: (re: RegExp) => void }>({
  errors: async ({ page }, use) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(`pageerror: ${e.message}`))
    page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`) })
    await use(errors)
  },
  allowConsole: async ({ errors }, use) => {
    const allowed: RegExp[] = []
    await use(re => { allowed.push(re) })
    const left = errors.filter(e => !allowed.some(re => re.test(e)))
    expect(left, 'errors in the page').toEqual([])
  },
})

export { expect }

/** Opens a route (e.g. "practice/papers") and waits for the page to render. */
export async function open(page: Page, route = '') {
  await page.goto(`#/${route}`)
  await expect(page.locator('main')).not.toBeEmpty()
}

/** True when nothing on the page is wider than the window (no sideways scrolling). */
export const noSideScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
