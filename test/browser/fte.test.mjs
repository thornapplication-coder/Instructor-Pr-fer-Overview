// One population, one number – checked on the rendered app.
//
// The complaint that started this: the same people showed up as 43.3 here and
// something else there. Two causes, both guarded below.
//   1. Float addition does not commute. The data sums to exactly 42.85, and
//      adding it person by person landed on 42.849999999999994 – so one card
//      rounded to 42.8 and the next to 42.9. `npm test` pins the arithmetic;
//      this pins that every card on screen really shows the same result.
//   2. Three different populations were all labelled just "FTE": everyone,
//      everyone except the retirees, and the conversion pool. That is a scope,
//      not an error – but only if the screen says which one it means.
import { reporter } from './harness.mjs'

// First number in the string. Not a strip-everything-else regex: "(Umschulungs-
// Pool)" contributes a hyphen and turns the result into NaN.
const num = (s) => {
  const m = /-?\d+(?:[.,]\d+)?/.exec(String(s))
  return m ? Number(m[0].replace(',', '.')) : NaN
}

export default async function run(browser, baseUrl, shots) {
  const { ok, fails } = reporter('FTE – the same number everywhere')
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } })
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e)))

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.waitForSelector('.kpi')
  await page.waitForTimeout(600)

  // ---- 1. the overall total reads the same on every card --------------------
  // The KPI tile: "Trainer & Prüfer 50 / FTE 42,9 (ohne Rente)".
  const totalTile = page.locator('.kpi').filter({ hasText: 'Trainer & Prüfer' }).first()
  const tileSub = await totalTile.locator('.kpi-sub').innerText()
  const tileFte = num(tileSub)
  ok(tileFte > 0, 'the total tile carries an FTE figure (' + tileSub.trim() + ')')
  ok(/ohne Rente/i.test(tileSub), 'and it names its scope, so it cannot be mistaken for another total')

  // The two nested-bar cards: their legend total is the same population.
  const legendFte = async (title) => {
    const card = page.locator('.card').filter({ hasText: title }).first()
    const vals = await card.locator('.legend-val').allInnerTexts()
    return num(vals[1])
  }
  const baseFte = await legendFte('Köpfe vs. FTE je Base')
  const acFte = await legendFte('Köpfe vs. FTE je Aircraft')
  ok(baseFte === tileFte, 'the base card agrees with the tile (' + baseFte + ' = ' + tileFte + ')')
  ok(acFte === tileFte, 'the aircraft card agrees too (' + acFte + ' = ' + tileFte + ')')

  // ---- 2. the conversion tiles say which people they count ------------------
  const convTile = page.locator('.kpi').filter({ hasText: 'FTE in Umschulung' }).first()
  const convSub = await convTile.locator('.kpi-sub').innerText()
  ok(/Umschulungs-Pool/i.test(convSub),
    'the conversion tile names its smaller population (' + convSub.trim() + ')')
  const convTotal = num(convSub)
  ok(convTotal <= tileFte, 'and its total is a subset of the overall one (' + convTotal + ' <= ' + tileFte + ')')
  // Formatted like everything else: German decimal comma, never a raw "38.9".
  ok(!/\d\.\d/.test(convSub), 'formatted with a decimal comma like every other figure (' + convSub.trim() + ')')
  const availSub = await page.locator('.kpi').filter({ hasText: 'FTE verfügbar' }).first().locator('.kpi-sub').innerText()
  ok(num(availSub) === convTotal, 'both conversion tiles share one denominator (' + num(availSub) + ')')

  // ---- 3. the definition is on screen, not only in a commit message ---------
  const dashText = await page.locator('.tab-pane').innerText()
  ok(dashText.includes('FTE = Summe der Personen-FTE'), 'the dashboard explains how an FTE is arrived at')

  // ---- 4. the Capacity tab shows the same total, written the same way -------
  await page.locator('.tab', { hasText: 'Kapazität' }).first().click()
  await page.waitForSelector('.data-table')
  await page.waitForTimeout(600)
  const capText = await page.locator('.tab-pane').innerText()
  ok(capText.includes('FTE = Summe der Personen-FTE'), 'so does the Capacity tab')

  // Every "FTE gesamt" foot cell across the three capacity tables must be the
  // one total – grouped by qualification, by aircraft or by base makes no
  // difference to how many people there are.
  const foots = await page.locator('.data-table tfoot tr, .data-table tr.total-row').all()
  const totals = []
  for (const f of foots) {
    const cells = await f.locator('td').allInnerTexts()
    if (cells.length >= 3) totals.push(num(cells[2]))
  }
  ok(totals.length >= 2, 'found the capacity total rows (' + totals.length + ')')
  ok(totals.every((v) => v === totals[0]), 'all capacity tables total the same FTE (' + totals.join(' / ') + ')')
  ok(totals[0] === tileFte, 'and that equals the dashboard tile (' + totals[0] + ' = ' + tileFte + ')')

  // ---- 5. the conversion board pill uses the conversion scope, formatted ----
  await page.locator('.tab', { hasText: 'Umschulung' }).first().click()
  await page.waitForSelector('.fte-summary')
  await page.waitForTimeout(500)
  const pill = await page.locator('.fte-pill.fte-total').innerText()
  ok(num(pill) === convTotal, 'the board pill shows the conversion total (' + num(pill) + ' = ' + convTotal + ')')
  ok(!/\d\.\d/.test(pill), 'and formats it with a comma (' + pill.trim() + ')')

  await page.screenshot({ path: shots + '/fte.png', fullPage: false })
  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs[0] : ''))
  await page.close()
  return fails
}
