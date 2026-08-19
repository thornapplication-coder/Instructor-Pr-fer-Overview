// What an iPhone walkthrough turned up, checked where it actually lives: in
// the rendered app.
//
// Every one of these was invisible to the logic tests. A dialog whose first
// Enter closes it, a filter that has no counter, a view that forgets itself
// when you glance at the dashboard - none of that is a wrong number, it is a
// wrong screen, and only a browser has screens.
import { reporter, STORAGE_KEY } from './harness.mjs'

export default async function run(browser, baseUrl, shots) {
  const { ok, fails } = reporter('the iPhone walkthrough – focus, flags, memory')
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e)))

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.waitForSelector('.kpi-hero')
  await page.waitForTimeout(600)

  // ---- 1. a dialog opens on its content, not on its close button ----------
  await page.locator('.tab', { hasText: 'Trainer' }).first().click()
  await page.waitForSelector('.trainer-table tbody tr')
  await page.waitForTimeout(400)
  await page.locator('.trainer-table tbody tr').first().click()
  await page.waitForSelector('.modal')
  await page.waitForTimeout(500)

  const focused = await page.evaluate(() => {
    const a = document.activeElement
    return {
      tag: a ? a.tagName.toLowerCase() : '',
      cls: a ? a.className : '',
      inBody: !!(a && a.closest('.modal-body')),
      inHead: !!(a && a.closest('.modal-head'))
    }
  })
  ok(focused.inBody, 'the focus lands inside the dialog body (' + focused.tag + '.' + focused.cls + ')')
  ok(!focused.inHead, '  and not on the ✕ in the header, where Enter would shut the dialog again')

  const named = await page.evaluate(() => {
    const h = document.querySelector('.modal')
    const id = h && h.getAttribute('aria-labelledby')
    const el = id ? document.getElementById(id) : null
    return el ? el.textContent.trim() : ''
  })
  ok(named.length > 0, 'and the dialog carries its own title as its name ("' + named + '")')

  // ---- 2. leaving with unsaved changes asks first -------------------------
  const nameInput = page.locator('.modal .form-grid .field').first().locator('input').first()
  await nameInput.fill('ÄNDERUNG OHNE SPEICHERN')
  await page.waitForTimeout(300)

  // Playwright dismisses a confirm() unless told otherwise – i.e. "no, keep
  // the dialog open". That is exactly the case worth checking first.
  let asked = 0
  const onDialog = (d) => { asked += 1; d.dismiss() }
  page.on('dialog', onDialog)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)
  ok(asked === 1, 'Escape on a changed form asks before throwing the typing away')
  ok(await page.locator('.modal').count() === 1, '  and saying no keeps the dialog, with the text still in it')
  ok((await nameInput.inputValue()) === 'ÄNDERUNG OHNE SPEICHERN', '  the typed name survived the question')
  page.off('dialog', onDialog)

  // Say yes this time.
  const onAccept = (d) => d.accept()
  page.on('dialog', onAccept)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)
  ok(await page.locator('.modal').count() === 0, 'saying yes closes it')
  page.off('dialog', onAccept)

  const stored = await page.evaluate((K) => JSON.parse(localStorage.getItem(K)).trainers.some(
    (t) => (t.name || '').includes('ÄNDERUNG OHNE SPEICHERN')), STORAGE_KEY)
  ok(!stored, '  and nothing of the discarded edit reached storage')

  // An UNCHANGED dialog must not ask – a guard that fires on every close is a
  // guard nobody reads after the third time.
  await page.locator('.trainer-table tbody tr').first().click()
  await page.waitForSelector('.modal')
  await page.waitForTimeout(400)
  let asked2 = 0
  const onAny = (d) => { asked2 += 1; d.accept() }
  page.on('dialog', onAny)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)
  ok(asked2 === 0 && await page.locator('.modal').count() === 0,
    'a dialog that was only READ closes without a question')
  page.off('dialog', onAny)

  // ---- 3. the board says how many need looking at, and can show only those --
  await page.locator('.tab', { hasText: 'Umschulung' }).first().click()
  await page.waitForSelector('.conv-card', { timeout: 8000 })
  await page.waitForTimeout(600)

  // Give two people a target date in the past so there is something to flag.
  const flagged = await page.evaluate((K) => {
    const d = JSON.parse(localStorage.getItem(K))
    const conv = d.trainers.filter((t) => ['SEN', 'TRE', 'TRI', 'LTC'].includes(t.qual) &&
      (t.staffType || 'internal') !== 'external')
    const ids = conv.slice(0, 2).map((t) => t.id)
    d.trainers = d.trainers.map((t) =>
      ids.includes(t.id) ? { ...t, conv: { ...(t.conv || {}), stage: 'simulator', target: '2020-01-01' } } : t)
    localStorage.setItem(K, JSON.stringify(d))
    return ids.length
  }, STORAGE_KEY)
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('.conv-card', { timeout: 8000 })
  await page.waitForTimeout(700)

  const pill = page.locator('.alert-pill.overdue')
  ok(await pill.count() === 1, 'the overdue counter appears once there is anything to count')
  ok((await pill.innerText()).includes(String(flagged)),
    '  and it states the number (' + (await pill.innerText()).replace(/\n/g, ' ') + ')')

  const before = await page.locator('.conv-card').count()
  await pill.click()
  await page.waitForTimeout(500)
  const after = await page.locator('.conv-card').count()
  ok(after === flagged && after < before,
    'tapping it leaves only the flagged cards standing (' + after + ' of ' + before + ')')
  ok(await page.locator('.alert-pill.overdue.on').count() === 1, '  and the counter shows it is pressed')
  await pill.click()
  await page.waitForTimeout(500)
  ok(await page.locator('.conv-card').count() === before, 'tapping again brings them all back')

  const tap = await pill.boundingBox()
  ok(tap && tap.height >= 44, 'it is a real touch target on a phone (' + Math.round(tap?.height || 0) + 'px tall)')

  // ---- 4. the view inside "Umschulung" is remembered ----------------------
  await page.locator('.hub-bar .seg-btn', { hasText: 'Planung' }).first().click()
  await page.waitForTimeout(700)
  ok(page.url().includes('/conversion/table'), 'the chosen view is written into the address (' + page.url().split('#')[1] + ')')

  await page.locator('.tab', { hasText: 'Dashboard' }).first().click()
  await page.waitForSelector('.kpi-hero')
  await page.waitForTimeout(500)
  await page.locator('.tab', { hasText: 'Umschulung' }).first().click()
  await page.waitForTimeout(800)
  const stillPlanning = await page.locator('.hub-bar .seg-btn.active').first().innerText()
  ok(/planung/i.test(stillPlanning),
    'a glance at the dashboard and back does not drop you onto the board (' + stillPlanning.trim() + ')')

  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('.hub-bar')
  await page.waitForTimeout(800)
  const afterReload = await page.locator('.hub-bar .seg-btn.active').first().innerText()
  ok(/planung/i.test(afterReload), '  and a reload keeps it too (' + afterReload.trim() + ')')

  // ---- 5. controls a screen reader can name ------------------------------
  await page.locator('.tab', { hasText: 'Provider' }).first().click()
  await page.waitForSelector('.provider-table, .empty-state')
  await page.waitForTimeout(600)
  await page.locator('.provider-table tbody tr').first().click()
  await page.waitForSelector('.modal')
  await page.waitForTimeout(600)

  const nameless = await page.evaluate(() => {
    const out = []
    document.querySelectorAll('.modal select, .modal input:not([type="checkbox"]):not([type="color"])').forEach((el) => {
      const has = el.getAttribute('aria-label') ||
        el.closest('label') ||
        (el.id && document.querySelector('label[for="' + el.id + '"]')) ||
        el.getAttribute('placeholder')
      if (!has) out.push(el.className + ':' + el.tagName)
    })
    return out
  })
  ok(nameless.length === 0, 'every control in the provider dialog has a name (' + (nameless.join(', ') || 'none nameless') + ')')

  // The ✕ of the dialog itself says what it does, in the interface language.
  const closeLabel = await page.locator('.modal .modal-head .icon-btn').first().getAttribute('aria-label')
  ok(closeLabel === 'Schließen', 'the close button is named in German ("' + closeLabel + '")')
  await page.locator('.modal .modal-foot .btn-ghost').first().click()
  await page.waitForTimeout(400)

  // ---- 6. an empty result says WHY it is empty ---------------------------
  await page.locator('.tab', { hasText: 'Trainer' }).first().click()
  await page.waitForSelector('.trainer-table')
  await page.waitForTimeout(500)
  await page.locator('.toolbar .search').first().fill('ZZZ-GIBT-ES-NICHT')
  await page.waitForTimeout(600)
  const emptyText = await page.locator('.trainer-table .empty-row').first().innerText()
  ok(/filter/i.test(emptyText), 'an empty result blames the filter, not the roster ("' + emptyText.split('\n')[0] + '")')
  const reset = page.locator('.trainer-table .empty-row button')
  ok(await reset.count() === 1, '  and offers the way out')
  await reset.click()
  await page.waitForTimeout(600)
  ok(await page.locator('.trainer-table tbody tr').count() > 1, '  which brings everybody back')

  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs[0] : ''))
  await page.screenshot({ path: shots + '/uxfixes-board.png' })
  await page.close()
  return fails
}
