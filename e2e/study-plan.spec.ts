import { expect, open, test } from './fixtures'
import { field, isoPlus, section, stat } from './helpers'

// Study guides, the planner and exam targets, and what Today / Progress make of them.
// Reduced motion: see practice.spec.ts.
test.use({ reducedMotion: 'reduce' })

test('study guide status persists, shows on the study path, and "Practise" opens a topic test', async ({ page, allowConsole }) => {
  allowConsole(/Failed to load resource/)
  await open(page, 'study/math-percent')
  await expect(page.getByRole('heading', { level: 1, name: 'Percentage' })).toBeVisible()
  const status = page.getByRole('radiogroup', { name: 'Status' })
  await expect(status.getByRole('radio', { name: 'Not started' })).toHaveAttribute('aria-checked', 'true')
  await status.getByRole('radio', { name: 'Learning' }).click()
  await expect(status.getByRole('radio', { name: 'Learning' })).toHaveAttribute('aria-checked', 'true')
  await expect(status.getByRole('radio', { name: 'Not started' })).toHaveAttribute('aria-checked', 'false')

  await page.reload()
  await expect(page.getByRole('radiogroup', { name: 'Status' }).getByRole('radio', { name: 'Learning' })).toHaveAttribute('aria-checked', 'true')

  await page.getByRole('link', { name: '← Study path' }).click()
  await expect(page).toHaveURL(/#\/study$/)
  const row = page.getByRole('listitem').filter({ has: page.getByRole('link', { name: /^Percentage/ }) })
  await expect(row.getByRole('button', { name: 'Learning' })).toBeVisible()
  // Clicking the pill on the path moves it on to Revised, and the guide page agrees.
  await row.getByRole('button', { name: 'Learning' }).click()
  await expect(row.getByRole('button', { name: 'Revised' })).toBeVisible()
  await row.getByRole('link', { name: /^Percentage/ }).click()
  await expect(page.getByRole('radiogroup', { name: 'Status' }).getByRole('radio', { name: 'Revised' })).toHaveAttribute('aria-checked', 'true')

  await page.getByRole('button', { name: 'Practise Percentage' }).click()
  await expect(page).toHaveURL(/#\/practice$/)
  const card = section(page, 'Topic test')
  await expect(card).toBeVisible()
  await expect(page.getByRole('button', { name: /^Topic test/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(field(card, 'Subject')).toHaveValue('Mathematics')
  await expect(field(card, 'Topic')).toHaveValue('Percentage')
  await card.getByRole('button', { name: /^Start \d+-question test$/ }).click()
  await expect(page.getByText(/^Question 1 of \d+ · Mathematics · Percentage/)).toBeVisible()
  await expect(page.getByText(/^Topic test · \w+ · Percentage$/)).toBeVisible()
})

test('planner: add a task, tick it off; Today and Progress count the day', async ({ page, allowConsole }) => {
  allowConsole(/Failed to load resource/)
  await open(page, '')
  await expect(stat(page, 'Streak')).toHaveText('0')

  await open(page, 'planner')
  await expect(page.getByText('0/0 done · 0 min planned')).toBeVisible()
  await page.getByPlaceholder('e.g. Trigonometry — 30 questions').fill('Percentage — 30 questions')
  await page.getByPlaceholder('60').fill('45')
  await field(page, 'Exam').selectOption('cds')
  await page.getByRole('button', { name: 'Add', exact: true }).click()

  const task = page.getByRole('listitem').filter({ hasText: 'Percentage — 30 questions' })
  await expect(task).toContainText('CDS')
  await expect(task).toContainText('45m')
  await expect(page.getByText('0/1 done · 45 min planned')).toBeVisible()
  // The box is driven by the database, so it ticks once the write lands: click, then wait for it.
  await task.getByRole('checkbox').click()
  await expect(task.getByRole('checkbox')).toBeChecked()
  await expect(page.getByText('1/1 done · 45 min planned')).toBeVisible()
  await expect(task.getByText('Percentage — 30 questions')).toHaveClass(/line-through/)

  // Another day is empty; back to today.
  await page.getByRole('button', { name: '→', exact: true }).click()
  await expect(page.getByText('0/0 done · 0 min planned')).toBeVisible()
  await page.getByRole('button', { name: 'Today', exact: true }).click()
  await expect(task.getByRole('checkbox')).toBeChecked()

  await page.getByRole('link', { name: 'Today', exact: true }).first().click()
  await expect(page.getByRole('heading', { name: 'Jai Hind.' })).toBeVisible()
  await expect(page.getByText('1 of 1 tasks done today.', { exact: false })).toBeVisible()
  await expect(stat(page, 'Streak')).toHaveText('1')
  await expect(section(page, "Today's tasks").getByRole('checkbox', { checked: true })).toHaveCount(1)

  await open(page, 'progress')
  await expect(stat(page, 'Current streak')).toHaveText('1')
  await expect(stat(page, 'Best streak')).toHaveText('1')
  await expect(stat(page, 'Active days')).toHaveText('1')
  await expect(page.getByText(/1 active day so far/)).toBeVisible()
})

test('exam targets and your own exam date drive the countdown on Today', async ({ page, allowConsole }) => {
  allowConsole(/Failed to load resource/)
  await open(page, '')
  await expect(page.getByText('Pick your target exams to start the countdown.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Choose your exams' }).click()
  await expect(page).toHaveURL(/#\/exams$/)

  const afcat = page.locator('section').filter({ has: page.getByRole('heading', { name: 'AFCAT', exact: true }) })
  await afcat.getByRole('button', { name: 'Add as target' }).click()
  await expect(afcat.getByRole('button', { name: '✓ Target' })).toBeVisible()
  const date = isoPlus(100)
  await field(afcat, 'My exam date (overrides countdown)').fill(date)
  await expect(afcat.getByRole('button', { name: 'Clear' })).toBeVisible()

  const other = section(page, 'Other exams (State PCS, TA, etc.)')
  await field(other, 'Name').fill('Territorial Army 2027')
  await field(other, 'Date').fill(isoPlus(40))
  await other.getByRole('button', { name: 'Add' }).click()
  await expect(other.getByRole('listitem').filter({ hasText: 'Territorial Army 2027' })).toContainText('· 40d')

  await page.reload()
  await expect(afcat.getByRole('button', { name: '✓ Target' })).toBeVisible()
  await expect(field(afcat, 'My exam date (overrides countdown)')).toHaveValue(date)

  await open(page, '')
  // The nearest date leads the hero; both get a countdown.
  await expect(page.getByText('40 days', { exact: true })).toBeVisible()
  await expect(page.getByText('to Territorial Army 2027.', { exact: false })).toBeVisible()
  const countdown = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Countdown' }) })
  await expect(countdown.getByText('AFCAT', { exact: true })).toBeVisible()
  await expect(countdown.getByText(/^100\s*days$/)).toBeVisible()
  await expect(countdown.getByText(/^40\s*days$/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Choose your exams' })).toHaveCount(0)

  // Without the custom exam, AFCAT on your own date leads.
  await open(page, 'exams')
  await other.getByRole('button', { name: 'Remove' }).click()
  await expect(other.getByRole('listitem')).toHaveCount(0)
  await open(page, '')
  await expect(page.getByText('to AFCAT.', { exact: false })).toBeVisible()
  await expect(page.getByText('100 days', { exact: true })).toBeVisible()

  await open(page, 'study')
  await expect(page.getByRole('button', { name: 'AFCAT', exact: true })).toBeVisible()
  await expect(page.getByText(/^100 days to AFCAT\./)).toBeVisible()
})
