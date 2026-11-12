import type { Page } from '@playwright/test'
import { WAT_WORDS } from '../src/data/ssb'
import { expect, noSideScroll, open, test } from './fixtures'
import { field, section } from './helpers'

// The psych tests' review: the PPDT character box, TAT story checks and set patterns, and WAT sentence checks.
// The tests run on their real timings, so the clock is fast-forwarded through each stage.
test.use({ reducedMotion: 'reduce' })

/** Lets `seconds` pass in 10-second steps, so the page redraws in between as it would for a user. One long jump
 *  fires a stage's countdown many times before React redraws, and can leave the next stage's clock half-run. */
async function pass(page: Page, seconds: number) {
  for (let left = seconds; left > 0; left -= 10) await page.clock.runFor(Math.min(10, left) * 1000)
}

test('PPDT: the character box, read out in order for narration, and checked against the story', async ({ page, allowConsole }) => {
  allowConsole(/Failed to load resource/)
  await page.clock.install()
  await open(page, 'ssb/ppdt')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await pass(page, 31)

  // 1 minute: mark two characters, circle the first as hero, write the action.
  await page.getByRole('button', { name: 'Add a character' }).click()
  await page.getByRole('button', { name: 'Add a character' }).click()
  await page.getByRole('radiogroup', { name: 'Character 1 sex' }).getByRole('radio', { name: 'M' }).click()
  await page.getByLabel('Character 1 age').fill('21')
  await page.getByRole('radiogroup', { name: 'Character 1 mood' }).getByRole('radio', { name: 'positive' }).click()
  await page.getByRole('radiogroup', { name: 'Character 2 sex' }).getByRole('radio', { name: 'F' }).click()
  await page.getByLabel('Character 2 age').fill('20-25')
  await page.getByRole('radiogroup', { name: 'Character 2 mood' }).getByRole('radio', { name: 'neutral' }).click()
  await page.getByRole('button', { name: 'Character 1', exact: true }).click() // tapping a mark circles the hero
  await expect(page.getByRole('button', { name: 'Character 1, your hero' })).toBeVisible()
  await expect(page.getByRole('radio', { name: 'Hero' }).first()).toBeChecked()
  await page.getByLabel('Action, in one line').fill('Two friends at a flooded road')
  expect(await noSideScroll(page)).toBe(true)
  await pass(page, 61)

  // 4 minutes: a story that is mostly about a "she", though the hero is marked male.
  const story = 'She saw the water rising over the road. She asked her friend to call the panchayat office while she guided the cars back.'
  await page.getByRole('textbox').fill(story)
  await expect(page.getByText(/^\d+ words · aim 80–150$/)).toBeVisible()
  await pass(page, 241)

  const order = page.getByRole('list', { name: 'Narrate in this order' }).getByRole('listitem')
  await expect(order).toHaveText(['1. 2 characters', '2. Sex: M, F', '3. Age: 21, 20-25', '4. Mood: +, 0', '5. Hero: character 1', '6. Action: Two friends at a flooded road', '7. Then the story, in brief'])
  await page.getByRole('button', { name: 'Finish' }).click()

  const review = section(page, 'PPDT — review')
  await expect(review.getByText('2 characters · Sex: M, F · Age: 21, 20-25 · Mood: +, 0 · Hero: character 1')).toBeVisible()
  await expect(review.getByText('Give one exact age (21), not a range (20–25).')).toBeVisible()
  await expect(review.getByText('Your hero is marked male, but the story is mostly about a "she".')).toBeVisible()
  await expect(review.getByText(/too thin to show who the hero is/)).toBeVisible()
  await section(page, 'Self-assessment').getByRole('button', { name: 'Save set' }).click()

  await open(page, 'ssb/responses')
  await page.getByRole('button', { name: /PPDT.*4\/4 done/ }).click()
  await expect(page.getByText('Give one exact age (21), not a range (20–25).')).toBeVisible()
})

test('TAT: per-story checks and self-review, patterns across the set, and blank-slide ideas from the PIQ', async ({ page, allowConsole }) => {
  test.slow() // four pictures on their real timings, stepped through 10 seconds at a time
  allowConsole(/Failed to load resource/)
  await open(page, 'ssb/interview')
  const piq = section(page, 'Your PIQ / DAF details')
  await field(piq, 'Hobbies (comma-separated)').fill('sketching')
  await field(piq, 'Sports (comma-separated)').fill('football')
  await piq.getByRole('button', { name: 'Save & generate' }).click()
  await expect(page.getByRole('heading', { name: /Likely questions \(\d+\)/ })).toBeVisible()

  await page.clock.install()
  await open(page, 'ssb/tat')
  await page.getByRole('button', { name: '4 pictures' }).click()
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  const stories = [
    'Rohit, a college student, saw the bridge was damaged. He organised the villagers to build a bamboo walkway, which won the district award.',
    'Rohit, a college student, trained his juniors for the inter-college meet and they won first prize. He felt content.',
    'Rohit, a college student, prepared his team for the quiz and they won. He felt content.',
  ]
  for (const s of stories) {
    await pass(page, 31)
    await page.getByRole('textbox').fill(s)
    await pass(page, 241)
  }
  // The blank slide suggests your own story from the PIQ.
  await expect(page.getByText('Blank slide: your own story')).toBeVisible()
  await expect(page.getByText('sketching · football')).toBeVisible()
  await pass(page, 31)
  await page.getByRole('textbox').fill('Last winter I sketched the old fort for our college magazine.')
  await pass(page, 241)

  const review = section(page, 'TAT — review')
  await expect(review.getByText(/^Ends in an award or applause/)).toHaveCount(2) // the award, and the first prize
  const across = review.getByText('Across the set').locator('..')
  await expect(across.getByText('Rohit is the hero of 3 stories.', { exact: false })).toBeVisible()
  await expect(across.getByText('The hero wins in 3 stories.', { exact: false })).toBeVisible()
  await expect(across.getByText('2 stories end on a stock line.', { exact: false })).toBeVisible()
  expect(await noSideScroll(page)).toBe(true)

  // Your own check of the first story against its picture.
  const first = review.getByRole('group', { name: 'Check this story against the picture' }).first()
  await first.getByLabel('The scene in the picture comes in the first two or three lines').check()
  await first.getByLabel("The picture's problem").selectOption({ label: 'Added a problem the picture does not show' })
  await expect(first.getByText(/A crisis the picture does not show/)).toBeVisible()
  await expect(review.getByRole('group', { name: 'Check this story against the picture' })).toHaveCount(3) // not for the blank slide
  await section(page, 'Self-assessment').getByRole('button', { name: 'Save set' }).click()
  await expect(page.getByText('Saved ✓')).toBeVisible()

  await open(page, 'ssb/responses')
  await page.getByRole('button', { name: /TAT.*4\/4 done/ }).click()
  await expect(page.getByText('Your check: 1/5 · Added a problem the picture does not show')).toBeVisible()
})

test('WAT: sentence checks, blanks across the set, and a sentence repeated word for word from an earlier set', async ({ page, allowConsole }) => {
  allowConsole(/Failed to load resource/)
  await open(page, 'ssb')
  // An earlier set with a sentence for every word.
  await page.evaluate(words => new Promise<void>((resolve, reject) => {
    const req = indexedDB.open('officer-prep')
    req.onsuccess = () => {
      const tx = req.result.transaction('ssb', 'readwrite')
      tx.objectStore('ssb').add({ test: 'WAT', at: Date.now() - 86_400_000, olqs: [], items: words.map(w => ({ prompt: w, response: `${w} matters to people.` })) })
      tx.oncomplete = () => { req.result.close(); resolve() }
      tx.onerror = () => reject(tx.error)
    }
  }), WAT_WORDS)

  await page.clock.install()
  await open(page, 'ssb/wat')
  await page.getByRole('button', { name: '20 words' }).click()
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  const word = page.locator('[aria-live=polite]')
  const first = (await word.textContent())!
  await page.getByPlaceholder('Your sentence…').fill(`${first} matters to people.`) // the same as last time
  await page.clock.runFor(15_000)
  await expect(page.getByText('Word 2 of 20')).toBeVisible()
  await page.getByPlaceholder('Your sentence…').fill('One should always help.')
  await page.clock.runFor(15_000)
  await expect(page.getByText('Word 3 of 20')).toBeVisible()
  for (let k = 3; k <= 20; k++) await page.clock.runFor(15_000) // the rest left blank

  const review = section(page, 'WAT — review')
  await expect(review.getByText(/^Word for word what you wrote for this word before/)).toBeVisible()
  await expect(review.getByText(/^Advice to others/)).toBeVisible()
  await expect(review.getByText('18 words left blank.', { exact: false })).toBeVisible()
  expect(await noSideScroll(page)).toBe(true)
})
