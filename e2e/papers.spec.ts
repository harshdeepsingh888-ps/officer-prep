import { readFile } from 'node:fs/promises'
import { expect, noSideScroll, open, test } from './fixtures'
import { acceptDialog, field, section, stat } from './helpers'

// Practice → PYQ papers (OMR sheet, turning a paper into questions) and Practice → My questions.
// Reduced motion: see practice.spec.ts.
test.use({ reducedMotion: 'reduce' })

const PAPER = 'CDS (II) 2026 — General Knowledge'

test.describe('PYQ papers', () => {
  test('OMR sheet: short timed sheet, submit, paste the key, score, save a wrong answer to the notebook', async ({ page, allowConsole }) => {
    allowConsole(/Failed to load resource/)
    await open(page, 'practice/papers')
    await page.getByRole('listitem').filter({ hasText: PAPER }).getByRole('button', { name: 'OMR sheet' }).click()

    const setup = section(page, PAPER)
    await expect(setup.getByText('+0.83 per correct · −0.28 per wrong')).toBeVisible()
    await field(setup, 'Questions').fill('5')
    await field(setup, 'Minutes').fill('1')
    await setup.getByRole('button', { name: 'Start 1-minute test' }).click()

    await expect(page.getByText('0/5 marked')).toBeVisible()
    await expect(page.getByText(/^(1:00|0:\d\d)$/)).toBeVisible()
    // One bubble row per question: answer A, B, C, D and leave Q5 blank.
    const bubbles = (letter: string) => page.getByRole('button', { name: letter, exact: true })
    await expect(bubbles('A')).toHaveCount(5)
    for (const [i, l] of ['A', 'B', 'C', 'D'].entries()) await bubbles(l).nth(i).click()
    await expect(page.getByText('4/5 marked')).toBeVisible()
    expect(await noSideScroll(page)).toBe(true)
    await bubbles('A').nth(0).click() // tapping a marked bubble clears it …
    await expect(page.getByText('3/5 marked')).toBeVisible()
    await bubbles('A').nth(0).click() // … and again marks it
    await expect(page.getByText('4/5 marked')).toBeVisible()

    const dialog = acceptDialog(page)
    await page.getByRole('button', { name: 'Submit' }).click()
    expect(await dialog).toBe('Submit? 1 unmarked.')

    const key = section(page, 'Score your sheet')
    await expect(key).toBeVisible()
    const score = key.getByRole('button', { name: 'Score', exact: true })
    await key.getByRole('textbox').fill('1-A 2-B')
    await expect(key.getByText('2/5 answers')).toBeVisible()
    await expect(score).toBeDisabled()
    await key.getByRole('textbox').fill('1-A 2-B 3-D 4-A 5-C')
    await expect(key.getByText('5/5 answers')).toBeVisible()
    await score.click()

    // 2 right, 2 wrong, 1 skipped at 100/120 marks a question with a third off: 1.67 − 0.56.
    await expect(stat(page, 'Score')).toHaveText('1.11 / 4.17')
    await expect(stat(page, 'Right · Wrong')).toHaveText('2 · 2')
    await expect(stat(page, 'Skipped · Dropped')).toHaveText('1 · 0')
    const wrong = section(page, 'Wrong answers — revisit these in the paper')
    await expect(wrong.getByRole('button', { name: /^Q\d/ })).toHaveText(['Q3', 'Q4'])

    await wrong.getByRole('button', { name: 'Q3' }).click()
    await expect(wrong.getByText('Q3 · correct answer D')).toBeVisible()
    // A question from the General Knowledge paper should default to that subject.
    await expect(field(wrong, 'Subject'), 'the subject defaults to the paper’s subject').toHaveValue('General Knowledge')
    const subject = await field(wrong, 'Subject').inputValue()
    await field(wrong, 'Topic').fill('Indian polity')
    await field(wrong, 'Why I missed it').selectOption({ label: 'Concept gap' })
    await wrong.getByRole('button', { name: 'Save to notebook' }).click()
    await expect(wrong.getByRole('button', { name: 'Q3 ✓' })).toBeVisible()

    await page.getByRole('button', { name: 'Back to papers' }).click()
    await expect(page.getByText(/^Unfinished OMR/)).toHaveCount(0)
    await open(page, 'revise/mistakes')
    const row = page.getByRole('listitem').filter({ hasText: `${PAPER} · Q3` })
    await expect(row).toHaveCount(1)
    await expect(row.getByText('Past paper', { exact: true })).toBeVisible()
    await expect(row).toContainText(`${subject} · Indian polity`)
    await expect(row).toContainText('Answer: D')
    await expect(row.getByRole('combobox')).toHaveValue('concept')
    await expect(stat(page, 'Most common reason')).toHaveText('Concept gap')
  })

  test('"Make questions" imports a sample paper into the bank, skips the figure question and duplicates, and feeds topic tests', async ({ page, allowConsole }) => {
    allowConsole(/Failed to load resource/)
    await open(page, 'practice/papers')
    await page.getByRole('listitem').filter({ hasText: PAPER }).getByRole('button', { name: 'Make questions' }).click()
    await expect(page).toHaveURL(/#\/practice\/mine\/CDS%20\(II\)%202026-gk$/)

    const card = section(page, 'Import a past paper')
    await expect(field(card, 'Paper')).toHaveValue('CDS (II) 2026-gk')
    await expect(field(card, 'Paper').locator('option:checked')).toHaveText(PAPER)
    await expect(field(card, 'Subject')).toHaveValue('General Knowledge')
    await expect(field(card, 'Topic')).toHaveValue('PYQ · CDS (II) 2026')

    await card.getByRole('button', { name: 'Try a sample' }).click()
    await expect(card.getByText('3 questions found (Q1–Q3)')).toBeVisible()
    await expect(card.getByText('3 answers in the key')).toBeVisible()
    await expect(card.getByText(/1 question has a figure and is left out/)).toBeVisible()
    const rows = card.locator('ul > li')
    await expect(rows).toHaveCount(3)
    await expect(rows.nth(0).getByRole('checkbox')).toBeChecked()
    await expect(rows.nth(1).getByRole('checkbox')).toBeChecked()
    await expect(rows.nth(2).getByRole('checkbox')).not.toBeChecked()
    await expect(rows.nth(2).getByText('figure', { exact: true })).toBeVisible()
    await expect(rows.nth(0)).not.toContainText('आईएनएस') // the Hindi version is dropped

    await card.getByRole('button', { name: 'Add 2 questions' }).click()
    await expect(page.getByText(`Added 2 questions from ${PAPER}.`)).toBeVisible()
    const bank = section(page, 'My bank (2)')
    await expect(bank).toBeVisible()
    await expect(bank.getByRole('listitem')).toHaveCount(2)
    await expect(bank.getByRole('listitem').first()).toContainText(`${PAPER} · Q1`)

    // The same sample again: both questions are already in the bank, so nothing is added twice.
    await card.getByRole('button', { name: 'Try a sample' }).click()
    await expect(rows).toHaveCount(3)
    await expect(card.getByText('already added', { exact: true })).toHaveCount(2)
    for (let i = 0; i < 3; i++) await expect(rows.nth(i).getByRole('checkbox')).not.toBeChecked()
    await expect(card.getByRole('button', { name: /^Add\s+questions$/ })).toBeDisabled()

    await page.getByRole('button', { name: 'Tests', exact: true }).click()
    await page.getByRole('button', { name: /^Topic test/ }).click()
    const topic = section(page, 'Topic test')
    await expect(field(topic, 'Topic').locator('option', { hasText: 'PYQ · CDS (II) 2026' })).toHaveCount(1)
    await field(topic, 'Topic').selectOption('PYQ · CDS (II) 2026')
    await expect(topic.getByText(/^2 questions in the bank match\./)).toBeVisible()
    await expect(topic.getByRole('button', { name: 'Start 2-question test' })).toBeEnabled()
  })
})

test.describe('My questions', () => {
  test('paste, write, bulk-import, delete and export questions', async ({ page, allowConsole }) => {
    allowConsole(/Failed to load resource/)
    await open(page, 'practice/mine')
    await expect(section(page, 'My bank (0)').getByText('No questions yet.')).toBeVisible()

    // Telegram paste
    const paste = section(page, 'Paste from Telegram, PDFs or notes')
    await paste.getByRole('button', { name: 'Try a sample' }).click()
    await expect(paste.getByText('2 questions recognised')).toBeVisible()
    await expect(paste.getByText('Exercise Garuda is conducted between India and which country?', { exact: true })).toBeVisible()
    await field(paste, 'Topic').fill('Defence')
    await paste.getByRole('button', { name: 'Add 2 questions' }).click()
    await expect(page.getByText('Added 2 pasted questions to your bank.')).toBeVisible()
    await expect(section(page, 'My bank (2)')).toBeVisible()
    await expect(page.getByText(/General Knowledge · Defence · Ans B\. France/)).toBeVisible()
    await expect(page.getByText(/General Knowledge · Defence · Ans B\. Gen Bipin Rawat/)).toBeVisible()

    // Write one
    const write = section(page, 'Write a question')
    const add = write.getByRole('button', { name: 'Add question' })
    await expect(add).toBeDisabled()
    await field(write, 'Question').fill('Which is the highest peacetime gallantry award in India?')
    for (const [i, o] of ['Kirti Chakra', 'Ashoka Chakra', 'Shaurya Chakra', 'Param Vir Chakra'].entries())
      await write.getByPlaceholder(`Option ${'ABCD'[i]}`).fill(o)
    await write.getByRole('radio').nth(1).check()
    await field(write, 'Subject').selectOption('General Knowledge')
    await field(write, 'Topic').fill('Awards')
    await field(write, 'Difficulty').selectOption({ label: 'Easy' })
    await add.click()
    await expect(page.getByText('Question added.')).toBeVisible()
    await expect(section(page, 'My bank (3)')).toBeVisible()
    await expect(page.getByText(/General Knowledge · Awards · Ans B\. Ashoka Chakra/)).toBeVisible()
    await expect(field(write, 'Question')).toHaveValue('')

    // CSV bulk import
    const bulk = section(page, 'Bulk import (CSV or JSON)')
    await bulk.getByRole('button', { name: 'Insert sample' }).click()
    await bulk.getByRole('button', { name: 'Import' }).click()
    await expect(page.getByText('Imported 1 question(s).')).toBeVisible()
    const bank = section(page, 'My bank (4)')
    await expect(bank.getByRole('listitem')).toHaveCount(4)
    const malabar = bank.getByRole('listitem').filter({ hasText: 'Exercise Malabar is held between India and —' })
    await expect(malabar).toContainText('Ans B. US, Japan and Australia')

    // Delete it again
    await malabar.getByRole('button', { name: '✕' }).click()
    await expect(section(page, 'My bank (3)').getByRole('listitem')).toHaveCount(3)
    await expect(page.getByText('Exercise Malabar is held between India and —')).toHaveCount(0)

    // Export
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export JSON' }).click()
    const file = await download
    expect(file.suggestedFilename()).toMatch(/^my-questions-\d{4}-\d{2}-\d{2}\.json$/)
    const json = JSON.parse(await readFile(await file.path(), 'utf8')) as { text: string; id?: number; options: string[]; answer: number }[]
    expect(json).toHaveLength(3)
    expect(json.some(q => 'id' in q)).toBe(false)
    expect(json.map(q => q.text)).toContain('Which is the highest peacetime gallantry award in India?')
    const award = json.find(q => q.text.startsWith('Which is the highest'))!
    expect(award.options[award.answer]).toBe('Ashoka Chakra')

    // Survives a reload
    await page.reload()
    await expect(section(page, 'My bank (3)').getByRole('listitem')).toHaveCount(3)
  })
})
