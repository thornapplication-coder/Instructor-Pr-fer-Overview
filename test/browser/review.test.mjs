import { reporter, STORAGE_KEY } from './harness.mjs'

export default async function run(browser, baseUrl, shots) {
  const { ok, fails } = reporter('regressions found in review')
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e)))
  // The sandbox proxy blocks Google Fonts and Supabase; only our OWN assets
  // failing is a defect.
  page.on('requestfailed', (r) => { if (r.url().startsWith(new URL(baseUrl).origin)) errs.push('own asset failed: ' + r.url()) })

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.waitForSelector('.kpi')
  await page.waitForTimeout(500)

  // ---- the gear now LOOKS active, not just to a screen reader ---------------
  const gear = page.locator('.topbar-right button[aria-label="Einstellungen"]')
  const before = await gear.evaluate((e) => getComputedStyle(e).backgroundColor)
  await gear.click()
  await page.waitForTimeout(400)
  const after = await gear.evaluate((e) => getComputedStyle(e).backgroundColor)
  ok(before !== after, 'the gear changes appearance when it is the current view (' + before + ' -> ' + after + ')')
  ok(after === 'rgb(255, 255, 255)', 'and it is the same white chip treatment as the active language')

  // ---- a long remark must not widen the table -------------------------------
  await page.evaluate((KEY) => {
    const d = JSON.parse(localStorage.getItem(KEY))
    d.trainers[0].remark = 'Fleet Manager A320 / Deputy Postholder Flight Operations, ab 01.10. nur Simulator'
    localStorage.setItem(KEY, JSON.stringify(d))
  }, STORAGE_KEY)
  await page.reload({ waitUntil: 'networkidle' })
  await page.locator('.tab', { hasText: 'Trainer' }).first().click()
  await page.waitForSelector('.data-table')
  await page.waitForTimeout(500)
  const box = await page.locator('.table-wrap').evaluate((e) => ({ c: e.clientWidth, s: e.scrollWidth }))
  ok(box.s <= box.c, 'a very long remark does not widen the table (' + box.s + ' <= ' + box.c + ')')
  const clampW = await page.locator('.cell-clamp').first().evaluate((e) => Math.round(e.getBoundingClientRect().width))
  // Tightened when "Anmerkungen" was added: two clamped columns have to fit
  // the same container the single one used to.
  ok(clampW <= 107, 'the free-text column is held to its ceiling (' + clampW + 'px)')
  // The long remark is on whichever row sorting put it – find it by its text.
  const longCell = page.locator('.cell-clamp').filter({ hasText: 'Deputy Postholder' }).first()
  const lines = await longCell.evaluate((e) => Math.round(e.getBoundingClientRect().height))
  ok(lines > 30, 'the long remark wraps onto several lines instead of widening the table (' + lines + 'px tall)')
  // The authority column must NOT be clamped any more.
  const auth = await page.locator('.data-table tbody tr').first().locator('td').nth(11).evaluate((e) => getComputedStyle(e).textOverflow)
  ok(auth !== 'ellipsis', 'the authority column is no longer truncated by the same rule')

  // ---- numeric headers stay over their columns ------------------------------
  const numTh = page.locator('.data-table th.num').first()
  const thBox = await numTh.boundingBox()
  const innerBox = await numTh.locator('.th-inner').boundingBox()
  const rightGap = (thBox.x + thBox.width) - (innerBox.x + innerBox.width)
  ok(rightGap < 14, 'a numeric header still sits at the right edge of its column (' + Math.round(rightGap) + 'px gap)')

  // ---- zero rows draw no bar ------------------------------------------------
  await page.locator('.tab', { hasText: 'Dashboard' }).first().click()
  await page.waitForSelector('.nbars')
  await page.waitForTimeout(400)
  const acCard = page.locator('.card').filter({ hasText: 'Köpfe vs. FTE je Aircraft' }).first()
  const b737 = acCard.locator('.nbar-row').filter({ hasText: 'B737' }).first()
  const vals = await b737.locator('.nbar-val').allInnerTexts()
  ok(vals.every((v) => v === '0'), 'the B737 row is at zero today (' + vals.join(' / ') + ')')
  ok(await b737.locator('.nbar-whole').count() === 0, 'a zero draws no bar at all')

  // ---- both base cards list the bases in the same order ---------------------
  const baseCard = page.locator('.card').filter({ hasText: 'Köpfe vs. FTE je Base' }).first()
  const plain = page.locator('.card').filter({ hasText: /^Base/ }).first()
  const orderA = await plain.locator('.hbar-label').allInnerTexts()
  const orderB = await baseCard.locator('.nbar-row .hbar-label').allInnerTexts()
  ok(orderA.length >= 4 && orderB.slice(0, orderA.length).join(',') === orderA.join(','),
    'both base cards use the same order (' + orderA.join(' ') + ' vs ' + orderB.join(' ') + ')')

  // ---- the same FTE figure reads the same on both tabs ----------------------
  const dashFte = (await baseCard.locator('.legend-val').allInnerTexts())[1]
  await page.locator('.tab', { hasText: 'Kapazität' }).first().click()
  await page.waitForTimeout(600)
  const capText = await page.locator('.tab-pane').innerText()
  ok(capText.includes(dashFte), 'the FTE total "' + dashFte + '" is written the same way on the Capacity tab')

  // ---- the header survives a 320px phone ------------------------------------
  await page.setViewportSize({ width: 320, height: 700 })
  await page.waitForTimeout(400)
  const overflow = await page.locator('.topbar-right').evaluate((e) => {
    const r = e.getBoundingClientRect()
    return [...e.children].some((c) => c.getBoundingClientRect().right > r.right + 1)
  })
  ok(!overflow, 'no header icon is pushed off the edge on a 320px screen')
  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs[0] : ''))
  await page.close()
  return fails
}
