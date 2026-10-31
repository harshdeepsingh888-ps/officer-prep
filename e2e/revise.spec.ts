import { expect, open, test } from './fixtures'
import { acceptDialog, field, idbAll, section, stat } from './helpers'

// Revise: flashcard decks and the review queue, and the mistake notebook.
// Reduced motion: see practice.spec.ts.
test.use({ reducedMotion: 'reduce' })

test('a starter deck fills the review queue; grading a card shrinks it', async ({ page, allowConsole }) => {
  allowConsole(/Failed to load resource/)
  await open(page, 'revise')
  await expect(page.getByRole('button', { name: "Today's review", exact: true })).toBeVisible()
  await expect(page.getByText('Nothing to revise yet.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'add a starter flashcard deck' }).click()
  await expect(page).toHaveURL(/#\/revise\/cards$/)

  const starter = section(page, 'Starter decks')
  const ranks = starter.getByRole('listitem').filter({ hasText: 'Ranks & formations' })
  const size = Number((await ranks.textContent())!.match(/· (\d+) cards/)![1])
  expect(size).toBeGreaterThan(0)
  await ranks.getByRole('button', { name: 'Add deck' }).click()
  await expect(starter.getByText(`Added ${size} cards from Ranks & formations.`)).toBeVisible()
  await expect(ranks.getByText('added', { exact: true })).toBeVisible()
  const mine = section(page, 'My decks')
  await expect(mine.getByText(`${size} cards · 0 due · ${size} new · 0 mastered`)).toBeVisible()

  // New cards join at most 20 a day, and the tab shows how many are due.
  const due = Math.min(size, 20)
  await expect(page.getByRole('button', { name: `Today's review · ${due}` }), 'the tab counts the new cards').toBeVisible()
  await page.getByRole('button', { name: /^Today's review/ }).click()
  await expect(page).toHaveURL(/#\/revise$/)
  await expect(stat(page, 'Due now')).toHaveText(String(due))
  await expect(stat(page, 'Cards in rotation')).toHaveText(String(size))
  await page.getByRole('button', { name: `Start review · ${due} cards` }).click()

  await expect(page.getByText(`Card 1 of ${due}`)).toBeVisible()
  const cards = await idbAll<{ front: string; back: string; createdAt: number }>(page, 'cards')
  const first = cards.sort((a, b) => a.createdAt - b.createdAt)[0]
  await expect(page.getByText(first.front, { exact: true })).toBeVisible()
  await expect(page.getByText(first.back, { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: /^Show answer/ }).click()
  await expect(page.getByText(first.back, { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /^Good\s*1d$/ }).click()

  await expect(page.getByText(`Card 2 of ${due}`)).toBeVisible()
  await expect(page.getByRole('button', { name: `Today's review · ${due - 1}` })).toBeVisible()

  // "Again" sends a card to the back of this session; ending the session shows the tally.
  await page.getByRole('button', { name: /^Show answer/ }).click()
  await page.getByRole('button', { name: /^Again\s*10m$/ }).click()
  await expect(page.getByText(`Card 3 of ${due + 1}`)).toBeVisible()
  await page.getByRole('button', { name: 'End session' }).click()
  await expect(page.getByText('Done for now.')).toBeVisible()
  await expect(page.getByText(/^2 reviews · 1 sent back\./)).toBeVisible()
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(stat(page, 'Reviewed today')).toHaveText('2')

  const reviews = await idbAll<{ grade: number; wasNew: boolean }>(page, 'reviews')
  expect(reviews.map(r => [r.grade, r.wasNew])).toEqual([[2, true], [0, true]])
  await page.reload()
  await expect(page.getByRole('button', { name: `Today's review · ${due - 2}` })).toBeVisible()
})

test('mistake notebook: add a mistake, mark it mastered and active again, then delete it', async ({ page, allowConsole }) => {
  allowConsole(/Failed to load resource/)
  await open(page, 'revise/mistakes')
  await expect(page.getByText('No mistakes yet.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Add a mistake' }).click()

  const form = section(page, 'Add a mistake from anywhere')
  const save = form.getByRole('button', { name: 'Save mistake' })
  await expect(save).toBeDisabled()
  await field(form, 'Subject').selectOption('General Knowledge')
  await field(form, 'Topic').fill('Modern history')
  await field(form, 'Question / what you got wrong').fill('Year of the Battle of Plassey?')
  await field(form, 'Correct answer / key point').fill('1757')
  await field(form, 'Reason').selectOption({ label: 'Misread the question' })
  await field(form, 'Note').fill('Plassey 1757, Buxar 1764')
  await save.click()
  await expect(form).toHaveCount(0)

  const row = page.getByRole('listitem').filter({ hasText: 'Year of the Battle of Plassey?' })
  await expect(section(page, 'Notebook (1)')).toBeVisible()
  await expect(row.getByText('Added by you', { exact: true })).toBeVisible()
  await expect(row).toContainText('General Knowledge · Modern history')
  await expect(row).toContainText('1757')
  await expect(row).toContainText(/next \d+ \w+/)
  await expect(row.getByRole('combobox')).toHaveValue('misread')
  await expect(row.getByPlaceholder('Note to self — the trick, the rule, the trap')).toHaveValue('Plassey 1757, Buxar 1764')
  await expect(stat(page, 'Active')).toHaveText('1')
  await expect(page.getByRole('button', { name: 'Mistake notebook · 1' })).toBeVisible()
  // It also becomes a revision card in the Mistakes deck.
  expect((await idbAll<{ deck: string; front: string; status: string }>(page, 'cards')).map(c => [c.deck, c.front, c.status]))
    .toEqual([['Mistakes', 'Year of the Battle of Plassey?', 'active']])

  await row.getByRole('button', { name: 'Mark mastered' }).click()
  await expect(section(page, 'Notebook (0)')).toBeVisible()
  await expect(stat(page, 'Active')).toHaveText('0')
  await expect(stat(page, 'Mastered')).toHaveText('1')
  await page.getByRole('button', { name: 'mastered', exact: true }).click()
  await expect(section(page, 'Notebook (1)')).toBeVisible()
  await expect(row).toContainText('mastered')
  expect((await idbAll<{ status: string }>(page, 'cards'))[0].status).toBe('suspended')

  await row.getByRole('button', { name: 'Revise again' }).click()
  await expect(section(page, 'Notebook (0)')).toBeVisible()
  await page.getByRole('button', { name: 'active', exact: true }).click()
  await expect(row).toContainText('due now')
  await expect(stat(page, 'Active')).toHaveText('1')
  await expect(stat(page, 'Due today')).toHaveText('1')

  await page.reload()
  await expect(row).toHaveCount(1)
  const dialog = acceptDialog(page)
  await row.getByRole('button', { name: 'Delete' }).click()
  expect(await dialog).toBe('Delete this mistake and its revision card?')
  await expect(row).toHaveCount(0)
  await expect(stat(page, 'Active')).toHaveText('0')
  await expect(page.getByText('No mistakes yet.', { exact: false })).toBeVisible()
  expect(await idbAll(page, 'cards')).toEqual([])
  expect(await idbAll(page, 'mistakes')).toEqual([])
})
