import { reporter } from './harness.mjs'

export default async function run(browser, baseUrl, shots) {
  const { ok, fails } = reporter('app shell – heading, gear, changelog')
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e)))
  // The sandbox proxy blocks Google Fonts and Supabase; only our OWN assets
  // failing is a defect.
  page.on('requestfailed', (r) => { if (r.url().startsWith(new URL(baseUrl).origin)) errs.push('own asset failed: ' + r.url()) })

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.waitForSelector('.topbar')

  // ---- heading without the 737 ------------------------------------------------
  const h1 = (await page.locator('.brand-text h1').innerText()).trim()
  ok(!/737/.test(h1), 'the heading no longer carries "737": "' + h1 + '"')
  ok(/^Trainer & Prüfer/.test(h1), 'the heading starts with "Trainer & Prüfer"')
  await page.locator('.lang-btn', { hasText: 'EN' }).click()
  await page.waitForTimeout(400)
  const h1en = (await page.locator('.brand-text h1').innerText()).trim()
  ok(!/737/.test(h1en) && /Trainer & Examiner/.test(h1en), 'English heading too: "' + h1en + '"')
  await page.locator('.lang-btn', { hasText: 'DE' }).click()
  await page.waitForTimeout(400)
  // The logo mark is a separate thing and keeps its 737.
  ok((await page.locator('.brandmark svg').first().textContent()).includes('737'), 'the logo keeps its 737')

  // ---- changelog collapses ----------------------------------------------------
  await page.locator('.topbar-right button[aria-label="Einstellungen"]').click()
  await page.waitForSelector('.changelog-entry')
  const entries = page.locator('.changelog-entry')
  const n = await entries.count()
  ok(n > 3, 'changelog rendered (' + n + ' versions)')

  const openCount = await entries.evaluateAll((els) => els.filter((e) => e.hasAttribute('open')).length)
  ok(openCount === 1, 'exactly one entry is open on arrival (the newest)')

  // A collapsed entry shows its version and date, and nothing else.
  const second = entries.nth(1)
  ok(!(await second.evaluate((e) => e.hasAttribute('open'))), 'older entries start collapsed')
  const summaryTxt = (await second.locator('summary').innerText()).replace(/\s+/g, ' ').trim()
  ok(/^v\d+\.\d+\.\d+ \d{4}-\d{2}-\d{2}$/.test(summaryTxt), 'collapsed row shows only version + date: "' + summaryTxt + '"')
  ok(!(await second.locator('ul').isVisible()), 'the change list is hidden while collapsed')

  // Opening it reveals the list; keyboard works because <details> is native.
  await second.locator('summary').click()
  await page.waitForTimeout(250)
  ok(await second.locator('ul').isVisible(), 'clicking the row expands it')
  ok(await second.evaluate((e) => e.hasAttribute('open')), 'the open state is on the element')
  await second.locator('summary').press('Enter')
  await page.waitForTimeout(250)
  ok(!(await second.evaluate((e) => e.hasAttribute('open'))), 'Enter collapses it again (keyboard operable)')

  await page.locator('.changelog').screenshot({ path: shots + '/changelog.png' })
  // ---- the tab survives a reload, and switching starts at the top ---------
  await page.locator('.tab', { hasText: 'Provider' }).first().click()
  await page.waitForTimeout(400)
  ok(page.url().includes('#/providers'), 'the open tab is in the address (' + page.url().split('#')[1] + ')')
  await page.evaluate(() => window.scrollTo(0, 600))
  await page.waitForTimeout(200)
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  const stillThere = await page.locator('.tab.active').innerText()
  ok(stillThere.trim() === 'Provider', 'a reload stays on the page instead of jumping to the dashboard (' + stillThere.trim() + ')')

  await page.evaluate(() => window.scrollTo(0, 900))
  await page.waitForTimeout(200)
  await page.locator('.tab', { hasText: 'Trainer' }).first().click()
  await page.waitForTimeout(500)
  const y = await page.evaluate(() => window.scrollY)
  ok(y < 40, 'switching tabs opens the new page at the top, not where the old one was scrolled to (' + y + ')')

  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs[0] : ''))
  await page.close()
  return fails
}
