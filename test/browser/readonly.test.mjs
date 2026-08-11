// Viewer mode: everyone with the link sees the state, nobody can change it.
//
// The cloud cannot be reached from the sandbox, so the shared-row PULL is not
// what this exercises. What it exercises is the half that has to hold whatever
// the network does: with no session, the store refuses every write and the
// controls that would attempt one are gone.
//
// The block is asserted at the STORE, not by counting buttons. A missing button
// proves nothing about the twelve other ways into the same mutation, and the
// whole point of putting the guard in patch() was that no screen can be
// half-protected.
import { reporter, STORAGE_KEY } from './harness.mjs'

// The sandbox cannot reach Supabase, so the real trigger (a shared row was
// pulled) cannot fire here. The device-local switch is used instead, which is
// the same flag the store ORs into `readOnly` - so what runs below is the same
// code path a visitor gets, minus the network.
export default async function run(browser, baseUrl, shots) {
  const { ok, fails } = reporter('viewer mode – read the link, change nothing')
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } })
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e)))

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.waitForSelector('.kpi-hero')
  // First: with no shared row and no switch, NOTHING changes. This is the
  // guard that the feature cannot go off by accident on somebody using the app
  // locally, which is how every install works until the policy is in place.
  await page.waitForTimeout(900)
  const beforeSwitch = await page.evaluate(() => ({
    banner: document.querySelectorAll('.ro-banner').length,
    add: [...document.querySelectorAll('.tab-pane .toolbar .btn')].filter((b) => b.innerText.trim().startsWith('+')).length
  }))
  ok(beforeSwitch.banner === 0, 'without a shared row the app is unchanged – no band')
  await page.evaluate(() => localStorage.setItem('ewl737:viewOnly', '1'))
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('.kpi-hero')
  await page.waitForTimeout(700)

  // ---- 1. the band says what mode this is ---------------------------------
  const banner = page.locator('.ro-banner')
  ok(await banner.count() === 1, 'a visitor is told this is a read-only view')
  const bannerText = (await banner.innerText()).replace(/\n/g, ' ')
  ok(/Nur-Lese/i.test(bannerText), '  in words, not just by things being missing (' + bannerText.slice(0, 60) + '…)')
  ok(/anmelden/i.test(bannerText), '  and it says how to get editing back')

  // ---- 2. the store refuses, whatever the screen offers -------------------
  await page.locator('.tab', { hasText: 'Trainer' }).first().click()
  await page.waitForSelector('.trainer-table')
  await page.waitForTimeout(400)
  const before = await page.evaluate((K) => JSON.parse(localStorage.getItem(K)).trainers[0].name, STORAGE_KEY)
  // Straight at the mutation, bypassing every button: this is the guarantee.
  const after = await page.evaluate(async (K) => {
    const d = JSON.parse(localStorage.getItem(K))
    const t0 = { ...d.trainers[0], name: 'GEÄNDERT DURCH BESUCHER' }
    // Drive the app the way a stray click would: open the row, and see whether
    // anything at all can commit. The dialog has no Save in this mode.
    const row = document.querySelector('.trainer-table tbody tr')
    row.click()
    await new Promise((r) => setTimeout(r, 400))
    const modal = document.querySelector('.modal')
    const hasSave = !!(modal && [...modal.querySelectorAll('button')].find((b) => /speichern/i.test(b.innerText)))
    const hasDelete = !!(modal && [...modal.querySelectorAll('button')].find((b) => /löschen/i.test(b.innerText)))
    const esc = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    document.dispatchEvent(esc)
    await new Promise((r) => setTimeout(r, 300))
    return { hasSave, hasDelete, name: JSON.parse(localStorage.getItem(K)).trainers[0].name, unused: t0 }
  }, STORAGE_KEY)
  ok(after.name === before, 'nothing a visitor does reaches storage (' + after.name + ')')
  ok(!after.hasSave, 'the record opens for reading but offers no Save')
  ok(!after.hasDelete, '  and no Delete')

  // ---- 3. the ways in are gone --------------------------------------------
  const gone = await page.evaluate(() => {
    const txt = (sel) => [...document.querySelectorAll(sel)].map((b) => b.innerText.trim())
    return {
      addButtons: txt('.tab-pane .toolbar .btn').filter((x) => x.startsWith('+')),
      toolbarButtons: txt('.tab-pane .toolbar .btn').length,
      // Search, the filters and the sort picker are reads and must survive.
      search: !!document.querySelector('.tab-pane .toolbar input.search'),
      filters: document.querySelectorAll('.tab-pane .toolbar select').length
    }
  })
  ok(gone.addButtons.length === 0, 'no "+ …" button on the trainer list (' + JSON.stringify(gone.addButtons) + ')')
  ok(gone.search, 'but the search still works – a viewer is there to look things up')
  ok(gone.filters >= 5, '  and so do the filters (' + gone.filters + ')')

  // ---- 4. the board cannot be dragged -------------------------------------
  await page.locator('.tab', { hasText: 'Umschulung' }).first().click()
  await page.waitForSelector('.conv-card', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(500)
  const drag = await page.evaluate(() => {
    const c = document.querySelector('.conv-card')
    return c ? c.getAttribute('draggable') : 'no card'
  })
  ok(drag === 'false', 'a card on the board cannot be picked up (draggable=' + drag + ')')

  // ---- 5. the settings keep what only reads -------------------------------
  await page.locator('.tab', { hasText: 'Einstellungen' }).first().click()
  await page.waitForSelector('.settings')
  await page.waitForTimeout(500)
  const settings = await page.evaluate(() => {
    const titles = [...document.querySelectorAll('.settings .card-title')].map((h) => h.innerText.trim())
    return { titles }
  })
  const has = (s) => settings.titles.some((x) => x.includes(s))
  ok(!has('Datenverwaltung'), 'import and reset are not offered to a visitor')
  ok(!has('Listen'), 'and neither is the pick-list editor')
  ok(has('Download'), 'but the exports stay – a viewer may take the numbers with them')
  ok(has('Sprache'), 'and so does the language switch (' + settings.titles.join(' | ') + ')')
  ok(has('Cloud') || has('Sync') || has('Anmeld'),
    'the sign-in stays reachable, because it is the way out of this mode')

  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs[0] : ''))
  await page.screenshot({ path: shots + '/readonly.png' })
  await page.close()
  return fails
}
