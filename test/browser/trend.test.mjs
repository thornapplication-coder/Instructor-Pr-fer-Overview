// The progress-over-time card, in the rendered app.
//
// Two things only exist once it runs: that the app actually WRITES this month's
// entry by itself (the recorder lives in a store effect), and that the card
// draws a real chart once a second month exists instead of a lone column.
import { reporter, STORAGE_KEY } from './harness.mjs'

export default async function run(browser, baseUrl, shots) {
  const { ok, fails } = reporter('progress history – records itself, then draws')
  const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } })
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e)))

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.waitForSelector('.kpi-hero')
  await page.waitForTimeout(900)

  // ---- 1. the app writes the current month without being asked -------------
  const stored = await page.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)).history, STORAGE_KEY)
  ok(Array.isArray(stored) && stored.length === 1, 'one month recorded on first run (' + JSON.stringify(stored) + ')')
  const month = stored[0]?.id
  ok(/^\d{4}-\d{2}$/.test(month || ''), 'the record is keyed by month (' + month + ')')
  ok(stored[0]?._at, 'and carries a merge stamp like every other record')
  const sum = (stored[0]?.released || 0) + (stored[0]?.inProgress || 0) + (stored[0]?.notStarted || 0)
  ok(sum === 50, 'the three numbers add up to the conversion pool (' + sum + ')')

  // ---- 2. one month says so instead of drawing a chart ---------------------
  const card = page.locator('.card').filter({ hasText: 'Fortschritt je Monat' }).first()
  ok(await card.count() === 1, 'the card is on the dashboard')
  ok(await card.locator('.trend-empty').count() === 1, 'with a single month it explains itself instead of charting')
  ok(await card.locator('.trend-plot').count() === 0, 'and draws no columns yet')

  // ---- 3. a reload must not append a second record for the same month ------
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  const again = await page.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)).history, STORAGE_KEY)
  ok(again.length === 1, 'reloading does not append a duplicate month (' + again.length + ')')

  // ---- 4. with real months it draws a stacked column per month -------------
  await page.evaluate((KEY) => {
    const d = JSON.parse(localStorage.getItem(KEY))
    d.history = [
      { id: '2026-04', released: 0, inProgress: 2, notStarted: 48, _at: '2026-04-30T00:00:00.000Z' },
      { id: '2026-06', released: 9, inProgress: 8, notStarted: 33, _at: '2026-06-30T00:00:00.000Z' },
      // Deliberately out of order – a merge appends whatever the other side had.
      { id: '2026-05', released: 3, inProgress: 6, notStarted: 41, _at: '2026-05-31T00:00:00.000Z' }
    ]
    localStorage.setItem(KEY, JSON.stringify(d))
  }, STORAGE_KEY)
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('.trend-plot')
  await page.waitForTimeout(600)

  const cols = card.locator('.trend-col')
  const n = await cols.count()
  // Three seeded months plus the one the recorder writes for today.
  ok(n >= 3, 'one column per month (' + n + ')')
  const ticks = (await card.locator('.trend-tick').allInnerTexts()).filter(Boolean)
  ok(ticks[0].startsWith('Apr'), 'the axis starts at the earliest month, not the insert order (' + ticks.join(' ') + ')')

  // Each column is a stack of the three series, and none may overflow its box.
  const geom = await cols.first().evaluate((el) => {
    const box = el.getBoundingClientRect()
    const segs = [...el.querySelectorAll('.trend-seg')]
    return { segs: segs.length, overflow: segs.some((s) => s.getBoundingClientRect().bottom > box.bottom + 1) }
  })
  ok(geom.segs >= 2, 'the first column stacks its segments (' + geom.segs + ')')
  ok(!geom.overflow, 'no segment escapes its column')

  // April is 2 of 50, June is 17 of 50 – the released+in-conversion block must
  // therefore be visibly taller in June. That is the whole point of the card.
  const filled = async (i) =>
    cols.nth(i).evaluate((el) =>
      [...el.querySelectorAll('.trend-seg')].slice(1).reduce((s, x) => s + x.getBoundingClientRect().height, 0))
  const apr = await filled(0)
  const jun = await filled(2)
  ok(jun > apr, 'progress grows: June\'s converted block is taller than April\'s (' + Math.round(apr) + ' -> ' + Math.round(jun) + 'px)')

  // The legend shows the LATEST month, not a sum across months (which would
  // count the same people once per month).
  const legend = await card.locator('.legend-val').allInnerTexts()
  const legendSum = legend.reduce((s, v) => s + Number(v), 0)
  ok(legendSum === 50, 'the legend reads one month, not a cross-month sum (' + legend.join(' / ') + ' = ' + legendSum + ')')

  await card.screenshot({ path: shots + '/trend.png' })
  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs[0] : ''))
  await page.close()
  return fails
}
