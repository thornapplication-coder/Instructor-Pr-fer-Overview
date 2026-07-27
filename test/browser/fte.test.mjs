// One population, one number – checked on the rendered app.
//
// The complaint that started this: the same people showed up as 43.3 here and
// something else there. Two causes, both guarded below.
//   1. Float addition does not commute, so a group-by-group sum could land a
//      hair below a .x5 boundary and round the other way from a person-by-person
//      one. `npm test` pins the arithmetic; this pins that every card on screen
//      really shows the same result.
//   2. Different populations were all labelled just "FTE". Since the "Rente"
//      tier was dropped, only two remain – the whole roster and the conversion
//      pool – and the screen has to say which one it means.
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
  // The summary band: "50 Trainer & Prüfer | 44,7 FTE".
  const hero = page.locator('.kpi-hero').first()
  const heroText = await hero.innerText()
  const tileFte = num(await hero.locator('.kpi-hero-fte .kpi-value').innerText())
  ok(tileFte > 0, 'the summary band carries an FTE figure (' + tileFte + ')')
  ok(/Trainer & Prüfer/.test(heroText), 'and it still shows the headcount next to it')
  // The "Rente" tier is gone, so no figure may claim to exclude anybody.
  ok(!/ohne Rente|excl\. retir/i.test(heroText), 'and it no longer claims to exclude a group that does not exist')

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

  // ---- the capacity tab on a phone and a tablet ---------------------------
  // Measured, the widest figure table wants 745px and the editor 664px, so a
  // phone hid 423px and 342px of them. Below 1000px each row is a card: the
  // key, then its figures, each keeping the heading its column had.
  await page.setViewportSize({ width: 390, height: 844 })
  await page.locator('.tab', { hasText: 'Kapazität' }).first().click()
  await page.waitForSelector('.cap-table')
  await page.waitForTimeout(600)
  const capCard = await page.evaluate(() => {
    const tables = [...document.querySelectorAll('.cap-table')]
    const ed = document.querySelector('.edit-table')
    if (!tables.length || !ed) return { error: 'a capacity table is missing' }
    const r = (el) => el.getBoundingClientRect()
    const row = tables[0].querySelector('tbody tr')
    const figs = [...row.querySelectorAll('.cp-fig')]
    const edRow = ed.querySelector('tbody tr')
    const dateEl = edRow && edRow.querySelector('.ce-date input')
    return {
      hidden: tables.map((t) => { const w = t.closest('.table-wrap'); return w.scrollWidth - w.clientWidth }),
      editHidden: (() => { const w = ed.closest('.table-wrap'); return w.scrollWidth - w.clientWidth })(),
      pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
      figures: figs.length,
      // Every figure keeps the heading its column carried.
      headed: figs.filter((f) => {
        const c = getComputedStyle(f, '::before').content
        return c && c !== 'none' && c !== '""'
      }).length,
      // Three to a line, and the lines are level – a wrapped heading must not
      // drop its own figure below the ones beside it.
      lineTops: figs.map((f) => Math.round(r(f).top)),
      // The longest heading has to be readable, not clipped to "IN UMSCHULU…".
      longestHeadingWraps: (() => {
        const el = figs.find((f) => /UMSCHULUNG/i.test(getComputedStyle(f, '::before').content))
        return el ? getComputedStyle(el, '::before').whiteSpace : 'not found'
      })(),
      keyFullWidth: r(row.querySelector('.cp-key')).width > r(row).width - 40,
      dateWidth: dateEl ? Math.round(r(dateEl).width) : 0,
      worstRight: Math.max(...[...row.querySelectorAll('td, td *')].map((e) => Math.round(r(e).right))),
      rowRight: Math.round(r(row).right)
    }
  })
  ok(!capCard.error, 'the capacity cards render' + (capCard.error ? ': ' + capCard.error : ''))
  if (!capCard.error) {
    ok(capCard.hidden.every((h) => h <= 1) && capCard.editHidden <= 1,
      'none of the four capacity tables hides anything on a phone (' +
      capCard.hidden.join('/') + ' + ' + capCard.editHidden + ')')
    ok(capCard.pageOverflow <= 0, 'and the page does not scroll sideways (' + capCard.pageOverflow + ')')
    ok(capCard.figures >= 6 && capCard.headed === capCard.figures,
      'every figure keeps its column heading (' + capCard.headed + '/' + capCard.figures + ')')
    ok(capCard.keyFullWidth, 'the row key is the card headline')
    const firstLine = capCard.lineTops.slice(0, 3)
    const secondLine = capCard.lineTops.slice(3, 6)
    ok(new Set(firstLine).size === 1 && new Set(secondLine).size === 1,
      'the figures line up across each line – a wrapped heading does not drop its own (' +
      capCard.lineTops.join(', ') + ')')
    ok(capCard.longestHeadingWraps === 'normal',
      '  which is why the longest heading wraps rather than being clipped (' + capCard.longestHeadingWraps + ')')
    ok(capCard.dateWidth >= 160, 'the target date is wide enough to show its date (' + capCard.dateWidth + 'px)')
    ok(capCard.worstRight <= capCard.rowRight + 1, 'and nothing paints outside the card')
  }
  await page.setViewportSize({ width: 1500, height: 1000 })
  await page.waitForTimeout(500)
  const capDesk = await page.evaluate(() => {
    const t = document.querySelector('.cap-table')
    const w = t.closest('.table-wrap')
    return { display: getComputedStyle(t).display, hidden: w.scrollWidth - w.clientWidth }
  })
  ok(capDesk.display === 'table' && capDesk.hidden === 0,
    'and a desktop keeps the real tables (' + capDesk.display + ', ' + capDesk.hidden + 'px hidden)')

  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs[0] : ''))
  await page.close()
  return fails
}
