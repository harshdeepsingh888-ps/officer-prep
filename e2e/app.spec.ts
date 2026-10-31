import { readFile, writeFile } from 'node:fs/promises'
import { expect, open, test } from './fixtures'
import { acceptDialog, field, section } from './helpers'

// App-wide: backup and restore, theme, the phone menu, the hero's shape picker and Google Drive.

test.describe('with reduced motion', () => {
  // Reduced motion: see practice.spec.ts.
  test.use({ reducedMotion: 'reduce' })

  test('backup: export a file, lose the data, restore it from the file', async ({ page, allowConsole }, testInfo) => {
    allowConsole(/Failed to load resource/)
    await open(page, 'library')
    const links = section(page, 'My links')
    await links.getByPlaceholder('e.g. Polity notes').fill('Laxmikanth summary')
    await links.getByPlaceholder('https://…').fill('https://example.org/polity')
    await field(links, 'Group').fill('Polity')
    await links.getByRole('button', { name: 'Add' }).click()
    const link = links.getByRole('listitem').filter({ hasText: 'Laxmikanth summary' })
    await expect(link).toContainText('Polity')
    await open(page, 'planner')
    await page.getByPlaceholder('e.g. Trigonometry — 30 questions').fill('Backup me')
    await page.getByRole('button', { name: 'Add', exact: true }).click()
    await expect(page.getByRole('listitem').filter({ hasText: 'Backup me' })).toBeVisible()

    await open(page, 'library')
    const device = section(page, 'This device & backups')
    await expect(device.getByText('never', { exact: true })).toBeVisible()
    const download = page.waitForEvent('download')
    await device.getByRole('button', { name: 'Export backup file' }).click()
    const file = await download
    expect(file.suggestedFilename()).toMatch(/^officer-prep-backup-\d{4}-\d{2}-\d{2}\.json$/)
    const path = testInfo.outputPath('backup.json')
    await file.saveAs(path)
    const backup = JSON.parse(await readFile(path, 'utf8'))
    expect(backup.app).toBe('officer-prep')
    expect(backup.data.links).toMatchObject([{ title: 'Laxmikanth summary', url: 'https://example.org/polity', group: 'Polity' }])
    expect(backup.data.tasks).toMatchObject([{ title: 'Backup me', done: false }])
    await expect(device.getByText(/^Backup file downloaded\./)).toBeVisible()
    await expect(device.getByText('never', { exact: true })).toHaveCount(0)

    // Lose the data …
    await link.getByRole('button', { name: 'Remove' }).click()
    await expect(link).toHaveCount(0)
    await open(page, 'planner')
    await page.getByRole('listitem').filter({ hasText: 'Backup me' }).getByRole('button', { name: '✕' }).click()
    await expect(page.getByText('Nothing planned for', { exact: false })).toBeVisible()

    // … and restore it. Declining the confirm changes nothing.
    await open(page, 'library')
    const input = device.locator('input[type=file]')
    page.once('dialog', d => d.dismiss())
    await input.setInputFiles(path)
    await expect(device.getByText('Backup restored.')).toHaveCount(0)
    await expect(link).toHaveCount(0)
    const dialog = acceptDialog(page)
    await input.setInputFiles(path)
    expect(await dialog).toBe('Replace the progress on this device with this backup?')
    await expect(device.getByText('Backup restored.')).toBeVisible()
    await expect(link).toBeVisible()
    await page.reload()
    await expect(link).toContainText('Polity')
    await open(page, 'planner')
    await expect(page.getByRole('listitem').filter({ hasText: 'Backup me' })).toBeVisible()

    // A file that isn't a backup is refused.
    await open(page, 'library')
    const bad = testInfo.outputPath('not-a-backup.json')
    await writeFile(bad, JSON.stringify({ hello: 'world' }))
    const again = acceptDialog(page)
    await input.setInputFiles(bad)
    await again
    await expect(device.getByText('Restore failed: Not an Officer Prep backup file')).toBeVisible()
    await expect(link).toBeVisible()
  })

  test('theme: light and dark stick across a reload; "Match system" follows the device', async ({ page, allowConsole }, testInfo) => {
    allowConsole(/Failed to load resource/)
    const system = testInfo.project.name === 'phone-dark' ? 'dark' : 'light'
    await open(page, '')
    const html = page.locator('html')
    const theme = page.getByRole('radiogroup', { name: 'Theme' })
    await expect(theme.getByRole('radio', { name: 'Match system' })).toHaveAttribute('aria-checked', 'true')
    await expect(html).toHaveAttribute('data-theme', system)

    for (const [label, value] of [['Light', 'light'], ['Dark', 'dark']] as const) {
      await theme.getByRole('radio', { name: label }).click()
      await expect(html).toHaveAttribute('data-theme', value)
      await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', value === 'light' ? '#ffffff' : '#000000')
      await page.reload()
      await expect(html).toHaveAttribute('data-theme', value)
      await expect(theme.getByRole('radio', { name: label })).toHaveAttribute('aria-checked', 'true')
      expect(await page.evaluate(() => localStorage.getItem('officer-prep-theme'))).toBe(value)
    }

    await theme.getByRole('radio', { name: 'Match system' }).click()
    await expect(html).toHaveAttribute('data-theme', system)
    expect(await page.evaluate(() => localStorage.getItem('officer-prep-theme'))).toBeNull()
    await page.emulateMedia({ colorScheme: system === 'dark' ? 'light' : 'dark' })
    await expect(html).toHaveAttribute('data-theme', system === 'dark' ? 'light' : 'dark')
    await page.reload()
    await expect(html).toHaveAttribute('data-theme', system === 'dark' ? 'light' : 'dark')
  })

  test('phone: "More" opens the menu of other pages, navigates, and Escape closes it', async ({ page, allowConsole }, testInfo) => {
    test.skip(testInfo.project.name !== 'phone-dark', 'the bottom bar is for phones')
    allowConsole(/Failed to load resource/)
    await open(page, '')
    const bar = page.getByRole('navigation', { name: 'Main' })
    const more = bar.getByRole('button', { name: 'More' })
    await expect(bar.getByRole('link')).toHaveText(['Today', 'Study', 'Practice', 'Revise'])
    await expect(more).toHaveAttribute('aria-expanded', 'false')
    await more.click()
    await expect(more).toHaveAttribute('aria-expanded', 'true')
    const menu = page.locator('#more-pages')
    await expect(menu.getByRole('link')).toHaveText(['Exams', 'Planner', 'Progress', 'News', 'SSB', 'Writing', 'Documents', 'Library'])
    await menu.getByRole('link', { name: 'Progress' }).click()

    await expect(page).toHaveURL(/#\/progress$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Progress' })).toBeVisible()
    await expect(menu).toHaveCount(0)
    // The tab now names the page you're on.
    const tab = bar.getByRole('button', { name: 'Progress' })
    await expect(tab).toHaveAttribute('aria-expanded', 'false')

    await tab.click()
    await expect(menu).toBeVisible()
    await expect(menu.getByRole('link', { name: 'Progress' })).toHaveAttribute('aria-current', 'page')
    await page.keyboard.press('Escape')
    await expect(menu).toHaveCount(0)
    await expect(tab).toHaveAttribute('aria-expanded', 'false')

    // Tapping outside closes it too; a bottom tab navigates.
    await tab.click()
    await expect(menu).toBeVisible()
    await page.mouse.click(200, 150)
    await expect(menu).toHaveCount(0)
    await bar.getByRole('link', { name: 'Revise' }).click()
    await expect(page).toHaveURL(/#\/revise$/)
    await expect(bar.getByRole('link', { name: 'Revise' })).toHaveAttribute('aria-current', 'page')
    await expect(bar.getByRole('button', { name: 'More' })).toBeVisible()
  })

  test('documents: without Google Drive the page offers to connect (no sign-in attempted)', async ({ page, allowConsole }) => {
    allowConsole(/Failed to load resource/)
    const popups: string[] = []
    page.on('popup', p => popups.push(p.url()))
    await open(page, 'documents')
    await expect(page.getByRole('heading', { level: 1, name: 'Documents' })).toBeVisible()
    const connect = page.getByRole('button', { name: 'Connect Google Drive' })
    const setup = page.getByRole('heading', { name: 'Set up Google Drive' })
    // A build with a client ID offers to connect; one without asks for the one-time setup first.
    await expect(connect.or(setup)).toBeVisible()
    if (await connect.isVisible()) {
      await expect(connect).toBeEnabled()
      await expect(page.getByText('The app sees only files it uploaded or that you pick', { exact: false })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Edit setup' })).toBeVisible()
    } else {
      await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled()
    }
    await expect(page.getByRole('button', { name: 'Disconnect' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Upload/ })).toHaveCount(0)

    await open(page, 'library')
    await expect(section(page, 'This device & backups').getByText(/^not (connected|set up)$/)).toBeVisible()
    await open(page, 'practice/papers')
    await expect(page.getByRole('link', { name: 'Google Drive' })).toHaveAttribute('href', '#/documents')
    expect(popups).toEqual([])
  })
})

// The hero animation runs with motion on, as most people see it, and with reduced motion (no loop).
for (const motion of ['no-preference', 'reduce'] as const) {
  test(`Today: the shape picker switches the form (${motion === 'reduce' ? 'reduced motion' : 'animated'})`, async ({ page, allowConsole }) => {
    allowConsole(/Failed to load resource/)
    await page.emulateMedia({ reducedMotion: motion })
    await open(page, '')
    const forms = page.getByRole('group', { name: 'Choose a form' })
    await expect(forms.getByRole('button')).toHaveText(['Brain', 'Tank', 'Fighter jet', 'Naval ship', 'Rifle', 'Helicopter', 'Missile'])
    await expect(forms.getByRole('button', { name: 'Brain' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByText('Officer-like qualities start in the mind')).toBeVisible()

    const canvas = page.locator('main canvas')
    const pixels = () => canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL())
    const before = await pixels()

    for (const [name, caption] of [['Tank', 'Indian Army · “Service Before Self”'], ['Fighter jet', 'Indian Air Force'], ['Missile', 'DRDO']] as const) {
      await forms.getByRole('button', { name }).click()
      await expect(forms.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'true')
      await expect(forms.getByRole('button', { name: 'Brain' })).toHaveAttribute('aria-pressed', 'false')
      await expect(page.getByText(caption, { exact: false })).toBeVisible()
    }
    // The canvas redraws for the new form.
    await expect.poll(pixels).not.toBe(before)

    // Dragging turns it without errors.
    const box = (await canvas.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2 + 20, { steps: 5 })
    await page.mouse.up()
    await expect(forms.getByRole('button', { name: 'Missile' })).toHaveAttribute('aria-pressed', 'true')
  })
}
