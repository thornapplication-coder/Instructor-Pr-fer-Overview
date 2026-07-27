// Plan vs. actual, end to end: type a milestone on the Capacity tab, then check
// the dashboard verdict and the dashed plan line on the trend chart.
//
// `npm test` pins the arithmetic behind the traffic light. What only exists
// once it runs is the round trip – that the editor actually stores a record the
// merge understands, and that the card turns the right colour.
import { reporter, STORAGE_KEY } from './harness.mjs'

// STATUS.critical / STATUS.good from palette.js, as the browser reports them.
const RED = 'rgb(179, 18, 44)'
const GREEN = 'rgb(31, 122, 77)'

export default async function run(browser, baseUrl, shots) {
  const { ok, fails } = reporter('plan vs. actual – milestone in, verdict out')
  const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } })
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e)))

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.waitForSelector('.kpi-hero')
  await page.waitForTimeout(700)

  // ---- 1. with no plan the card says so instead of judging -----------------
  const card = page.locator('.card').filter({ hasText: 'Soll gegen Ist' }).first()
  ok(await card.count() === 1, 'the card is on the dashboard')
  ok(await card.locator('.plan-dot').count() === 0, 'no plan, no traffic light')
  ok((await card.innerText()).includes('Noch kein Ziel gesetzt'), 'and it explains where to set one')

  // ---- 2. the editor writes a real record ---------------------------------
  await page.locator('.tab', { hasText: 'Kapazität' }).first().click()
  await page.waitForSelector('.plan-add')
  const editor = page.locator('.card').filter({ hasText: 'Umschulungs-Ziele' }).first()
  await editor.locator('input[type="month"]').fill('2026-07')
  // .first(): the editor now has two number fields, the cumulative milestone
  // and the monthly intake target. This test is about the milestone.
  await editor.locator('input[type="number"]').first().fill('12')
  await editor.locator('button', { hasText: 'Ziel setzen' }).click()
  await page.waitForTimeout(600)

  const stored = await page.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)).plan, STORAGE_KEY)
  ok(stored.length === 1 && stored[0].id === '2026-07', 'the milestone is stored keyed by month (' + JSON.stringify(stored) + ')')
  ok(stored[0].released === 12, 'with the number that was typed')
  ok(!!stored[0]._at, 'and a merge stamp, so another device can reconcile it')
  ok((await editor.innerText()).includes('12'), 'the editor lists it back')

  // ---- 3. the dashboard judges it ------------------------------------------
  // Nobody is released in the seed, so 0 of 12 has to be red.
  await page.locator('.tab', { hasText: 'Dashboard' }).first().click()
  await page.waitForSelector('.plan-dot')
  await page.waitForTimeout(500)
  const dot = await card.locator('.plan-dot').evaluate((e) => getComputedStyle(e).backgroundColor)
  ok(dot === RED, '0 of 12 released is red (' + dot + ')')
  ok((await card.locator('.plan-verdict').innerText()) === 'Hinterher', 'and the verdict says so')
  const nums = await card.locator('.plan-num .kpi-value').allInnerTexts()
  ok(nums.join('/') === '12/0/12', 'target / actual / shortfall read 12 / 0 / 12 (' + nums.join(' ') + ')')

  // ---- 4. reaching the target turns it green -------------------------------
  // Release 12 people directly in storage – the point here is the verdict, not
  // the drag & drop the board test already covers.
  await page.evaluate((KEY) => {
    const d = JSON.parse(localStorage.getItem(KEY))
    const released = d.stages[d.stages.length - 1].id
    let n = 0
    d.trainers = d.trainers.map((t) => (n++ < 12 ? { ...t, conv: { ...(t.conv || {}), stage: released } } : t))
    localStorage.setItem(KEY, JSON.stringify(d))
  }, STORAGE_KEY)
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('.plan-dot')
  await page.waitForTimeout(700)
  const green = await card.locator('.plan-dot').evaluate((e) => getComputedStyle(e).backgroundColor)
  ok(green === GREEN, '12 of 12 turns green (' + green + ')')
  ok((await card.locator('.plan-verdict').innerText()) === 'Im Plan', 'the verdict flips to "Im Plan"')

  // ---- 5. the plan draws a line on the trend chart --------------------------
  await page.evaluate((KEY) => {
    const d = JSON.parse(localStorage.getItem(KEY))
    d.history = [
      { id: '2026-05', released: 2, inProgress: 5, notStarted: 43, _at: '2026-05-31T00:00:00.000Z' },
      { id: '2026-06', released: 7, inProgress: 6, notStarted: 37, _at: '2026-06-30T00:00:00.000Z' }
    ]
    // A milestone BEFORE the history starts, so the flat-then-step behaviour is
    // exercised rather than just the single-month case.
    d.plan = [{ id: '2026-04', released: 3, _at: '2026-04-01T00:00:00.000Z' }, ...d.plan]
    localStorage.setItem(KEY, JSON.stringify(d))
  }, STORAGE_KEY)
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('.trend-plot')
  await page.waitForTimeout(700)

  const trendCard = page.locator('.card').filter({ hasText: 'Fortschritt je Monat' }).first()
  const marks = trendCard.locator('.trend-mark')
  ok(await marks.count() >= 2, 'the plan is drawn on the columns (' + (await marks.count()) + ' lines)')

  // The July milestone (12) must sit higher than the April one (3).
  const heights = await trendCard.locator('.trend-col').evaluateAll((cols) =>
    cols.map((c) => {
      const m = c.querySelector('.trend-mark')
      return m ? Math.round(c.getBoundingClientRect().bottom - m.getBoundingClientRect().top) : null
    }))
  const drawn = heights.filter((h) => h != null)
  ok(drawn.length >= 2, 'more than one column carries a line')
  ok(drawn[drawn.length - 1] > drawn[0], 'the line steps UP at the later, bigger milestone (' + drawn.join(' -> ') + 'px)')
  ok(drawn.every((h) => h >= 0), 'no line is drawn below the baseline')

  await trendCard.screenshot({ path: shots + '/trend-plan.png' })
  await card.screenshot({ path: shots + '/plan.png' })
  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs[0] : ''))
  await page.close()
  return fails
}
