// The pick lists in the settings. Renaming a status there has to show up
// wherever that status is drawn - that is the entire point of the feature, and
// it is the half that a per-file constant quietly does not deliver.
import { reporter, STORAGE_KEY } from './harness.mjs'
// Read from the registry rather than repeating its size. A literal here is a
// number somebody has to remember to bump, and when they forget the failure
// reads as "the settings page broke" rather than "a list was added" - which is
// exactly what it said the first time a list WAS added.
import { EDITABLE_LISTS } from '../../src/data/lists.js'

export default async function run(browser, baseUrl, shots) {
  const { ok, fails } = reporter('pick lists – edit once, read everywhere')
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e)))

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.waitForSelector('.kpi-hero')
  await page.locator('.icon-round').first().click()
  await page.waitForSelector('.lists-grid')
  await page.waitForTimeout(400)

  const blocks = page.locator('.list-block')
  ok(await blocks.count() === EDITABLE_LISTS.length,
    'every pick list in the registry is offered (' + (await blocks.count()) + ' of ' + EDITABLE_LISTS.length + ')')
  const names = (await page.locator('.list-name').allInnerTexts()).map((x) => x.trim())
  ok(names.includes('Aircraft') && names.includes('ORE-Stufen') && names.includes('Bases'),
    'including the ones that were hardcoded (' + names.join(', ') + ')')
  const lockedExpected = EDITABLE_LISTS.filter((l) => l.locked).length
  ok(await page.locator('.list-locked').count() === lockedExpected,
    'the locked ones are marked name-and-colour only (' + (await page.locator('.list-locked').count()) +
    ' of ' + lockedExpected + ')')

  // ---- a locked list can be renamed but not added to or emptied ------------
  const conv = page.locator('.list-block').filter({ hasText: 'Umschulungs-Status' }).first()
  await conv.locator('summary').click()
  await page.waitForTimeout(300)
  ok(await conv.locator('.catman-row').count() === 4, 'the conversion statuses are listed (' + (await conv.locator('.catman-row').count()) + ')')
  ok(await conv.locator('.mini-btn.danger').count() === 0, 'and none of them can be deleted')
  ok(await conv.locator('.btn-ghost').count() === 0, 'nor a fifth one added')

  await conv.locator('.catman-label').first().fill('läuft')
  await page.waitForTimeout(600)
  const stored = await page.evaluate((K) => JSON.parse(localStorage.getItem(K)).convStatus, STORAGE_KEY)
  ok(stored[0].label === 'läuft', 'the new name reached storage (' + JSON.stringify(stored[0]) + ')')
  ok(stored[0].id === 'on_track', 'and the id - the value the code branches on - is untouched')
  ok(!!stored[0]._at, 'with a merge stamp, so the other device gets the rename too')

  // ---- an open list can gain an entry, and it shows up in the dropdown -----
  const ac = page.locator('.list-block').filter({ hasText: 'Aircraft' }).first()
  await ac.locator('summary').click()
  await page.waitForTimeout(300)
  ok(await ac.locator('.btn-ghost').count() === 1, 'aircraft can gain an entry')
  await ac.locator('.btn-ghost').click()
  await page.waitForTimeout(300)
  await ac.locator('.catman-label').last().fill('B738')
  await page.waitForTimeout(600)
  const acs = await page.evaluate((K) => JSON.parse(localStorage.getItem(K)).aircraftTypes, STORAGE_KEY)
  ok(acs.length === 3 && acs[2].label === 'B738', 'the new aircraft is stored (' + acs.map((a) => a.label).join(', ') + ')')

  // ---- and the rename is visible where the status is actually drawn --------
  await page.locator('.tab', { hasText: 'Umschulung' }).first().click()
  await page.waitForSelector('.conv-card')
  await page.waitForTimeout(500)
  const dotTitle = await page.locator('.conv-status-dot').first().getAttribute('title')
  ok(dotTitle === 'läuft', 'the board reads the renamed status (' + dotTitle + ')')

  const acOptions = await page.locator('.toolbar select').nth(0).locator('option').allInnerTexts()
  ok(acOptions.some((o) => o.includes('B738')), 'and the aircraft filter offers the new entry (' + acOptions.join(' | ') + ')')

  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs[0] : ''))
  await page.close()
  return fails
}
