import { expect, open, test } from './fixtures'
import { idbAll, section } from './helpers'

// Current affairs: notes, the weekly recap and the headlines (which a local build may or may not have).
// Reduced motion: see practice.spec.ts.
test.use({ reducedMotion: 'reduce' })

test('write a note (with a revision card); it is listed, searchable, and in the weekly recap', async ({ page, allowConsole }) => {
  allowConsole(/news\/latest\.json|Failed to load resource/)
  await open(page, 'news/notes')
  await expect(page.getByText('No notes yet.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: '+ New note' }).click()

  await expect(page.getByRole('heading', { name: 'New note' })).toBeVisible()
  const save = page.getByRole('button', { name: 'Save note' })
  await expect(save).toBeDisabled()
  await page.getByLabel('Category').selectOption({ label: 'Defence' })
  await page.getByLabel('Headline').fill('INS Vikrant joins a carrier group exercise')
  await page.getByLabel('Key points').fill('First indigenous carrier; commissioned 2022 at Kochi.')
  await page.getByLabel(/Also make a revision card/).check()
  await expect(save).toBeDisabled() // a card needs both sides
  await page.getByLabel('Question', { exact: true }).fill('India’s first indigenous aircraft carrier?')
  await page.getByLabel('Answer', { exact: true }).fill('INS Vikrant')
  await save.click()

  await expect(page.getByRole('heading', { name: 'New note' })).toHaveCount(0)
  const note = page.getByRole('listitem').filter({ hasText: 'INS Vikrant joins a carrier group exercise' })
  await expect(note).toContainText('First indigenous carrier; commissioned 2022 at Kochi.')
  await expect(note.getByText('Defence', { exact: true })).toBeVisible()
  await expect(note.getByText('card', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'My notes · 1' })).toBeVisible()
  expect((await idbAll<{ deck: string; back: string }>(page, 'cards')).map(c => [c.deck, c.back])).toEqual([['Current affairs', 'INS Vikrant']])

  // Search and category filters
  await page.getByLabel('Search notes').fill('kochi carrier')
  await expect(note).toBeVisible()
  await page.getByLabel('Search notes').fill('budget')
  await expect(page.getByText('No notes match.')).toBeVisible()
  await page.getByLabel('Search notes').fill('')
  await expect(note).toBeVisible()
  await page.getByRole('button', { name: 'Sports', exact: true }).click()
  await expect(page.getByText('No notes match.')).toBeVisible()
  await expect(note).toHaveCount(0)
  await page.getByRole('button', { name: 'Defence', exact: true }).click()
  await expect(note).toBeVisible()
  await page.getByRole('button', { name: 'All', exact: true }).click()
  await expect(note).toBeVisible()

  await page.getByRole('button', { name: 'Weekly recap' }).click()
  await expect(page).toHaveURL(/#\/news\/recap$/)
  await expect(page.getByRole('button', { name: 'This week' })).toHaveAttribute('aria-pressed', 'true')
  const defence = section(page, 'Defence · 1')
  await expect(defence.getByText('INS Vikrant joins a carrier group exercise')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Copy recap' })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Revise cards · 1' })).toBeEnabled()
  await page.getByRole('button', { name: 'Last week' }).click()
  await expect(page.getByText(/^No notes for the week of/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Copy recap' })).toBeDisabled()

  await page.reload()
  await expect(section(page, 'Defence · 1')).toBeVisible()
})

test('headlines: note one if the feed has any, otherwise the page says they are unavailable', async ({ page, allowConsole }) => {
  allowConsole(/news\/latest\.json|Failed to load resource/)
  await open(page, 'news')
  await expect(page.getByText('Loading headlines…')).toHaveCount(0)
  await expect(section(page, 'Official sources')).toBeVisible()

  const add = page.getByRole('button', { name: '+ Note' })
  if (await add.count() === 0) {
    await expect(page.getByText('Headlines aren’t available right now.', { exact: false })).toBeVisible()
    return
  }
  await expect(page.getByText(/^Updated .* · from /)).toBeVisible()
  const item = page.getByRole('listitem').filter({ has: add }).first()
  const title = (await item.getByRole('link').textContent())!.replace(/\s*↗\s*$/, '').trim()
  await item.getByRole('button', { name: '+ Note' }).click()

  await expect(page.getByRole('heading', { name: 'Note this headline' })).toBeVisible()
  await expect(page.getByLabel('Headline')).toHaveValue(title)
  await expect(page.getByLabel('Link (optional)')).toHaveValue(/^https?:\/\//)
  await page.getByLabel('Key points').fill('Worth remembering for the exam.')
  await page.getByRole('button', { name: 'Save note' }).click()
  await expect(page.getByRole('heading', { name: 'Note this headline' })).toHaveCount(0)
  await expect(page.getByRole('listitem').filter({ hasText: title }).first().getByText('noted', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'My notes · 1' })).toBeVisible()

  await page.getByRole('button', { name: 'My notes · 1' }).click()
  await expect(page.getByRole('listitem').filter({ hasText: title })).toContainText('Worth remembering for the exam.')
})

test.describe('west of UTC', () => {
  test.use({ timezoneId: 'America/Los_Angeles' })

  test('recap: "This month" names the current local month on the 1st', async ({ page, allowConsole }) => {
    allowConsole(/news\/latest\.json|Failed to load resource/)
    // 1 December, 9 am in California: still 1 December locally.
    await page.clock.setFixedTime(new Date('2026-12-01T09:00:00-08:00'))
    await open(page, 'news/recap')
    await page.getByRole('button', { name: 'This month' }).click()
    // Regression: the label once parsed "2026-12-01" as UTC midnight, which is still 30 November here.
    await expect(page.getByText('No notes for December 2026.', { exact: false })).toBeVisible()
  })
})
