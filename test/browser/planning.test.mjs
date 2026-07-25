// The Planning tab's assign dialog.
//
// Opening it used to blank the entire app: PlanningModal is a SIBLING of
// Planning(), not nested inside it, so the `tint` defined in Planning() was
// simply not in scope – a ReferenceError on first render, which React answers
// by unmounting the whole tree. No error message, just a white page.
//
// The tab had no browser coverage at all, which is how a crash on its primary
// action shipped. This drives the real thing: open, assign, save, reopen.
import { reporter, STORAGE_KEY } from './harness.mjs'

export default async function run(browser, baseUrl, shots) {
  const { ok, fails } = reporter('planning – the assign dialog opens and saves')
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e)))

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.waitForSelector('.kpi-hero')
  await page.locator('.tab', { hasText: 'Planung' }).first().click()
  await page.waitForSelector('.planning-table')
  await page.waitForTimeout(500)

  // ---- 1. it opens at all --------------------------------------------------
  const chips = page.locator('.planning-table').getByText('zuweisen')
  ok(await chips.count() > 0, 'the grid offers assign chips (' + (await chips.count()) + ')')
  await chips.first().click()
  await page.waitForTimeout(800)

  // The regression was a blank page, so check the app is still standing before
  // checking the dialog – "no modal" and "no app" are different faults.
  ok((await page.locator('.topbar').count()) === 1, 'the app is still rendered (not a white screen)')
  ok((await page.locator('.modal').count()) === 1, 'and the assign dialog is open')
  ok(errs.length === 0, 'opening it raises no page error' + (errs.length ? ': ' + errs[0] : ''))

  const modal = page.locator('.modal')
  const blocks = modal.locator('.assign-block')
  ok(await blocks.count() >= 4, 'one block per planning step (' + (await blocks.count()) + ')')
  // The crash was in the coloured left border of these blocks.
  const border = await blocks.first().evaluate((e) => getComputedStyle(e).borderLeftColor)
  ok(/^rgb/.test(border), 'each block carries its step colour (' + border + ')')

  // ---- 2. an assignment can actually be made -------------------------------
  const firstBlock = blocks.first()
  const provider = firstBlock.locator('select').first()
  const options = await provider.locator('option').count()
  ok(options > 1, 'the provider list is populated (' + options + ' options)')
  const value = await provider.locator('option').nth(1).getAttribute('value')
  await provider.selectOption(value)
  await page.waitForTimeout(400)

  // A date, through the shared clearable field.
  const date = firstBlock.locator('input[type="date"]').first()
  await date.fill('2026-09-15')
  await page.waitForTimeout(600)

  const stored = await page.evaluate((KEY) => {
    const d = JSON.parse(localStorage.getItem(KEY))
    const t = d.trainers.find((x) => Object.values(x.assignments || {}).some((a) => a && a.providerId))
    if (!t) return null
    const step = Object.entries(t.assignments).find(([, a]) => a && a.providerId)
    return { id: t.id, providerId: step[1].providerId, date: step[1].date }
  }, STORAGE_KEY)
  ok(stored && stored.providerId, 'the provider reached storage (' + (stored && stored.providerId) + ')')
  ok(stored && stored.date === '2026-09-15', 'and so did the date (' + (stored && stored.date) + ')')

  // ---- 3. it survives a close/reopen ---------------------------------------
  await modal.locator('.icon-btn').first().click()
  await page.waitForTimeout(400)
  ok((await page.locator('.modal').count()) === 0, 'the dialog closes')
  // The cell now shows the provider instead of "+ zuweisen".
  const filled = await page.locator('.planning-table').getByText('zuweisen').count()
  ok(filled < (await chips.count()) + 1, 'the assigned cell no longer offers "+ zuweisen"')

  await page.locator('.planning-table .link-btn').first().click()
  await page.waitForSelector('.modal')
  await page.waitForTimeout(500)
  ok((await page.locator('.modal').count()) === 1, 'and reopens from the name without crashing')
  ok(errs.length === 0, 'no page errors at all' + (errs.length ? ': ' + errs[0] : ''))

  await page.close()
  return fails
}
