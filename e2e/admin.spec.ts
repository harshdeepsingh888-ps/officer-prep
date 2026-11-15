import { readFileSync } from 'node:fs'
import { expect, open, test } from './fixtures'
import { acceptDialog, section } from './helpers'

// The content admin panel: edits stay a draft on this device, preview shows them in the app, and publishing
// commits them to the repository through GitHub's API (stubbed here, so nothing leaves the machine).
// Reduced motion: see practice.spec.ts.
test.use({ reducedMotion: 'reduce' })

const TEXT = 'Which Article of the Constitution deals with the Comptroller and Auditor General?'

/** Fills the new-question form with a Polity question whose answer is option B. */
async function addPolityQuestion(page: import('@playwright/test').Page) {
  await open(page, 'admin/questions')
  await page.getByRole('button', { name: 'Add question' }).click()
  const form = section(page, 'New question')
  await form.getByRole('combobox', { name: /^Topic/ }).fill('Polity') // a text field with suggestions
  await form.getByRole('textbox', { name: /^Question$/ }).fill(TEXT)
  for (const [i, o] of ['Article 76', 'Article 148', 'Article 280', 'Article 324'].entries()) await form.getByRole('textbox', { name: `Option ${'ABCD'[i]}` }).fill(o)
  await form.getByRole('button', { name: 'Add to draft' }).click()
  await expect(form.getByText("Can't save yet: mark the correct option.")).toBeVisible() // the answer is required
  await form.getByRole('radio', { name: 'Option B is correct' }).check()
  await form.getByRole('button', { name: 'Add to draft' }).click()
  await expect(page.getByText('Question added to the draft.')).toBeVisible()
  await form.getByRole('button', { name: 'Close' }).click()
}

test('a question and a notice: drafted, previewed in the app, kept across a reload', async ({ page, allowConsole }) => {
  allowConsole(/Failed to load resource/)
  await open(page, 'study/gk-polity')
  const before = Number((await page.getByText(/\d+ questions on this topic/).textContent())!.match(/\d+/)![0])

  await open(page, 'admin')
  await expect(page.getByRole('heading', { level: 1, name: 'Content admin' })).toBeVisible()
  await expect(page.getByText('No unpublished changes', { exact: true })).toBeVisible()
  await addPolityQuestion(page)
  const list = section(page, 'Published questions')
  await expect(list.getByText(TEXT)).toBeVisible()
  await expect(list.getByText('not published yet')).toBeVisible()

  await page.getByRole('button', { name: 'Notices & dates' }).click()
  await page.getByRole('button', { name: 'Add notice' }).click()
  await section(page, 'New notice').getByRole('textbox', { name: /^Text/ }).fill('CDS (I) 2027 notification is out.')
  await section(page, 'New notice').getByRole('button', { name: 'Add notice' }).click()
  await expect(page.getByText('2 unpublished changes')).toBeVisible()

  // Not published, so students (and this device, until preview is on) don't see either.
  await open(page, '')
  await expect(page.getByText('CDS (I) 2027 notification is out.')).toHaveCount(0)

  await open(page, 'admin')
  await page.getByLabel('Preview the draft in the app on this device').check()
  await open(page, '')
  await expect(page.getByText('Previewing your unpublished draft.')).toBeVisible()
  await expect(page.getByText('CDS (I) 2027 notification is out.')).toBeVisible()
  await open(page, 'study/gk-polity')
  await expect(page.getByText(`${before + 1} questions on this topic`)).toBeVisible()

  await page.getByRole('button', { name: 'Stop preview' }).click()
  await expect(page.getByText(`${before} questions on this topic`)).toBeVisible()

  await page.reload()
  await open(page, 'admin/publish')
  await expect(page.getByText('2 unpublished changes')).toBeVisible()
  const review = section(page, 'Review & publish')
  await expect(review.getByText('+1 added')).toHaveCount(2)
  await expect(review.getByRole('button', { name: 'Publish to the site' })).toBeDisabled() // not connected yet
})

test('a PPDT picture and WAT words: the picture runs in the test while previewing', async ({ page, allowConsole }) => {
  allowConsole(/Failed to load resource/)
  await open(page, 'admin/pictures')
  await page.getByRole('button', { name: 'PPDT', exact: true }).first().click()
  // A small grey PNG, drawn in the page.
  const png = await page.evaluate(() => {
    const c = document.createElement('canvas')
    c.width = 64; c.height = 48
    c.getContext('2d')!.fillRect(8, 8, 20, 20)
    return c.toDataURL('image/png').split(',')[1]
  })
  await page.locator('input[type=file]').setInputFiles({ name: 'scene.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') })
  await expect(page.getByText('1 picture added for PPDT. Publish to put them on the site.')).toBeVisible()
  const pictures = section(page, 'Pictures')
  await expect(pictures.getByText('not published yet')).toBeVisible()
  await expect(pictures.getByText('64 × 48')).toBeVisible()

  await page.getByRole('button', { name: 'SSB lists' }).click()
  await page.getByRole('textbox', { name: 'WAT words' }).fill('Glacier\nArmy\nglacier')
  await page.getByRole('button', { name: 'Save list' }).click()
  await expect(page.getByText('Saved 1 entry · 1 already built in, left out · 1 repeated, left out.')).toBeVisible()

  await page.getByLabel('Preview the draft in the app on this device').check()
  await open(page, 'ssb/ppdt')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await expect(page.locator('main img')).toBeVisible() // the drafted picture, not a written scene
})

test('publishing: one commit through the GitHub API with the draft\'s files', async ({ page, allowConsole }) => {
  allowConsole(/Failed to load resource/)
  const trees: { path: string; content?: string }[][] = []
  let commitMessage = ''
  await page.route('https://api.github.com/**', async route => {
    const req = route.request()
    const url = new URL(req.url())
    const p = url.pathname
    expect(req.headers().authorization).toBe('Bearer github_pat_test')
    const json = (body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
    if (p === '/user') return json({ login: 'site-owner' })
    if (p === '/repos/site-owner/officer-prep') return json({ permissions: { push: true }, default_branch: 'main', private: false })
    if (p.endsWith('/git/ref/heads/main')) return json({ object: { sha: trees.length ? 'c1' : 'c0' } })
    // The repository's content files as committed (empty until something is published); pictures/ doesn't exist yet.
    if (p.includes('/contents/public/content/') && p.endsWith('.json')) return route.fulfill({ status: 200, contentType: 'text/plain', body: readFileSync(p.slice(p.indexOf('public/content/')), 'utf8') })
    if (p.includes('/contents/')) return json({ message: 'Not Found' }, 404)
    if (p.endsWith('/git/commits/c0')) return json({ tree: { sha: 't0' } })
    if (p.endsWith('/git/trees')) { trees.push(req.postDataJSON().tree); return json({ sha: 't1' }) }
    if (p.endsWith('/git/commits')) { commitMessage = req.postDataJSON().message; return json({ sha: 'c1aaaaaaaaaa' }) }
    if (p.endsWith('/git/refs/heads/main')) return json({ object: { sha: 'c1' } })
    if (p.endsWith('/commits')) return json([])
    if (p.endsWith('/actions/runs')) return json({ message: 'Resource not accessible' }, 403)
    return json({ message: `unexpected ${p}` }, 500)
  })

  await addPolityQuestion(page)
  await open(page, 'admin/publish')
  const connect = section(page, 'Connect to GitHub')
  await connect.getByRole('textbox', { name: 'Owner', exact: true }).fill('site-owner')
  await connect.getByRole('textbox', { name: 'Repository', exact: true }).fill('officer-prep')
  await connect.getByLabel(/^Access token/).fill('github_pat_test')
  await connect.getByRole('button', { name: 'Connect' }).click()
  await expect(page.getByText('Signed in as site-owner')).toBeVisible()

  await page.getByRole('textbox', { name: /commit message/ }).fill('CAG question')
  await page.getByRole('button', { name: 'Publish to the site' }).click()
  await expect(page.getByText(/Published ✓/)).toBeVisible()
  await expect(page.getByText('No unpublished changes', { exact: true })).toBeVisible()

  expect(trees).toHaveLength(1)
  expect(trees[0].map(e => e.path)).toEqual(['public/content/questions.json'])
  const file = JSON.parse(trees[0][0].content!)
  expect(file.questions).toMatchObject([{ subject: 'General Knowledge', topic: 'Polity', text: TEXT, answer: 1, options: ['Article 76', 'Article 148', 'Article 280', 'Article 324'] }])
  expect(commitMessage).toBe('CAG question\n\nPublished from the admin panel.')

  // Discarding is offered only when there is something to discard; signing out forgets the token.
  await expect(page.getByRole('button', { name: 'Discard changes' })).toBeDisabled()
  const dialog = acceptDialog(page) // none expected; keeps a stray confirm from hanging the test
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(section(page, 'Connect to GitHub')).toBeVisible()
  void dialog
})
