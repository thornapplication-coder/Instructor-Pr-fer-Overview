// Provider capacity: seats PER MONTH, overall and per course type.
//
// The free-text "Kapazität / Konditionen" field is gone; whatever was typed
// there moves into the notes rather than being deleted. What replaces it is a
// number that can actually be measured against demand - and a breakdown, because
// a provider's total can look comfortable while the one course everybody needs
// is the bottleneck.
import { reporter, STORAGE_KEY } from './harness.mjs'

export default async function run(browser, baseUrl, shots) {
  const { ok, fails } = reporter('provider capacity – per month, per course type')
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } })
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e)))

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.waitForSelector('.kpi-hero')

  // ---- 1. the free-text field is gone, its content is not ------------------
  await page.evaluate((K) => {
    const d = JSON.parse(localStorage.getItem(K))
    d._capNotes = false
    d.providers = d.providers.map((p, i) => (i === 0 ? { ...p, capacity: '8 Slots pro Quartal, Preis auf Anfrage', notes: '' } : p))
    localStorage.setItem(K, JSON.stringify(d))
  }, STORAGE_KEY)
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  const migrated = await page.evaluate((K) => JSON.parse(localStorage.getItem(K)).providers[0], STORAGE_KEY)
  ok(!migrated.capacity, 'the free-text capacity field is gone from the record')
  ok((migrated.notes || '').includes('8 Slots pro Quartal'),
    'and what was typed in it moved into the notes rather than being deleted (' + migrated.notes + ')')

  await page.locator('.tab', { hasText: 'Provider' }).first().click()
  await page.waitForSelector('.data-table')
  await page.waitForTimeout(400)
  const heads = (await page.locator('.data-table th').allInnerTexts()).map((x) => x.trim().toUpperCase())
  ok(!heads.some((h) => h.includes('KONDITIONEN')), 'and the column is gone from the table (' + heads.join(' | ') + ')')
  ok(heads.some((h) => h.includes('PLÄTZE / MONAT')), 'the capacity column says per month (' + heads.join(' | ') + ')')

  // ---- 2. the dialog takes a total and a breakdown -------------------------
  await page.locator('.data-table tbody tr').first().click()
  await page.waitForSelector('.modal')
  await page.waitForTimeout(400)
  const modal = page.locator('.modal')
  ok((await modal.innerText()).includes('Plätze / Monat (gesamt)'), 'the overall field says per month')
  const cells = modal.locator('.slot-cell')
  ok(await cells.count() >= 4, 'one field per course type (' + (await cells.count()) + ')')
  const labels = (await cells.locator('.slot-name').allInnerTexts()).map((x) => x.trim())
  ok(labels.includes('Type Rating') && labels.includes('TRI-Kurs'),
    'named after the planning steps, so demand and capacity are the same thing (' + labels.join(', ') + ')')

  await cells.nth(0).locator('input').fill('2')
  await cells.nth(1).locator('input').fill('5')
  await page.waitForTimeout(300)
  ok((await modal.innerText()).includes('ergibt 7'), 'the dialog adds the breakdown up for you')
  await modal.locator('.btn-primary', { hasText: 'Speichern' }).click()
  await page.waitForTimeout(600)

  const saved = await page.evaluate((K) => JSON.parse(localStorage.getItem(K)).providers.find((p) => p.slotsByStep && Object.values(p.slotsByStep).some(Boolean)), STORAGE_KEY)
  ok(!!saved, 'the breakdown reached storage')
  ok(Object.values(saved.slotsByStep).filter(Boolean).length === 2,
    'with one entry per course type that was filled in (' + JSON.stringify(saved.slotsByStep) + ')')

  // ---- 3. a breakdown over the total warns, it does not block --------------
  await page.locator('.data-table tbody tr').first().click()
  await page.waitForSelector('.modal')
  await page.waitForTimeout(400)
  await page.locator('.modal .field', { hasText: 'Plätze / Monat (gesamt)' }).locator('input').fill('3')
  await page.waitForTimeout(400)
  ok((await page.locator('.modal').innerText()).includes('übersteigt die Gesamtkapazität'),
    'a breakdown promising more than the total is called out')
  ok(await page.locator('.modal .slot-cell input').first().isEnabled(), 'and nothing is disabled – it is a warning, not a block')
  await page.locator('.modal .btn-primary', { hasText: 'Speichern' }).click()
  await page.waitForTimeout(600)

  // ---- 4. demand meets capacity per course type ---------------------------
  await page.evaluate((K) => {
    const d = JSON.parse(localStorage.getItem(K))
    const pid = d.providers.find((p) => p.slotsByStep && Object.values(p.slotsByStep).some(Boolean)).id
    const step = d.assignmentSteps[0].id
    let n = 0
    d.trainers = d.trainers.map((t) =>
      n++ < 4 ? { ...t, assignments: { ...t.assignments, [step]: { ...(t.assignments?.[step] || {}), providerId: pid, status: 'booked' } } } : t
    )
    localStorage.setItem(K, JSON.stringify(d))
  }, STORAGE_KEY)
  await page.reload({ waitUntil: 'networkidle' })
  await page.locator('.tab', { hasText: 'Provider' }).first().click()
  const cap = page.locator('.card').filter({ hasText: 'Kapazität & Auslastung' }).first()
  await cap.waitFor()
  await page.waitForTimeout(500)
  // Demand is the whole open backlog and the seats are a MONTHLY figure, so the
  // chip reads as months. Four people against two seats a month is two months –
  // normal for a phase-in, and deliberately NOT flagged: flagging "more than one
  // month" would put a red mark on every provider forever.
  const chip = cap.locator('.type-tag').first()
  const chipText = (await chip.innerText()).trim()
  ok(chipText.includes('/'), 'the chip shows demand against seats per month (' + chipText + ')')
  ok(/\d+\s*Mon\./.test(chipText), 'and how many months that backlog needs (' + chipText + ')')
  ok(await cap.locator('.type-tag.over').count() === 0, 'a two-month backlog is not flagged red')

  // Raise the backlog past three months and it is.
  await page.evaluate((K) => {
    const d = JSON.parse(localStorage.getItem(K))
    const p = d.providers.find((x) => x.slotsByStep && Object.values(x.slotsByStep).some(Boolean))
    const step = d.assignmentSteps[0].id
    let n = 0
    d.trainers = d.trainers.map((t) =>
      n++ < 20 ? { ...t, assignments: { ...t.assignments, [step]: { ...(t.assignments?.[step] || {}), providerId: p.id, status: 'booked' } } } : t
    )
    localStorage.setItem(K, JSON.stringify(d))
  }, STORAGE_KEY)
  await page.reload({ waitUntil: 'networkidle' })
  await page.locator('.tab', { hasText: 'Provider' }).first().click()
  const cap2 = page.locator('.card').filter({ hasText: 'Kapazität & Auslastung' }).first()
  await cap2.waitFor()
  await page.waitForTimeout(500)
  ok(await cap2.locator('.type-tag.over').count() >= 1,
    'twenty people against two seats a month is flagged (' + (await cap2.locator('.type-tag.over').first().innerText()).trim() + ')')

  await cap.screenshot({ path: shots + '/prov-capacity.png' })


  // ---- the provider tables on a phone --------------------------------------
  // These two fit from ~770px, so nothing was hidden. What made them unusable
  // was the course chips: a sixth of a phone screen broke "Type Rating + Base
  // Training" over four lines and grew one provider taller than the display.
  // The card gives the chip lists the whole width, so the chip is one line.
  //
  // The status is deliberately a LONG, user-named one. The short seeded label
  // ('no agreement') cannot exercise any of this: the bug being guarded here
  // is a wide status chip stealing width from the row below it, and a bug the
  // fix introduced is a chip too wide for its own half painting over the name.
  const LONG_STATUS = 'Rahmenvertrag in Verhandlung seit 2026'
  await page.evaluate(([K, long]) => {
    const d = JSON.parse(localStorage.getItem(K))
    d.providerStatus = [...d.providerStatus, { id: 'long', label: long, color: '#b3122c' }]
    d.providers = d.providers.map((p, i) =>
      i === 0
        ? { ...p, courses: ['SIM only', 'Type Rating + Base Training', 'Type Rating + ZFTT'],
            simVersions: ['MAX'], locations: ['BCN'], status: 'long', contactPerson: 'Marta Ruiz',
            // No break opportunity of its own: the cell has to break it or the
            // card hands `.table-wrap` back the sideways scroll. Measured: this
            // address hides 47px without the wrap rule and 0 with it, so the
            // overflow assertion below is what guards it.
            email: 'flightcrewtrainingdepartment.scheduling@aviationtrainingcentre-international-group.example' }
        : p
    )
    localStorage.setItem(K, JSON.stringify(d))
  }, [STORAGE_KEY, LONG_STATUS])
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('.provider-table')
  await page.waitForTimeout(500)

  const phone = await page.evaluate(() => {
    const t = document.querySelector('.provider-table')
    const capT = document.querySelector('.provider-cap-table')
    if (!t || !capT) return { error: 'a provider table is missing' }
    const row = [...t.querySelectorAll('tbody tr')]
      .find((r) => r.querySelectorAll('.pv-courses .type-tag').length >= 3)
    const capRow = capT.querySelector('tbody tr')
    if (!row || !capRow) return { error: 'no seeded provider row / no capacity row' }
    const wrap = t.closest('.table-wrap')
    const capWrap = capT.closest('.table-wrap')
    const r = (el) => el.getBoundingClientRect()
    const cell = (root, sel) => { const e = root.querySelector(sel); return e ? r(e) : null }
    const chips = [...row.querySelectorAll('.pv-courses .type-tag')]
    const statusChip = row.querySelector('.pv-status > span')
    const name = cell(row, '.pv-name')
    const courses = cell(row, '.pv-courses')
    // An empty provider: the card draws its heading whether or not the list
    // has anything in it, so the empty case has to say so.
    const emptyRow = [...t.querySelectorAll('tbody tr')]
      .find((x) => x.querySelectorAll('.pv-courses .type-tag').length === 0)
    return {
      hidden: wrap.scrollWidth - wrap.clientWidth,
      capHidden: capWrap.scrollWidth - capWrap.clientWidth,
      pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
      rowHeight: Math.round(r(row).height),
      tallestChip: Math.max(...chips.map((c) => Math.round(r(c).height))),
      // The chip cannot shrink (nowrap) and is pinned to the end of its track,
      // so when it is too wide it overflows LEFT, across the name beside it.
      chipClearsName: Math.round(r(statusChip).left - name.right),
      // The whole point: the chip list gets the card's width, not a column of it.
      coursesShare: courses.width / (r(row).width - 24),
      // Placement, not just visibility: each field on the row it belongs to.
      // Centres, not tops: both sit `align-self: center` on the head line, and
      // a status long enough to wrap makes the chip taller than the name.
      nameMid: Math.round(name.top + name.height / 2),
      statusMid: Math.round(r(statusChip).top + r(statusChip).height / 2),
      rows: {
        name: Math.round(name.top), status: Math.round(r(statusChip).top),
        loc: Math.round(cell(row, '.pv-loc').top), sim: Math.round(cell(row, '.pv-sim').top),
        courses: Math.round(courses.top), contact: Math.round(cell(row, '.pv-contact').top)
      },
      capRows: {
        name: Math.round(cell(capRow, '.pc-name').top),
        assigned: Math.round(cell(capRow, '.pc-assigned').top),
        slots: Math.round(cell(capRow, '.pc-slots').top),
        courses: Math.round(cell(capRow, '.pc-courses').top)
      },
      capAssignedLeft: Math.round(cell(capRow, '.pc-assigned').left),
      capSlotsLeft: Math.round(cell(capRow, '.pc-slots').left),
      emptyCourses: emptyRow ? emptyRow.querySelector('.pv-courses').innerText.trim() : null,
      emptyLoc: emptyRow ? emptyRow.querySelector('.pv-loc').innerText.trim() : null,
      // Everything the card can paint, chips included – td boxes alone miss a
      // chip that overflows its own cell.
      worstRight: Math.max(...[...row.querySelectorAll('td, td *')].map((e) => Math.round(r(e).right))),
      worstLeft: Math.min(...[...row.querySelectorAll('td, td *')].map((e) => Math.round(r(e).left))),
      cardLeft: Math.round(r(row).left), cardRight: Math.round(r(row).right)
    }
  })
  ok(!phone.error, 'the seeded provider card is on screen' + (phone.error ? ': ' + phone.error : ''))
  if (!phone.error) {
    // Also the guard for the unbreakable e-mail: without the wrap rule this
    // one goes to 47 and the card is back to scrolling sideways.
    ok(phone.hidden <= 1 && phone.capHidden <= 1,
      'nothing hides behind a sideways scroll, a long e-mail included (' +
      phone.hidden + ' / ' + phone.capHidden + ')')
    ok(phone.pageOverflow <= 0, 'and the page does not scroll sideways (' + phone.pageOverflow + ')')
    ok(phone.tallestChip <= 24, 'a long course name sits on ONE line, not four (' + phone.tallestChip + 'px tall)')
    ok(phone.coursesShare > 0.9,
      'because the chip list gets the whole card width (' + Math.round(phone.coursesShare * 100) + '%)')
    ok(phone.rowHeight < 300, 'so a provider with three courses fits a phone screen (' + phone.rowHeight + 'px)')
    // Placement: name and status share the head line, then locations and SIM,
    // then the courses, then the contact. A mistyped grid-area shows up here.
    ok(Math.abs(phone.nameMid - phone.statusMid) <= 4,
      'name and status share the head line (' + phone.nameMid + ' vs ' + phone.statusMid + ')')
    ok(phone.rows.loc > phone.rows.name && phone.rows.loc === phone.rows.sim,
      'locations and SIM version share the next one')
    ok(phone.rows.courses > phone.rows.loc && phone.rows.contact > phone.rows.courses,
      'then the courses, then the contact')
    ok(phone.capRows.assigned > phone.capRows.name && phone.capRows.assigned === phone.capRows.slots &&
       phone.capRows.courses > phone.capRows.assigned,
      'the capacity card follows the same shape (name / assigned+slots / courses)')
    ok(phone.capSlotsLeft > phone.capAssignedLeft,
      '  with the two figures beside each other (' + phone.capAssignedLeft + ' vs ' + phone.capSlotsLeft + ')')
    // The two bugs a long, user-named status can cause.
    ok(phone.chipClearsName >= 0,
      'a long status chip stays clear of the provider name (' + phone.chipClearsName + 'px)')
    ok(phone.worstRight <= phone.cardRight + 1 && phone.worstLeft >= phone.cardLeft - 1,
      'nothing – chips included – paints outside the card (' + phone.worstLeft + '..' + phone.worstRight +
      ' in ' + phone.cardLeft + '..' + phone.cardRight + ')')
    ok(phone.emptyCourses === '–' && phone.emptyLoc === '–',
      'a provider with no courses says so rather than leaving a heading over blank space (' +
      JSON.stringify([phone.emptyCourses, phone.emptyLoc]) + ')')
  }
  await page.screenshot({ path: shots + '/prov-phone.png' })

  // The status chip must not set the width of the fields below it – that is
  // what truncated "STANDORTE (ICAO)" to "STANDORTE (ICA…" on one card only.
  // Measured by widening the status and re-reading the column, because the
  // clipping itself is a paint effect: the computed ::before content is the
  // full string either way.
  const widthWithLongStatus = await page.evaluate(() =>
    Math.round(document.querySelector('.provider-table .pv-loc').getBoundingClientRect().width))
  await page.evaluate((K) => {
    const d = JSON.parse(localStorage.getItem(K))
    d.providers = d.providers.map((p, i) => (i === 0 ? { ...p, status: 'in use' } : p))
    localStorage.setItem(K, JSON.stringify(d))
  }, STORAGE_KEY)
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('.provider-table')
  await page.waitForTimeout(400)
  const widthWithShortStatus = await page.evaluate(() =>
    Math.round(document.querySelector('.provider-table .pv-loc').getBoundingClientRect().width))
  ok(widthWithLongStatus === widthWithShortStatus,
    'the status length does not change the width of the fields below it (' +
    widthWithLongStatus + ' vs ' + widthWithShortStatus + 'px)')

  // A4 portrait is ~794 CSS px, i.e. inside the card breakpoint. Without
  // `screen and` on those media queries a Ctrl+P prints cards with no header.
  await page.emulateMedia({ media: 'print' })
  await page.waitForTimeout(300)
  const printed = await page.evaluate(() => ({
    provider: getComputedStyle(document.querySelector('.provider-table')).display,
    head: document.querySelector('.provider-table thead')
      ? getComputedStyle(document.querySelector('.provider-table thead')).display : 'missing'
  }))
  ok(printed.provider === 'table' && printed.head !== 'none',
    'printing gives the real table with its header row, not a stack of cards (' +
    printed.provider + ' / ' + printed.head + ')')
  await page.emulateMedia({ media: 'screen' })

  await page.setViewportSize({ width: 1500, height: 1000 })
  await page.waitForTimeout(400)
  const back = await page.evaluate(() => getComputedStyle(document.querySelector('.provider-table')).display)
  ok(back === 'table', 'and a desktop keeps the real table (' + back + ')')

  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs[0] : ''))
  await page.close()
  return fails
}
