// The Other Pilots roster: several types per person, a validity worked out
// against today, and the three exports.
import { reporter, STORAGE_KEY } from './harness.mjs'

export default async function run(browser, baseUrl, shots) {
  const { ok, fails } = reporter('other pilots – the roster, its ratings and its exports')
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } })
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e)))

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.waitForSelector('.kpi-hero')
  await page.locator('.tab', { hasText: 'Other Pilots' }).first().click()
  await page.waitForSelector('.pilots-table')
  await page.waitForTimeout(500)

  const heads = (await page.locator('.pilots-table th').allInnerTexts()).map((x) => x.trim().split('\n')[0])
  ok(heads.join('|').includes('BASE') && heads.join('|').includes('TLC'), 'the roster columns are there (' + heads.join(' | ') + ')')
  ok(heads.some((h) => h.includes('GÜLTIG')) && heads.some((h) => h.includes('ABGELAUFEN')),
    'including the two derived ones')

  const rows = page.locator('.pilots-table tbody tr')
  ok(await rows.count() === 64, 'all sixty-four people are listed (' + (await rows.count()) + ')')

  // Sorted by name by default, and the name carries the comma.
  const names = (await page.locator('.pilots-table tbody tr td:nth-child(3)').allInnerTexts()).map((x) => x.trim().split('\n')[0])
  ok(names[0].includes(','), 'the name reads "Nachname, Vorname" (' + names[0] + ')')
  ok(names.join('|') === [...names].sort((a, b) => a.localeCompare(b)).join('|'), 'and the list is alphabetical')

  // Somebody with two ratings shows both, and is marked in both columns.
  const jerry = page.locator('.pilots-table tbody tr').filter({ hasText: 'Altenhuber' }).first()
  // Two lines in each of the five per-rating columns: type, date, Boeing
  // experience, valid, expired.
  ok(await jerry.locator('td:nth-child(4) .rating-line').count() === 2, 'both types are visible')
  ok(await jerry.locator('td:nth-child(5) .rating-line').count() === 2, 'and both dates')
  // The × has to sit on the SAME line as the date it judges: the first rating
  // (expired) marks line 1 of "Abgelaufen", the second (valid) line 2 of
  // "Gültig". One × per person put them both on line 1.
  const lineTop = (sel, i) =>
    jerry.locator(sel).nth(i).evaluate((e) => Math.round(e.getBoundingClientRect().top))
  const d1 = await lineTop('td:nth-child(5) .rating-line', 0)
  const d2 = await lineTop('td:nth-child(5) .rating-line', 1)
  const expiredMark = await lineTop('td:nth-child(8) .rating-line', 0)
  const validMark = await lineTop('td:nth-child(7) .rating-line', 1)
  ok(Math.abs(expiredMark - d1) <= 1, 'the expired × is level with the date that lapsed (' + expiredMark + ' vs ' + d1 + ')')
  ok(Math.abs(validMark - d2) <= 1, 'and the valid × is level with the date that still holds (' + validMark + ' vs ' + d2 + ')')
  const marks = await jerry.locator('td:nth-child(7) .rating-line, td:nth-child(8) .rating-line').allInnerTexts()
  ok(marks.map((x) => x.trim()).join('|') === '|×|×|', 'exactly one mark per rating (' + JSON.stringify(marks) + ')')

  // Centred, and the dates carry their own verdict as a colour.
  const align = await jerry.locator('td').nth(6).evaluate((e) => getComputedStyle(e).textAlign)
  ok(align === 'center', 'the marked columns are centred (' + align + ')')
  const c1 = await jerry.locator('td:nth-child(5) .rating-line').nth(0).evaluate((e) => getComputedStyle(e).color)
  const c2 = await jerry.locator('td:nth-child(5) .rating-line').nth(1).evaluate((e) => getComputedStyle(e).color)
  ok(c1 === 'rgb(179, 18, 44)', 'a lapsed date is red (' + c1 + ')')
  ok(c2 === 'rgb(31, 122, 77)', 'and a date that still holds is green (' + c2 + ')')

  // The verdict is computed: move the date and the mark moves with it.
  await page.evaluate((K) => {
    const d = JSON.parse(localStorage.getItem(K))
    d.otherPilots = d.otherPilots.map((p) =>
      p.name.startsWith('Altenhuber') ? { ...p, ratings: p.ratings.map((r) => ({ ...r, until: '2020-01-31' })) } : p
    )
    localStorage.setItem(K, JSON.stringify(d))
  }, STORAGE_KEY)
  await page.reload({ waitUntil: 'networkidle' })
  await page.locator('.tab', { hasText: 'Other Pilots' }).first().click()
  await page.waitForSelector('.pilots-table')
  await page.waitForTimeout(400)
  const j2 = page.locator('.pilots-table tbody tr').filter({ hasText: 'Altenhuber' }).first()
  const after = (await j2.locator('td:nth-child(7) .rating-line, td:nth-child(8) .rating-line').allInnerTexts()).map((x) => x.trim())
  ok(after.join('|') === '||×|×',
    'both dates in the past means two expired marks and none valid – nothing is read from a stored flag (' + JSON.stringify(after) + ')')

  // ---- the dialog: base and type are dropdowns with an empty choice --------
  await page.locator('.pilots-table tbody tr').first().click()
  await page.waitForSelector('.modal')
  await page.waitForTimeout(400)
  const modal = page.locator('.modal')
  const baseSel = modal.locator('.field', { hasText: 'Base' }).locator('select')
  ok((await baseSel.locator('option').first().getAttribute('value')) === '', 'the base dropdown offers an empty cell')
  ok((await baseSel.locator('option').count()) >= 10, 'and the bases from the settings (' + (await baseSel.locator('option').count()) + ')')

  const ratingRows = modal.locator('.rating-row')
  ok(await ratingRows.count() >= 1, 'the ratings are editable one by one (' + (await ratingRows.count()) + ')')
  const typeSel = ratingRows.first().locator('select')
  ok((await typeSel.locator('option').first().getAttribute('value')) === '', 'the type dropdown offers an empty cell too')
  await modal.locator('.btn-ghost', { hasText: 'Muster' }).click()
  await page.waitForTimeout(300)
  ok(await modal.locator('.rating-row').count() >= 2, 'and another type can be added')

  // TLC is held to three characters as it is typed.
  const tlc = modal.locator('.field', { hasText: 'TLC' }).locator('input')
  await tlc.fill('abcdef')
  await page.waitForTimeout(200)
  ok((await tlc.inputValue()) === 'ABC', 'the TLC is three upper-case characters (' + (await tlc.inputValue()) + ')')
  await modal.locator('.btn-ghost', { hasText: 'Abbrechen' }).click()
  await page.waitForTimeout(300)

  // ---- PDF, Excel and print ------------------------------------------------
  await page.locator('.icon-round').first().click()
  await page.waitForSelector('.dl-row')
  const row = page.locator('.dl-row').filter({ hasText: 'Other Pilots' }).first()
  ok(await row.locator('.dl-chip.pdf').count() === 1, 'the roster offers a PDF')
  ok(await row.locator('.dl-chip.xls').count() === 1, 'an Excel sheet')
  ok(await row.locator('.dl-chip.print').count() === 1, 'and print')
  const fs = (await import('fs')).default
  for (const kind of ['pdf', 'xls']) {
    const dl = page.waitForEvent('download', { timeout: 90000 })
    await row.locator('.dl-chip.' + kind).click()
    let f = null
    try { f = await dl } catch (e) { f = null }
    ok(!!f, 'the ' + kind.toUpperCase() + ' builds')
    if (f) {
      const p = shots + '/pilots.' + kind
      await f.saveAs(p)
      ok(fs.statSync(p).size > 1000, '  and carries the roster (' + Math.round(fs.statSync(p).size / 1024) + ' KB)')
    }
    await page.waitForTimeout(500)
  }

  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs[0] : ''))
  await page.close()
  return fails
}
