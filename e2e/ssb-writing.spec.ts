import { expect, noSideScroll, open, test } from './fixtures'
import { field, section } from './helpers'

// SSB psych tests and interview prep, and timed writing.
// Reduced motion: see practice.spec.ts.
test.use({ reducedMotion: 'reduce' })

test('SRT: answer a situation, finish early, self-assess, save; the set appears under My responses', async ({ page, allowConsole }) => {
  allowConsole(/Failed to load resource/)
  await open(page, 'ssb')
  await page.getByRole('link', { name: /SRT/ }).click()
  await expect(page).toHaveURL(/#\/ssb\/srt$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Situation Reaction Test' })).toBeVisible()
  await page.getByRole('button', { name: '15 situations' }).click()
  await page.getByRole('button', { name: 'Start', exact: true }).click()

  await expect(page.getByText('0/15 answered')).toBeVisible()
  await expect(page.getByText(/^7:[0-5]\d$|^7:30$/)).toBeVisible() // 15 × 30 s
  const boxes = page.getByRole('textbox')
  await expect(boxes).toHaveCount(15)
  const situation = (await page.locator('ol > li').first().locator('div').first().textContent())!.replace(/^1\.\s*/, '')
  const answer = 'Inform the seniors, organise help on the spot and follow up until it is resolved.'
  await boxes.first().fill(answer)
  await expect(page.getByText('1/15 answered')).toBeVisible()
  expect(await noSideScroll(page)).toBe(true)
  await page.getByRole('button', { name: 'Finish early' }).click()

  const review = section(page, 'SRT — review')
  await expect(review.getByText('1/15 completed')).toBeVisible()
  await expect(review.getByText(answer)).toBeVisible()
  await expect(review.getByText('not attempted')).toHaveCount(14)
  const assess = section(page, 'Self-assessment')
  await assess.getByLabel('Initiative').check()
  await assess.getByLabel('Speed of Decision').check()
  await assess.getByPlaceholder(/Notes to yourself/).fill('Too few attempted: practise speed.')
  await assess.getByRole('button', { name: 'Save set' }).click()
  await expect(assess.getByText('Saved ✓')).toBeVisible()

  await open(page, 'ssb/responses')
  await expect(page.getByRole('button', { name: /^SRT\s*1$/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /^WAT\s*0$/ })).toBeVisible()
  const set = page.getByRole('button', { name: /SRT.*1\/15 done · 2 OLQs/ })
  await expect(set).toBeVisible()
  await set.click()
  await expect(page.getByText(answer)).toBeVisible()
  await expect(page.getByText(situation.trim())).toBeVisible()
  await expect(page.getByText('📝 Too few attempted: practise speed.')).toBeVisible()

  await open(page, 'ssb/olq')
  const social = section(page, 'Social effectiveness')
  await expect(social.getByText('Initiative').locator('xpath=following-sibling::span[1]')).toHaveText('1')
  await expect(social.getByText('Liveliness').locator('xpath=following-sibling::span[1]')).toHaveText('0')
})

test('interview: PIQ details add tailored questions and are kept', async ({ page, allowConsole }) => {
  allowConsole(/Failed to load resource/)
  await open(page, 'ssb/interview')
  await expect(page.getByRole('heading', { name: 'Likely questions (8)' })).toBeVisible()
  const piq = section(page, 'Your PIQ / DAF details')
  const save = piq.getByRole('button', { name: 'Save & generate' })
  await expect(save).toBeDisabled()
  await piq.getByPlaceholder('e.g. Ludhiana').fill('Ludhiana')
  await piq.getByPlaceholder('e.g. Punjab').fill('Punjab')
  await field(piq, 'Sports (comma-separated)').fill('football, athletics')
  await field(piq, 'Entry / service applied for').fill('CDS – IMA')
  await expect(page.getByRole('heading', { name: 'Likely questions (8)' })).toBeVisible() // only after saving
  await save.click()

  await expect(page.getByRole('heading', { name: 'Likely questions (16)' })).toBeVisible()
  await expect(page.getByText('What is Ludhiana known for?')).toBeVisible()
  await expect(page.getByText('Who is the Chief Minister and Governor of Punjab?')).toBeVisible()
  await expect(page.getByText(/^Explain the rules of athletics\./)).toBeVisible()
  await expect(page.getByText('Why CDS – IMA? What will you do if you are not selected?')).toBeVisible()
  await expect(save).toBeDisabled()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Likely questions (16)' })).toBeVisible()
  await expect(section(page, 'Your PIQ / DAF details').getByPlaceholder('e.g. Ludhiana')).toHaveValue('Ludhiana')
})

test('writing: a timed essay is saved with its word count and listed under Past writing', async ({ page, allowConsole }) => {
  allowConsole(/Failed to load resource/)
  await open(page, 'writing')
  await expect(section(page, 'Past writing').getByText('No saved pieces yet.')).toBeVisible()
  await page.getByRole('button', { name: 'Précis' }).click()
  await expect(field(page, 'Minutes')).toHaveValue('20')
  await page.getByRole('button', { name: 'Essay', exact: true }).click()
  await expect(field(page, 'Minutes')).toHaveValue('30')
  await field(page, 'Minutes').fill('5')
  const topic = 'Women in combat roles in the armed forces'
  await field(page, 'Topic, or paste a passage for précis (leave empty for a random topic)').fill(topic)
  await page.getByRole('button', { name: 'Start writing' }).click()

  await expect(page.getByText(`Essay: ${topic}`)).toBeVisible()
  await expect(page.getByText(/^[45]:\d\d$/)).toBeVisible()
  const text = 'Women have served in the armed forces with distinction. Opening combat roles widens the talent pool and strengthens units.'
  const words = text.split(/\s+/).length
  await page.getByRole('textbox').fill(text)
  await expect(page.getByText(`${words} / ~300 words`)).toBeVisible()
  expect(await noSideScroll(page)).toBe(true)
  await page.getByRole('button', { name: 'Finish' }).click()

  await expect(page.getByText(`Saved — ${words} words.`, { exact: false })).toBeVisible()
  const past = section(page, 'Past writing')
  const entry = past.getByRole('button', { name: new RegExp(`Essay\\s*${topic}\\s*${words} words · 0 min`) })
  await expect(entry).toBeVisible()
  await page.getByRole('button', { name: 'Write another' }).click()
  await expect(page.getByRole('button', { name: 'Start writing' })).toBeVisible()

  await page.reload()
  await entry.click()
  await expect(past.getByText(text)).toBeVisible()
})
