// Trainer table layout, the conversion tiles' scope, and the ORE card.
//
// All three are about what the screen SAYS, so none of them can be checked
// anywhere but here.
import { reporter, STORAGE_KEY } from './harness.mjs'

export default async function run(browser, baseUrl, shots) {
  const { ok, fails } = reporter('columns, scope labels and the ORE card')
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } })
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e)))

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.waitForSelector('.kpi-hero')
  await page.waitForTimeout(600)

  // ---- 1. every conversion tile names the population it counts -------------
  const cvTiles = page.locator('.kpi').filter({ hasText: /freigegeben|In Umschulung|Noch nicht gestartet|FTE/ })
  const n = await cvTiles.count()
  ok(n >= 5, 'the conversion section has its tiles (' + n + ')')
  const subs = []
  for (let i = 0; i < n; i++) {
    const tile = cvTiles.nth(i)
    if (!/freigegeben|In Umschulung|Noch nicht gestartet|FTE in|FTE verf/.test(await tile.innerText())) continue
    subs.push((await tile.locator('.kpi-sub').innerText().catch(() => '')).trim())
  }
  ok(subs.length >= 5, 'and each of them carries a sub-line (' + subs.length + ')')
  ok(subs.every((s) => /Umschulungs-Pool/.test(s)), 'every one names the conversion pool')
  ok(subs.every((s) => /SEN\/TRE\/TRI\/LTC/.test(s)),
    'and spells out which qualifications that is (' + (subs[0] || '') + ')')

  // ---- 2. the ORE card counts A–C only -------------------------------------
  const oreCard = page.locator('.card').filter({ hasText: 'ORE-Priorität' }).first()
  const keys = await oreCard.locator('.legend-key').allInnerTexts()
  ok(keys.join(',') === 'A,B,C', 'the ORE legend lists A, B and C only (' + keys.join(' ') + ')')
  const vals = (await oreCard.locator('.legend-val').allInnerTexts()).map(Number)
  const sum = vals.reduce((s, v) => s + v, 0)
  const shownTotal = Number((/(\d+)/.exec(await oreCard.locator('.card-total').innerText()) || [0, 0])[1])
  ok(sum === shownTotal, 'the card total equals its own slices (' + shownTotal + ' = ' + sum + ')')
  ok(sum < 50, 'and it is the people who carry a tier, not the whole pool (' + sum + ' < 50)')
  // textContent, not innerText: the ring's number is an SVG <text> node, and
  // innerText is defined on HTMLElement only.
  ok(Number(await oreCard.locator('.donut-num').textContent()) === sum, 'the number in the ring agrees too')

  // ---- 3. the trainer table's two free-text columns ------------------------
  await page.locator('.tab', { hasText: 'Trainer' }).first().click()
  await page.waitForSelector('.data-table')
  await page.waitForTimeout(500)
  const heads = await page.locator('.data-table thead th').allInnerTexts()
  // Upper-cased: the headers are rendered in caps by CSS, and innerText returns
  // what is on screen, not what the source wrote.
  const clean = heads.map((h) => h.replace(/[↑↓⇅\s]+$/g, '').trim().toUpperCase())
  ok(!clean.some((h) => h.includes('FUNKTION /')), 'the old combined header is gone')
  ok(clean.includes('FUNKTION'), 'there is a "Funktion" column')
  ok(clean.includes('ANMERKUNGEN'), 'and a new "Anmerkungen" column')
  // Both belong at the end, after the conversion stage.
  const iConv = clean.findIndex((h) => h.includes('UMSCHULUNG'))
  ok(iConv >= 0 && clean.indexOf('FUNKTION') > iConv,
    '"Funktion" sits after the conversion column (' + clean.indexOf('FUNKTION') + ' > ' + iConv + ')')
  ok(clean.indexOf('ANMERKUNGEN') === clean.length - 1, 'and "Anmerkungen" is the very last column')

  const cells = await page.locator('.data-table tbody tr').first().locator('td').count()
  ok(cells === clean.length, 'every row has one cell per header (' + cells + ' = ' + clean.length + ')')

  // ---- 4. the new field round-trips ----------------------------------------
  await page.evaluate((KEY) => {
    const d = JSON.parse(localStorage.getItem(KEY))
    d.trainers[0].note = 'Nur Simulator, kein Linecheck'
    localStorage.setItem(KEY, JSON.stringify(d))
  }, STORAGE_KEY)
  await page.reload({ waitUntil: 'networkidle' })
  await page.locator('.tab', { hasText: 'Trainer' }).first().click()
  await page.waitForSelector('.data-table')
  await page.waitForTimeout(500)
  const noteCell = page.locator('.data-table tbody td').filter({ hasText: 'Nur Simulator' }).first()
  ok(await noteCell.count() === 1, 'a stored note is rendered in the table')
  // It must not leak into the "Funktion" chart – that one counts `remark`.
  const survived = await page.evaluate((KEY) => {
    const t = JSON.parse(localStorage.getItem(KEY)).trainers[0]
    return { note: t.note, remark: t.remark || '' }
  }, STORAGE_KEY)
  ok(survived.note === 'Nur Simulator, kein Linecheck', 'and it survives the load/normalise round trip')
  ok(!survived.remark.includes('Nur Simulator'), 'without bleeding into the Funktion field')

  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs[0] : ''))
  await page.close()
  return fails
}
