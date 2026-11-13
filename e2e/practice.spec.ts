import { expect, noSideScroll, open, test } from './fixtures'
import { acceptDialog, field, option, savedRun, section, setting, stat } from './helpers'

// Practice → Tests: Quick 10, resuming a test, a full mock and a generated topic test.
// Reduced motion stops the animated particle canvases, which otherwise starve several headless Chromes running
// side by side (software rendering) and make every step crawl; the flows under test don't depend on them.
test.use({ reducedMotion: 'reduce' })

test.describe('Practice tests', () => {
  test('Quick 10: answer every question, submit, score, and the wrong one lands in the mistake notebook', async ({ page, allowConsole }) => {
    allowConsole(/Failed to load resource/)
    await open(page, 'practice')
    await page.getByLabel('Practising for').selectOption('afcat')
    await expect(page.getByText('Marking: +3 correct, −1 wrong')).toBeVisible()
    await page.getByRole('button', { name: /^Quick 10/ }).click()

    await expect(page.getByText(/^Question 1 of 10 ·/)).toBeVisible()
    const run = await savedRun(page, /^Quick 10 · AFCAT$/)
    expect(run.qs).toHaveLength(10)
    expect(run.deadline).not.toBeNull()
    expect(await noSideScroll(page)).toBe(true)

    // Q1 wrong on purpose, the rest right: 9 × 3 − 1 = 26 of 30.
    for (const [i, q] of run.qs.entries()) {
      await expect(page.getByText(new RegExp(`^Question ${i + 1} of 10 ·`))).toBeVisible()
      const pick = i === 0 ? (q.answer + 1) % q.options.length : q.answer
      await option(page, pick, q.options[pick]).click()
      await expect(page.getByText(new RegExp(`^${i + 1} answered`))).toBeVisible()
      if (i < 9) await page.getByRole('button', { name: 'Next →' }).click()
    }
    await expect(page.getByRole('button', { name: 'Next →' })).toBeDisabled()

    const dialog = acceptDialog(page)
    await page.getByRole('button', { name: 'Submit' }).click()
    expect(await dialog).toBe('Submit now?')

    await expect(page.getByText('Quick 10 · AFCAT', { exact: true })).toBeVisible()
    await expect(stat(page, 'Score')).toHaveText('26 / 30')
    await expect(stat(page, 'Accuracy')).toHaveText('90%')
    await expect(stat(page, 'Right · Wrong · Skipped')).toHaveText('9 · 1 · 0')
    await expect(page.getByText(/1 wrong answer saved to your/)).toBeVisible()
    expect(await noSideScroll(page)).toBe(true)
    expect(await setting(page, 'quizRun')).toBeUndefined()

    await page.getByRole('link', { name: 'mistake notebook' }).click()
    await expect(page).toHaveURL(/#\/revise\/mistakes$/)
    await expect(page.getByRole('button', { name: 'Mistake notebook · 1' })).toBeVisible()
    await expect(stat(page, 'Active')).toHaveText('1')
    const wrong = run.qs[0]
    const row = page.getByRole('listitem').filter({ hasText: `Answer: ${'ABCD'[wrong.answer]}. ${wrong.options[wrong.answer]}` })
    await expect(row).toHaveCount(1)
    await expect(row.getByText('Quiz', { exact: true })).toBeVisible()
    await expect(row).toContainText(wrong.text.split('\n')[0].trim())
    const mine = (wrong.answer + 1) % wrong.options.length
    await expect(row).toContainText(`You: ${'ABCD'[mine]}. ${wrong.options[mine]}`)
  })

  test('an unfinished test resumes after a reload with its answers and position', async ({ page, allowConsole }) => {
    allowConsole(/Failed to load resource/)
    await open(page, 'practice')
    await page.getByRole('button', { name: /^Topic test/ }).click()
    const card = section(page, 'Topic test')
    await expect(card.getByRole('button', { name: 'Start 20-question test' })).toBeEnabled()
    await card.getByRole('button', { name: 'Start 20-question test' }).click()

    const run = await savedRun(page, /^Topic test · CDS · Mixed$/)
    await option(page, 0, run.qs[0].options[0]).click()
    await page.getByRole('button', { name: 'Next →' }).click()
    await expect(page.getByText(/^Question 2 of 20 ·/)).toBeVisible()
    await option(page, 1, run.qs[1].options[1]).click()
    await page.getByRole('button', { name: 'Next →' }).click()
    await expect(page.getByText(/^Question 3 of 20 ·/)).toBeVisible()
    await expect(page.getByText(/^2 answered/)).toBeVisible()
    await expect.poll(async () => {
      const r = await savedRun(page)
      return [r.answers[0], r.answers[1], r.answers[2], r.idx]
    }).toEqual([0, 1, null, 2])

    await page.reload()
    const banner = page.getByText('Unfinished test · Topic test · CDS · Mixed')
    await expect(banner).toBeVisible()
    await expect(page.getByText(/^2\/20 answered · \d+:\d\d left/)).toBeVisible()
    await page.getByRole('button', { name: 'Resume' }).click()

    await expect(page.getByText(/^Question 3 of 20 ·/)).toBeVisible()
    await expect(page.getByText(/^2 answered/)).toBeVisible()
    await expect(page.getByText(run.qs[2].text.split('\n')[0].trim()).first()).toBeVisible()
    // The palette fills in answered questions.
    const answered = /(^|\s)bg-accent-500(\s|$)/
    await expect(page.getByRole('button', { name: 'Question 1', exact: true })).toHaveClass(answered)
    await expect(page.getByRole('button', { name: 'Question 2', exact: true })).toHaveClass(answered)
    await expect(page.getByRole('button', { name: 'Question 3', exact: true })).not.toHaveClass(answered)

    await page.getByRole('button', { name: '← Prev' }).click()
    await expect(page.getByText(/^Question 2 of 20 ·/)).toBeVisible()
    await expect(option(page, 1, run.qs[1].options[1])).toHaveClass(/ring-accent-500/)
    await expect(option(page, 0, run.qs[1].options[0])).not.toHaveClass(/ring-accent-500/)
  })

  test('AFCAT full mock: 100 questions, timer, next / previous, mark for review, submit early', async ({ page, allowConsole }) => {
    allowConsole(/Failed to load resource/)
    await open(page, 'practice')
    await page.getByLabel('Practising for').selectOption('afcat')
    await page.getByRole('button', { name: /^Full mock/ }).click()
    const card = section(page, 'Full mock')
    await expect(card.getByText('AFCAT: 100 questions in 120 minutes, 300 marks.')).toBeVisible()
    await card.getByRole('button', { name: 'Start mock · 100 questions · 120 min' }).click()

    await expect(page.getByText(/^Question 1 of 100 ·/)).toBeVisible()
    const run = await savedRun(page, /^Mock · AFCAT$/)
    expect(run.qs).toHaveLength(100)
    const subjects = run.qs.reduce<Record<string, number>>((m, q) => ({ ...m, [q.subject]: (m[q.subject] ?? 0) + 1 }), {})
    expect(subjects).toEqual({ 'General Knowledge': 25, English: 25, Mathematics: 20, Reasoning: 30 })

    // The clock shows and counts down from 2 hours.
    const clock = page.getByText(/^1(19|20):\d\d$/)
    await expect(clock).toBeVisible()
    const first = await clock.textContent()
    await expect.poll(() => clock.textContent(), { timeout: 5_000 }).not.toBe(first)

    // Q1 right, Q2 wrong: 3 − 1 = 2.
    await option(page, run.qs[0].answer, run.qs[0].options[run.qs[0].answer]).click()
    await page.getByRole('button', { name: 'Next →' }).click()
    await expect(page.getByText(/^Question 2 of 100 ·/)).toBeVisible()
    const w = (run.qs[1].answer + 1) % run.qs[1].options.length
    await option(page, w, run.qs[1].options[w]).click()
    await page.getByRole('button', { name: '← Prev' }).click()
    await expect(page.getByText(/^Question 1 of 100 ·/)).toBeVisible()
    await expect(page.getByRole('button', { name: '← Prev' })).toBeDisabled()
    await page.getByRole('button', { name: 'Question 3', exact: true }).click()
    await expect(page.getByText(/^Question 3 of 100 ·/)).toBeVisible()
    await page.getByRole('button', { name: '☆ Mark for review' }).click()
    await expect(page.getByRole('button', { name: '★ Marked' })).toBeVisible()
    await expect(page.getByText('2 answered · 1 marked')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Question 3', exact: true })).toHaveClass(/ring-saffron-400/)

    const dialog = acceptDialog(page)
    await page.getByRole('button', { name: 'Submit' }).click()
    expect(await dialog).toBe('Submit now? 98 unanswered. 1 marked for review.')

    await expect(page.getByText('Mock · AFCAT', { exact: true })).toBeVisible()
    await expect(stat(page, 'Score')).toHaveText('2 / 300')
    await expect(stat(page, 'Right · Wrong · Skipped')).toHaveText('1 · 1 · 98')
    await expect(stat(page, 'Accuracy')).toHaveText('50%')

    const review = section(page, 'Review')
    await review.getByRole('button', { name: 'marked' }).click()
    await expect(review.locator('ol > li')).toHaveCount(1)
    await expect(review.locator('ol > li').getByText('marked', { exact: true })).toBeVisible()
    await review.getByRole('button', { name: 'wrong' }).click()
    await expect(review.locator('ol > li')).toHaveCount(1)
    await expect(review.locator('ol > li')).toContainText(run.qs[1].text.split('\n')[0].trim())
  })

  test('topic test from "Generated only" Mathematics has only fresh Maths questions', async ({ page, allowConsole }) => {
    allowConsole(/Failed to load resource/)
    await open(page, 'practice')
    await page.getByRole('button', { name: /^Topic test/ }).click()
    const card = section(page, 'Topic test')
    await field(card, 'Questions from').selectOption('generated')
    await field(card, 'Subject').selectOption('Mathematics')
    await expect(card.getByText(/Every question is generated fresh, with new numbers each time\./)).toBeVisible()
    await expect(field(card, 'Subject').locator('option')).toHaveText(['All', 'Mathematics', 'Reasoning'])
    await field(card, 'Questions').selectOption('10')
    await card.getByRole('button', { name: 'Start 10-question test' }).click()

    await expect(page.getByText(/^Question 1 of 10 · Mathematics ·/)).toBeVisible()
    const run = await savedRun(page, /^Topic test · CDS · Mathematics · generated$/)
    expect(run.qs).toHaveLength(10)
    expect(run.qs.every(q => q.subject === 'Mathematics')).toBe(true)
    expect(new Set(run.qs.map(q => q.id)).size).toBe(10)

    const dialog = acceptDialog(page)
    await page.getByRole('button', { name: 'Submit' }).click()
    expect(await dialog).toBe('Submit now? 10 unanswered.')
    await expect(stat(page, 'Right · Wrong · Skipped')).toHaveText('0 · 0 · 10')
    await expect(stat(page, 'Score')).toHaveText('0 / 10')
    await page.getByRole('button', { name: 'Back to tests' }).click()
    await expect(page.getByRole('button', { name: /^Quick 10/ })).toBeVisible()
    await expect(page.getByText(/^Unfinished test/)).toHaveCount(0)
  })
})
