import { reporter } from './harness.mjs'

export default async function run(browser, baseUrl, shots) {
  const { ok, fails } = reporter('conversion board – card widths')
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e)))
  // The sandbox proxy blocks Google Fonts and Supabase; only our OWN assets
  // failing is a defect.
  page.on('requestfailed', (r) => { if (r.url().startsWith(new URL(baseUrl).origin)) errs.push('own asset failed: ' + r.url()) })

  for (const vp of [{ width: 1440, height: 950, tag: 'desktop' }, { width: 390, height: 844, tag: 'phone' }]) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } })
    await page.goto(baseUrl, { waitUntil: 'networkidle' })
    await page.waitForSelector('.topbar')
    await page.locator('.tab', { hasText: 'Umschulung' }).first().click()
    await page.waitForSelector('.conv-card', { timeout: 8000 })
    await page.waitForTimeout(400)

    const col = await page.locator('.board-col').first().boundingBox()
    const card = await page.locator('.conv-card').first().boundingBox()
    console.log(`  [${vp.tag}] column ${Math.round(col.width)}px · card ${Math.round(card.width)}×${Math.round(card.height)}px`)
    ok(col.width <= 200.5, `[${vp.tag}] column no wider than 200px`)
    ok(card.width < 195, `[${vp.tag}] card narrower than before (was ~270px on desktop)`)

    // Nothing may spill out of the card horizontally.
    const overflow = await page.locator('.conv-card').first().evaluate((el) => {
      let worst = 0
      const r = el.getBoundingClientRect()
      el.querySelectorAll('*').forEach((c) => {
        const cr = c.getBoundingClientRect()
        worst = Math.max(worst, cr.right - r.right, r.left - cr.left)
      })
      return Math.round(worst)
    })
    ok(overflow <= 1, `[${vp.tag}] no child overflows the card (worst ${overflow}px)`)

    // The move buttons must stay usable.
    const btn = await page.locator('.conv-card .mini-btn').first().boundingBox()
    ok(btn.width >= 22 && btn.height >= 22, `[${vp.tag}] move button still tappable (${Math.round(btn.width)}×${Math.round(btn.height)})`)

    // The board scrolls sideways instead of squashing columns.
    const scrollable = await page.locator('.board').evaluate((el) => el.scrollWidth > el.clientWidth)
    console.log(`  [${vp.tag}] board scrolls horizontally: ${scrollable}`)

    await page.locator('.board').screenshot({ path: shots + '/board-' + vp.tag + '.png' })
    await page.close()
  }

  // The shared mini-btn outside the board must keep its original size.
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 950 } })
    await page.goto(baseUrl, { waitUntil: 'networkidle' })
    await page.locator('.tab', { hasText: 'Umschulung' }).first().click()
    await page.waitForSelector('.conv-card')
    await page.locator('button', { hasText: 'Phasen' }).first().click()
    await page.waitForTimeout(500)
    const b = await page.locator('.modal .mini-btn').first().boundingBox()
    ok(b && b.width >= 29 && b.height >= 25, 'list-editor mini-btn unchanged (' + Math.round(b.width) + '×' + Math.round(b.height) + ')')
    await page.close()
  }
  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs[0] : ''))
  await page.close()
  return fails
}
