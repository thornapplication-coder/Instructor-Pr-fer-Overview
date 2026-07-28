// Provider capacity: seats IN TOTAL, overall and per course type, plus the
// month-by-month plan that says when those seats actually fall.
//
// The free-text "Kapazität / Konditionen" field is gone; whatever was typed
// there moves into the notes rather than being deleted. What replaces it is a
// number that can actually be measured against demand - and a breakdown, because
// a provider's total can look comfortable while the one course everybody needs
// is the bottleneck.
//
// The figures used to be a MONTHLY rate. They are totals now: the months are
// not alike ("4 type ratings in November 2026, 2 in December, 6 in March 2027"),
// and one rate per provider could not say that. Dividing demand by an average
// invented capacity in the months that have none.
import { reporter, STORAGE_KEY } from './harness.mjs'

export default async function run(browser, baseUrl, shots) {
  const { ok, fails } = reporter('provider capacity – totals, and the monthly plan')
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
  ok(heads.some((h) => h.trim() === 'PLÄTZE' || h.startsWith('PLÄTZE\n')),
    'the capacity column no longer claims to be a monthly rate (' + heads.join(' | ') + ')')
  ok(!heads.some((h) => h.includes('/ MONAT')), 'and nothing else in the header does either')

  // ---- 2. the dialog takes a total and a breakdown -------------------------
  await page.locator('.data-table tbody tr').first().click()
  await page.waitForSelector('.modal')
  await page.waitForTimeout(400)
  const modal = page.locator('.modal')
  ok((await modal.innerText()).includes('Plätze insgesamt'), 'the overall field is a total')
  ok(!(await modal.innerText()).includes('Plätze / Monat'), 'and the dialog no longer says "/ Monat" anywhere')
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
  // getByLabel with exact, not a substring filter: ".field containing 'Plätze
  // insgesamt'" also matches "Plätze insgesamt je Kursart" and would fill the
  // first course-type box instead, quietly testing nothing.
  await page.getByLabel('Plätze insgesamt', { exact: true }).fill('3')
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
  // Both figures are totals now, so they compare directly: four people against
  // two seats is two seats short, and that IS the flag. Under the old monthly
  // reading the same pair was "two months" and deliberately unflagged - which is
  // the point of re-checking it here rather than deleting the assertion.
  const chip = cap.locator('.type-tag').first()
  const chipText = (await chip.innerText()).trim()
  ok(chipText.includes('/'), 'the chip shows demand against the seats of that course type (' + chipText + ')')
  ok(!/Mon\./.test(chipText), 'and no longer converts it into months (' + chipText + ')')
  ok(chipText.includes('−2'), 'it names the shortfall instead (' + chipText + ')')
  ok(await cap.locator('.type-tag.over').count() >= 1, 'four people against two seats is flagged')

  // Give the provider enough seats and the flag goes. Without this the "flagged"
  // assertion above passes on a chip that is red whatever the numbers say.
  await page.evaluate((K) => {
    const d = JSON.parse(localStorage.getItem(K))
    const step = d.assignmentSteps[0].id
    d.providers = d.providers.map((p) =>
      p.slotsByStep && Object.values(p.slotsByStep).some(Boolean)
        ? { ...p, slots: 40, slotsByStep: { ...p.slotsByStep, [step]: 10 } }
        : p
    )
    localStorage.setItem(K, JSON.stringify(d))
  }, STORAGE_KEY)
  await page.reload({ waitUntil: 'networkidle' })
  await page.locator('.tab', { hasText: 'Provider' }).first().click()
  const cap2 = page.locator('.card').filter({ hasText: 'Kapazität & Auslastung' }).first()
  await cap2.waitFor()
  await page.waitForTimeout(500)
  const chip2 = (await cap2.locator('.type-tag').first().innerText()).trim()
  ok(await cap2.locator('.type-tag.over').count() === 0,
    'four people against ten seats is not flagged (' + chip2 + ')')

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

  // ---- 5. the monthly plan: entering it -----------------------------------
  //
  // The window is pinned to fixed months so the assertions do not drift with
  // the calendar. Left at the default it starts at "the month we are in", and
  // an expectation of "November 2026 is offered" would quietly stop being true.
  await page.evaluate((K) => {
    const d = JSON.parse(localStorage.getItem(K))
    d.capacityFrom = '2026-11'
    d.capacityTo = '2027-12'
    localStorage.setItem(K, JSON.stringify(d))
  }, STORAGE_KEY)
  await page.reload({ waitUntil: 'networkidle' })
  await page.locator('.tab', { hasText: 'Provider' }).first().click()
  await page.waitForSelector('.provider-table')
  await page.waitForTimeout(400)
  await page.locator('.provider-table tbody tr').first().click()
  await page.waitForSelector('.modal')
  await page.waitForTimeout(400)
  const dlg = page.locator('.modal')
  ok((await dlg.innerText()).includes('Zeitleiste'), 'the dialog has a timeline')
  ok((await dlg.locator('.month-table').count()) === 0, 'with no months until one is added')

  const picker = dlg.locator('.month-add select')
  const offered = await picker.locator('option').allInnerTexts()
  ok(offered.length === 15, 'the picker offers every month of the window (' + (offered.length - 1) + ' + placeholder)')
  ok(offered.some((o) => o.includes('Nov') && o.includes('2026')), 'starting at the configured start (' + offered[1] + ')')
  ok(offered[offered.length - 1].includes('2027'), 'and ending at the configured end (' + offered[offered.length - 1] + ')')

  // By value, not by label: the month label is locale-formatted ("Nov 2026" or
  // "Nov. 2026" depending on the ICU build) and matching on it makes the test
  // fail for a reason that has nothing to do with the feature.
  const addMonth = async (value) => {
    await picker.selectOption(value)
    await dlg.locator('.month-add .btn').click()
    await page.waitForTimeout(200)
  }
  await addMonth('2026-11')
  await addMonth('2026-12')
  ok(await dlg.locator('.month-table tbody tr').count() === 2, 'two months, two rows')
  // The month just added must leave the picker, or the same month can be
  // entered twice and only one of the two rows survives the save.
  const stillFree = await picker.locator('option').evaluateAll((os) => os.map((o) => o.value))
  ok(!stillFree.includes('2026-11'), 'a month that is listed drops out of the picker')
  ok(stillFree.includes('2027-03'), '  while the ones not used stay (' + stillFree.length + ' left)')

  // Rows are chronological, so nth(0) is November – no label matching needed.
  // "TUI: 4 type ratings in November 2026, 2 in December" – the user's example.
  const monthRow = (i) => dlg.locator('.month-table tbody tr').nth(i)
  await monthRow(0).locator('.mp-cell input').first().fill('4')
  await monthRow(1).locator('.mp-cell input').first().fill('2')
  await page.waitForTimeout(300)
  ok((await monthRow(0).locator('.mp-sum').innerText()).trim() === '4', 'the row adds itself up')

  // 4 + 2 = 6 type ratings against the 10 set earlier: inside, so no warning.
  ok(!(await dlg.innerText()).includes('verteilt mehr'), 'a plan inside the totals says nothing')
  await monthRow(0).locator('.mp-cell input').first().fill('40')
  await page.waitForTimeout(300)
  ok((await dlg.innerText()).includes('verteilt mehr'), 'a plan over the course-type total is called out')
  ok(await monthRow(0).locator('.mp-cell input').first().isEnabled(),
    'and nothing is disabled – a warning, not a block')
  await monthRow(0).locator('.mp-cell input').first().fill('4')
  await page.waitForTimeout(300)
  ok(!(await dlg.innerText()).includes('verteilt mehr'), '  and the warning goes when the plan fits again')

  await dlg.locator('.btn-primary', { hasText: 'Speichern' }).click()
  await page.waitForTimeout(600)
  const plan = await page.evaluate((K) =>
    JSON.parse(localStorage.getItem(K)).providers.find((p) => p.slotsByMonth && Object.keys(p.slotsByMonth).length),
    STORAGE_KEY)
  ok(!!plan, 'the plan reached storage')
  ok(plan && plan.slotsByMonth['2026-11'] && Object.values(plan.slotsByMonth['2026-11'])[0] === 4,
    'with the month as a key, not a date (' + JSON.stringify(plan && plan.slotsByMonth) + ')')

  // ---- 6. the chart, under the providers ----------------------------------
  //
  // It began as a number table at the bottom of the capacity tab. Measured
  // there it sat 2776px down on a phone - 3.3 screens behind three FTE tables
  // that each become a stack of cards - and was reported as simply missing.
  // It is a chart now, directly under the provider list it describes.
  await page.locator('.tab', { hasText: 'Provider' }).first().click()
  await page.waitForSelector('.prov-months')
  await page.waitForTimeout(500)
  const chart = await page.evaluate(() => {
    const c = document.querySelector('.prov-months')
    const cards = [...document.querySelectorAll('.tab-pane > .card')]
    const capCard = cards.find((x) => (x.querySelector('.card-title') || {}).innerText?.includes('Auslastung'))
    const labels = [...c.querySelectorAll('.hbar-label')].map((l) => l.innerText.trim())
    const vals = [...c.querySelectorAll('.hbar-val')].map((v) => v.innerText.trim())
    const clipped = [...c.querySelectorAll('.hbar-label')].filter((l) => l.scrollWidth > l.clientWidth + 1)
    return {
      top: Math.round(c.getBoundingClientRect().top + window.scrollY),
      beforeCapacity: !!capCard && (c.compareDocumentPosition(capCard) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
      rows: labels.length,
      first: labels[0], last: labels[labels.length - 1],
      firstVal: vals[0],
      segs: c.querySelectorAll('.hbar-seg').length,
      clipped: clipped.length,
      legend: (c.querySelector('.stacked-legend') || {}).innerText?.replace(/\n/g, ' ') || 'none',
      total: (c.querySelector('.card-total') || {}).innerText || ''
    }
  })
  ok(chart.rows === 14, 'one bar per month of the window, empty ones included (' + chart.rows + ')')
  ok(chart.first.includes('Nov'), 'starting at the configured start (' + chart.first + ')')
  ok(chart.last.includes('2027'), 'and ending at the configured end (' + chart.last + ')')
  ok(chart.clipped === 0, 'no month label is clipped by its track (' + chart.clipped + ' clipped)')
  ok(chart.firstVal === '4', 'November carries the four type ratings that were typed (' + chart.firstVal + ')')
  ok(chart.segs === 2, 'only the two months with something get a coloured segment (' + chart.segs + ')')
  ok(chart.legend.includes('Type Rating 6'), 'the legend adds the course type up across months (' + chart.legend + ')')
  ok(chart.total.includes('6'), 'and the card says the overall total (' + chart.total + ')')
  // Placement is the fix, so placement is measured. Directly under the list,
  // ahead of the utilisation card - not at the far end of a long tab.
  ok(chart.beforeCapacity, 'it sits above the utilisation card, not after it')
  ok(chart.top < 700, '  and within reach on a desktop (' + chart.top + 'px down)')

  // The provider picker gives the per-provider view. Picking one with no plan
  // must empty it - otherwise the filter is decoration.
  const emptyProv = await page.evaluate((K) => {
    const d = JSON.parse(localStorage.getItem(K))
    const p = d.providers.find((x) => !x.slotsByMonth || !Object.keys(x.slotsByMonth).length)
    return p ? p.id : ''
  }, STORAGE_KEY)
  const chartCard = page.locator('.prov-months')
  await chartCard.locator('select').selectOption(emptyProv)
  await page.waitForTimeout(400)
  ok(await chartCard.locator('.hbar-seg').count() === 0, 'a provider with no plan shows none of the others\' seats')
  ok((await chartCard.innerText()).includes('noch nichts eingetragen'), '  and says why the chart is gone')
  await chartCard.locator('select').selectOption('')
  await page.waitForTimeout(400)
  ok(await chartCard.locator('.hbar-seg').count() === 2, 'and "all providers" brings it back')

  // ---- 7. the chart on a phone --------------------------------------------
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(500)
  const chartPhone = await page.evaluate(() => {
    const c = document.querySelector('.prov-months')
    const labels = [...c.querySelectorAll('.hbar-label')]
    const r = (el) => el.getBoundingClientRect()
    return {
      clipped: labels.filter((l) => l.scrollWidth > l.clientWidth + 1).length,
      pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
      worstRight: Math.max(...[...c.querySelectorAll('.hbar-row, .hbar-row *')].map((e) => Math.round(r(e).right))),
      cardRight: Math.round(r(c).right),
      top: Math.round(r(c).top + window.scrollY)
    }
  })
  ok(chartPhone.clipped === 0, 'a month label still fits its track on a phone (' + chartPhone.clipped + ' clipped)')
  ok(chartPhone.pageOverflow <= 0, 'and the page does not scroll sideways (' + chartPhone.pageOverflow + ')')
  ok(chartPhone.worstRight <= chartPhone.cardRight + 1, 'nothing paints outside the card')
  ok(chartPhone.top < 1800,
    '  and it is reachable without three screens of scrolling (' + chartPhone.top + 'px down)')
  await page.screenshot({ path: shots + '/prov-months-phone.png' })

  // ---- 8. a reversed window says so instead of drawing nothing ------------
  await page.setViewportSize({ width: 1500, height: 1000 })
  await page.evaluate((K) => {
    const d = JSON.parse(localStorage.getItem(K))
    d.capacityFrom = '2027-12'
    d.capacityTo = '2026-11'
    localStorage.setItem(K, JSON.stringify(d))
  }, STORAGE_KEY)
  await page.reload({ waitUntil: 'networkidle' })
  await page.locator('.tab', { hasText: 'Provider' }).first().click()
  await page.waitForSelector('.prov-months')
  await page.waitForTimeout(600)
  const badWindow = page.locator('.prov-months')
  ok((await badWindow.innerText()).includes('Ende liegt vor dem Anfang'),
    'an end before its start explains itself rather than drawing nothing')
  ok(await badWindow.locator('.hbar-row').count() === 0, 'and draws no bars at all')

  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs[0] : ''))
  await page.close()
  return fails
}
