// The trainer dialog: four things that were wrong on a phone.
//
// 1. Typing pushed Save under the keyboard, so what you typed could not be
//    saved. 2. A new person arrived pre-set to ORE C, which is a claim nobody
//    made. 3. "extern" said nothing about WHICH company. 4. Two kinds of person
//    on the roster had no qualification that fits them.
import { reporter, STORAGE_KEY } from './harness.mjs'

export default async function run(browser, baseUrl, shots) {
  const { ok, fails } = reporter('the trainer dialog – reachable, honest, complete')
  const errs = []

  const open = async (page) => {
    await page.locator('.tab', { hasText: 'Trainer' }).first().click()
    await page.waitForSelector('.trainer-table')
    await page.waitForTimeout(400)
    await page.locator('.toolbar .btn', { hasText: 'Trainer hinzufügen' }).first().click()
    await page.waitForSelector('.modal')
    await page.waitForTimeout(400)
  }

  // ---- 1. Save stays reachable, keyboard or not ----------------------------
  //
  // A short viewport stands in for "the keyboard is up": on iOS the keyboard
  // shrinks neither the layout viewport nor dvh, only visualViewport, which is
  // what the dialog now sizes itself from. 420px is roughly what an iPhone
  // leaves visible with the keyboard open.
  for (const [label, w, h] of [['phone', 390, 844], ['phone with the keyboard up', 390, 420]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } })
    page.on('pageerror', (e) => errs.push(String(e)))
    await page.goto(baseUrl, { waitUntil: 'networkidle' })
    await page.waitForSelector('.kpi-hero')
    await open(page)
    const r = await page.evaluate(() => {
      const m = document.querySelector('.modal')
      const foot = m.querySelector('.modal-foot')
      const head = m.querySelector('.modal-head')
      const save = [...foot.querySelectorAll('button')].find((x) => /speichern/i.test(x.innerText))
      const sr = save.getBoundingClientRect()
      return {
        saveBottom: Math.round(sr.bottom),
        saveTop: Math.round(sr.top),
        headTop: Math.round(head.getBoundingClientRect().top),
        winH: window.innerHeight,
        bodyScrolls: m.querySelector('.modal-body').scrollHeight > m.querySelector('.modal-body').clientHeight
      }
    })
    ok(r.saveBottom <= r.winH + 1 && r.saveTop >= 0,
      label + ': Save is on screen (' + r.saveTop + '–' + r.saveBottom + ' of ' + r.winH + ')')
    // The head must not slide under the status bar clock either.
    ok(r.headTop >= 0, label + ': and the title is not under the status bar (' + r.headTop + ')')
    ok(r.bodyScrolls, label + ': the FIELDS scroll, not the footer with them')
    await page.screenshot({ path: shots + '/trainer-dialog-' + w + 'x' + h + '.png' })
    await page.close()
  }

  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } })
  page.on('pageerror', (e) => errs.push(String(e)))
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.waitForSelector('.kpi-hero')
  await open(page)
  const modal = page.locator('.modal')

  // ---- 2. a new person carries no ORE -------------------------------------
  const ore = modal.locator('.field', { hasText: 'ORE' }).locator('select')
  ok((await ore.inputValue()) === '', 'a new trainer starts without an ORE tier')
  // Counter-check: the field still offers the tiers, it is only unset.
  ok((await ore.locator('option').count()) === 4, '  the tiers are still there to pick (' + (await ore.locator('option').count()) + ')')

  // ---- 4. the two new qualifications, last ---------------------------------
  const qual = modal.locator('.field', { hasText: 'Qualifikation' }).locator('select').first()
  const opts = (await qual.locator('option').allInnerTexts()).map((x) => x.trim()).filter(Boolean)
  ok(opts.includes('No Trainer') && opts.includes('EIS Pilot'),
    'the roster can say "No Trainer" and "EIS Pilot" (' + opts.join(', ') + ')')
  ok(opts.includes('TRE extern') && opts.includes('TRI extern'), '  and "TRE extern" / "TRI extern"')
  // This list IS the ranking: it drives the sort in the table and the row order
  // of every chart, so the order is asserted, not just the membership.
  ok(opts.join('|') === 'SEN|TRE|TRI|LTC|SFI|TKI|TRE extern|TRI extern|No Trainer|EIS Pilot',
    '  in one order: the six grades, the two external ones, then the two that are no grade at all (' +
    opts.join(', ') + ')')

  // ---- 3. an external trainer says which company --------------------------
  const staff = modal.locator('.field', { hasText: 'Zugehörigkeit' }).locator('select')
  ok(!(await modal.innerText()).includes('Firma (extern)'),
    'an internal trainer is not asked which company they are from')
  await staff.selectOption('external')
  await page.waitForTimeout(300)
  ok((await modal.innerText()).includes('Firma (extern)'), 'switching to external asks for the company')
  const co = modal.locator('.field', { hasText: 'Firma (extern)' }).locator('select')
  const coOpts = (await co.locator('option').allInnerTexts()).map((x) => x.trim()).filter(Boolean)
  ok(coOpts.join(',') === 'TUI,SunExpress,Others', 'with the three companies (' + coOpts.join(', ') + ')')

  // And the conversion block goes: asking an external trainer for a phase, a
  // status and a target date would invite numbers that no view anywhere reads.
  ok(!(await modal.innerText()).includes('Zieltermin'),
    'an external trainer is not asked about a conversion at all')
  ok((await modal.locator('.form-sep', { hasText: 'Umschulung' }).count()) === 0,
    '  the whole section is gone, not just disabled')
  await staff.selectOption('internal')
  await page.waitForTimeout(300)
  ok((await modal.innerText()).includes('Zieltermin'), 'back on internal the section returns')
  await staff.selectOption('external')
  await page.waitForTimeout(300)

  // It has to survive the save, and it has to reach the table.
  await modal.locator('.field', { hasText: 'Name' }).first().locator('input').fill('Testperson, Extern')
  await co.selectOption('TUI')
  await page.waitForTimeout(200)
  await modal.locator('.btn-primary', { hasText: 'Speichern' }).click()
  await page.waitForTimeout(600)
  const saved = await page.evaluate((K) =>
    JSON.parse(localStorage.getItem(K)).trainers.find((t) => t.name === 'Testperson, Extern'), STORAGE_KEY)
  ok(saved && saved.extCompany === 'TUI', 'the company reaches storage (' + JSON.stringify(saved && saved.extCompany) + ')')
  ok(saved && saved.ore === '', '  and the ORE stays empty rather than being invented')
  const rowText = await page.locator('.trainer-table tbody tr', { hasText: 'Testperson' }).first().innerText()
  ok(/TUI/.test(rowText), 'and the list shows it beside "extern" (' + rowText.replace(/\n/g, ' ').slice(0, 70) + ')')

  // Switching back to internal keeps the value rather than dropping it, so a
  // mis-click costs nothing.
  await page.locator('.trainer-table tbody tr', { hasText: 'Testperson' }).first().click()
  await page.waitForSelector('.modal')
  await page.waitForTimeout(400)
  await page.locator('.modal .field', { hasText: 'Zugehörigkeit' }).locator('select').selectOption('internal')
  await page.waitForTimeout(250)
  ok(!(await page.locator('.modal').innerText()).includes('Firma (extern)'),
    'back on internal the question disappears again')
  await page.locator('.modal .field', { hasText: 'Zugehörigkeit' }).locator('select').selectOption('external')
  await page.waitForTimeout(250)
  ok((await page.locator('.modal .field', { hasText: 'Firma (extern)' }).locator('select').inputValue()) === 'TUI',
    '  and the company is still there when it comes back')

  // ---- 5. external is visible, and out of the conversion --------------------
  //
  // Two separate promises. Visible: the affiliation column is one of the five
  // that step aside on a card, so "extern" was invisible exactly where it
  // matters most. Out: an external trainer is somebody else's employee, already
  // qualified on the type - we do not convert them, so they take no seat and
  // appear in no conversion figure.
  // The baseline is the pool as it stands NOW: the checks above already added an
  // external trainer on a conversion qualification, so counting "everyone with a
  // conversion qualification" would count somebody who had left the pool before
  // this block started and expect one too many to disappear.
  const counts = await page.evaluate((K) => {
    const d = JSON.parse(localStorage.getItem(K))
    const inPool = d.trainers.filter((t) =>
      ['SEN', 'TRE', 'TRI', 'LTC'].includes(t.qual) && (t.staffType || 'internal') !== 'external')
    const picked = inPool.slice(0, 3).map((t) => t.id)
    d.trainers = d.trainers.map((t) =>
      picked.includes(t.id) ? { ...t, staffType: 'external', extCompany: 'TUI' } : t)
    localStorage.setItem(K, JSON.stringify(d))
    return { pool: inPool.length }
  }, STORAGE_KEY)
  await page.reload({ waitUntil: 'networkidle' })
  // The app restores the open tab from the address, and we are on Trainer here -
  // so wait for something that always exists, then go where the figure lives.
  await page.waitForSelector('.topbar')
  await page.locator('.tab', { hasText: 'Dashboard' }).first().click()
  await page.waitForSelector('.kpi-hero')
  await page.waitForTimeout(700)

  const scope = (await page.locator('.kpi-sub').first().innerText()).trim()
  ok(/ohne externe/.test(scope), 'the dashboard says the pool leaves external out (' + scope + ')')
  const n = Number((scope.match(/von (\d+)/) || [])[1])
  ok(n === counts.pool - 3,
    '  and the figure is three smaller (' + n + ' of ' + counts.pool + ')')

  await page.locator('.tab', { hasText: 'Umschulung' }).first().click()
  await page.waitForSelector('.conv-card', { timeout: 8000 })
  await page.waitForTimeout(600)
  const cards = await page.locator('.conv-card').count()
  ok(cards === counts.pool - 3, 'the board does not put them on it either (' + cards + ')')

  // Planning is entirely about the conversion courses, so they are not there to
  // be booked - leaving them would count as demand against a provider's seats.
  await page.locator('.view-btn, .toolbar button', { hasText: 'Planung' }).first().click().catch(() => {})
  await page.waitForTimeout(700)
  const planNames = await page.locator('.planning-table tbody tr .pl-name').allInnerTexts().catch(() => [])
  if (planNames.length) {
    const extNames = await page.evaluate((K) =>
      JSON.parse(localStorage.getItem(K)).trainers.filter((t) => t.staffType === 'external').map((t) => t.name),
      STORAGE_KEY)
    const leaked = planNames.filter((x) => extNames.some((e) => x.includes(e.split(',')[0])))
    ok(leaked.length === 0, 'and the planning grid has none of them (' + leaked.join(', ') + ')')
  }

  // ---- 5b. the external GRADES are out of the conversion too ----------------
  //
  // Two different ways of being external: the affiliation (staffType) and the
  // qualification itself. Neither belongs in the conversion, and the second one
  // needs no rule of its own - it simply is not a conversion qualification.
  await page.locator('.tab', { hasText: 'Trainer' }).first().click()
  await page.waitForSelector('.trainer-table')
  await page.waitForTimeout(400)
  const before2 = await page.locator('.conv-card').count().catch(() => 0)
  const moved = await page.evaluate((K) => {
    const d = JSON.parse(localStorage.getItem(K))
    const conv = d.trainers.filter((t) => ['SEN', 'TRE', 'TRI', 'LTC'].includes(t.qual) &&
      (t.staffType || 'internal') !== 'external')
    const ids = conv.slice(0, 2).map((t) => t.id)
    d.trainers = d.trainers.map((t) =>
      t.id === ids[0] ? { ...t, qual: 'TREX' } : t.id === ids[1] ? { ...t, qual: 'TRIX' } : t)
    localStorage.setItem(K, JSON.stringify(d))
    return conv.length
  }, STORAGE_KEY)
  await page.reload({ waitUntil: 'networkidle' })
  // The app restores the open tab from the address, and we are on Trainer here -
  // so wait for something that always exists, then go where the figure lives.
  await page.waitForSelector('.topbar')
  await page.locator('.tab', { hasText: 'Dashboard' }).first().click()
  await page.waitForSelector('.kpi-hero')
  await page.waitForTimeout(700)
  const scope2 = (await page.locator('.kpi-sub').first().innerText()).trim()
  const n2 = Number((scope2.match(/von (\d+)/) || [])[1])
  ok(n2 === moved - 2, 'somebody on an external GRADE leaves the pool as well (' + n2 + ' of ' + moved + ')')
  await page.locator('.tab', { hasText: 'Umschulung' }).first().click()
  await page.waitForSelector('.conv-card', { timeout: 8000 })
  await page.waitForTimeout(600)
  ok((await page.locator('.conv-card').count()) === n2, '  and is off the board with them')
  // But they ARE still capacity: the tab that counts heads still lists them.
  await page.locator('.tab', { hasText: 'Kapazität' }).first().click()
  await page.waitForTimeout(800)
  const capKeys = await page.locator('.cap-table tbody .cp-key').allInnerTexts()
  ok(capKeys.some((x) => x.includes('TRE extern')) && capKeys.some((x) => x.includes('TRI extern')),
    'they still count as capacity, in their own rows (' + capKeys.join(', ') + ')')

  // The external GRADES hide it for the same reason, without a rule of their own.
  // Back to the Trainer tab first: the checks above ended on Kapazität, and a
  // row that is not on screen is not a row - the click times out there.
  await page.locator('.tab', { hasText: 'Trainer' }).first().click()
  await page.waitForSelector('.trainer-table tbody tr')
  await page.waitForTimeout(400)
  await page.locator('.trainer-table tbody tr').first().click()
  await page.waitForSelector('.modal')
  await page.waitForTimeout(400)
  const q2 = page.locator('.modal .field', { hasText: 'Qualifikation' }).locator('select').first()
  await q2.selectOption('TRIX')
  await page.waitForTimeout(300)
  ok(!(await page.locator('.modal').innerText()).includes('Zieltermin'),
    'somebody on "TRI extern" is not asked either')
  await q2.selectOption('TRI')
  await page.waitForTimeout(300)
  ok((await page.locator('.modal').innerText()).includes('Zieltermin'),
    '  and a plain TRI still is – so the section is tied to the grade, not removed')
  // Out through the footer, not Escape: the qualification was changed and back,
  // and a dialog with unsaved changes now asks before Escape throws them away.
  await page.locator('.modal .modal-foot .btn-ghost').first().click()
  await page.waitForTimeout(300)

  // ---- 6. and on a phone card you can SEE that somebody is external ---------
  await page.setViewportSize({ width: 390, height: 844 })
  await page.locator('.tab', { hasText: 'Trainer' }).first().click()
  await page.waitForSelector('.trainer-table')
  await page.waitForTimeout(600)
  const badge = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.trainer-table tbody tr')]
    const withBadge = rows.filter((r) => {
      const b = r.querySelector('.ext-badge')
      return b && getComputedStyle(b).display !== 'none'
    })
    const staffCells = rows.filter((r) => {
      const c = r.querySelector('.t-staff')
      return c && getComputedStyle(c).display !== 'none'
    })
    return {
      badges: withBadge.length,
      text: withBadge.length ? withBadge[0].querySelector('.ext-badge').innerText.trim() : '',
      staffColumnShown: staffCells.length
    }
  })
  ok(badge.staffColumnShown === 0, 'the affiliation column is still off the card (that is why the badge exists)')
  // Against the record, not against a literal: the checks above created one
  // external trainer of their own, so "three" was only ever right by accident.
  const externals = await page.evaluate((K) =>
    JSON.parse(localStorage.getItem(K)).trainers.filter((t) => t.staffType === 'external').length, STORAGE_KEY)
  ok(badge.badges === externals,
    'every external person carries a badge on the card (' + badge.badges + ' of ' + externals + ')')
  ok(/extern/i.test(badge.text) && /TUI/.test(badge.text),
    '  saying extern and which company (' + badge.text + ')')

  // Counter-check: on a desktop the badge steps aside, because the column is
  // back and the table has no width to spare for saying it twice.
  await page.setViewportSize({ width: 1500, height: 1000 })
  await page.waitForTimeout(600)
  const onDesktop = await page.evaluate(() => {
    const b = document.querySelector('.trainer-table .ext-badge')
    const w = document.querySelector('.trainer-table').closest('.table-wrap')
    return { shown: b ? getComputedStyle(b).display !== 'none' : 'no badge', hidden: w.scrollWidth - w.clientWidth }
  })
  ok(onDesktop.shown === false, 'on a desktop the badge is hidden again (' + onDesktop.shown + ')')
  ok(onDesktop.hidden === 0, '  and the table still fits (' + onDesktop.hidden + 'px hidden)')

  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs[0] : ''))
  await page.close()
  return fails
}
