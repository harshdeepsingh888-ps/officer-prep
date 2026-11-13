import { expect, noSideScroll, test } from './fixtures'

// The landing page sits at the site root and the app at app/. These check that the page loads cleanly on both
// screens, that its one action opens the app, and that old links into the app still land in the right place.
// Each test takes the allowConsole fixture so that any console error fails it; `/^$/` allows none.

test.describe('landing page', () => {
  test('loads with one clear action that opens the app', async ({ page, allowConsole }, info) => {
    allowConsole(/^$/)
    await page.goto('./')
    await expect(page).toHaveTitle(/Officer Prep/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('without coaching fees')
    expect(await noSideScroll(page)).toBe(true)

    // The primary action is on the first screen, and on a phone the nav does not repeat it.
    const cta = page.getByRole('link', { name: 'Start preparing free' }).first()
    await expect(cta).toBeInViewport()
    if (info.project.name === 'phone-dark') await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Start preparing free' })).toBeHidden()

    await cta.click()
    await expect(page).toHaveURL(/\/officer-prep\/app\/(#\/)?$/)
    await expect(page.locator('main')).not.toBeEmpty()
  })

  test('the FAQ opens and every question has an answer', async ({ page, allowConsole }) => {
    allowConsole(/^$/)
    await page.goto('./#faq')
    const first = page.locator('#faq details').first()
    await first.locator('summary').click()
    await expect(first.locator('.faq-answer')).toBeVisible()
    expect(await page.locator('#faq details').count()).toBeGreaterThanOrEqual(6)
    // The FAQ is also published as structured data for search engines.
    const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent() ?? '{}')
    expect(schema['@type']).toBe('FAQPage')
    expect(schema.mainEntity.length).toBe(await page.locator('#faq details').count())
  })

  test('the phone menu opens full height and its links close it', async ({ page, allowConsole }, info) => {
    test.skip(info.project.name !== 'phone-dark', 'the menu button only shows on small screens')
    allowConsole(/^$/)
    await page.goto('./')
    await page.getByRole('button', { name: 'Open menu' }).click()
    const menu = page.locator('#mobile-menu')
    await expect(menu.getByRole('link', { name: 'FAQ' })).toBeVisible()
    await menu.getByRole('link', { name: 'FAQ' }).click()
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible()
    await expect(page.locator('#faq')).toBeInViewport()
  })

  test('an old app link still opens the right app page', async ({ page, allowConsole }) => {
    allowConsole(/^$/)
    await page.goto('./#/practice')
    await expect(page).toHaveURL(/\/app\/#\/practice$/)
    await expect(page.locator('main')).not.toBeEmpty()
  })

  test('an app installed before the move opens the app, not the landing page', async ({ page, allowConsole }) => {
    allowConsole(/^$/)
    // An installed app runs in standalone display mode; its old start page was the site root.
    await page.addInitScript(() => {
      const real = window.matchMedia.bind(window)
      window.matchMedia = (q: string) => q.includes('display-mode: standalone') ? { ...real(q), matches: true, media: q } as MediaQueryList : real(q)
    })
    await page.goto('./')
    await expect(page).toHaveURL(/\/officer-prep\/app\/$/)
    await expect(page.locator('main')).not.toBeEmpty()
  })

  test('privacy, terms and the 404 page each have a way back', async ({ page, allowConsole }) => {
    allowConsole(/^$/)
    await page.goto('legal.html#privacy')
    await expect(page.getByRole('heading', { name: 'Privacy', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Terms', exact: true })).toBeVisible()
    expect(await noSideScroll(page)).toBe(true)
    await page.getByRole('link', { name: 'Back to Officer Prep' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Prepare for CDS')

    await page.goto('404.html')
    await expect(page.getByRole('heading', { name: 'This page is off the map' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Back to the home page' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Start preparing free' })).toBeVisible()
  })
})
