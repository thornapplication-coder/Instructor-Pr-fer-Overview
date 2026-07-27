// Course dates, end to end. `npm test` pins the arithmetic; what only exists
// once it runs is the round trip: create a course in the manager, book somebody
// onto it in the assign dialog, and see the period turn up in the grid, the
// calendar and the seat counter without ever being typed on the person.
import { reporter, STORAGE_KEY } from './harness.mjs'

const RED = 'rgb(179, 18, 44)'

export default async function run(browser, baseUrl, shots) {
  const { ok, fails } = reporter('course dates – book once, read everywhere')
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } })
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e)))

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.waitForSelector('.kpi-hero')
  await page.locator('.tab', { hasText: 'Planung' }).first().click()
  await page.waitForSelector('.planning-table')
  await page.waitForTimeout(400)

  // ---- 1. the manager creates a real record --------------------------------
  await page.locator('.btn', { hasText: 'Kurstermine' }).first().click()
  await page.waitForSelector('.course-man')
  const man = page.locator('.modal')
  ok((await man.innerText()).includes('Noch kein Kurstermin'), 'it starts empty and says so')

  await man.locator('.btn-ghost', { hasText: 'Kurstermin' }).click()
  await page.waitForTimeout(300)
  const row = man.locator('.course-table tbody tr').first()
  ok(await row.locator('select').count() === 2, 'a new row offers course type and provider')

  await row.locator('input[type="date"]').nth(0).fill('2026-03-03')
  await row.locator('input[type="date"]').nth(1).fill('2026-03-20')
  await row.locator('.seat-input').fill('2')
  await page.waitForTimeout(500)

  const stored = await page.evaluate((K) => JSON.parse(localStorage.getItem(K)).courseRuns, STORAGE_KEY)
  ok(stored.length === 1, 'one course date is stored (' + stored.length + ')')
  ok(stored[0].from === '2026-03-03' && stored[0].to === '2026-03-20', 'with the period that was typed')
  ok(stored[0].seats === 2, 'and the seat count')
  ok(!!stored[0]._at, 'and a merge stamp, so another device can reconcile it')
  ok((await row.innerText()).includes('18'), 'the row works out the length itself (18 days)')

  // An end before its start is called out rather than silently counted.
  await row.locator('input[type="date"]').nth(1).fill('2026-03-01')
  await page.waitForTimeout(400)
  ok((await row.innerText()).includes('Ende vor Beginn'), 'an end before its start is named, not counted')
  await row.locator('input[type="date"]').nth(1).fill('2026-03-20')
  await page.waitForTimeout(400)

  await man.locator('.btn-primary', { hasText: 'Schließen' }).click()
  await page.waitForTimeout(400)

  // ---- 2. booking a person onto it -----------------------------------------
  await page.locator('.planning-table .cell-assign').first().click()
  await page.waitForSelector('.assign-block')
  const modal = page.locator('.modal')
  const block = modal.locator('.assign-block').first()
  const picker = block.locator('select').first()
  ok((await picker.locator('option').count()) >= 2, 'the first step offers the new course date')

  const value = await picker.locator('option').nth(1).getAttribute('value')
  await picker.selectOption(value)
  await page.waitForTimeout(500)
  ok((await block.locator('.assign-run').innerText()).includes('03.03.2026'),
    'the dialog shows the scheduled period read back from the course')
  ok((await block.locator('.assign-run').innerText()).includes('18'), 'including its length')

  const booked = await page.evaluate((K) => {
    const d = JSON.parse(localStorage.getItem(K))
    const t = d.trainers.find((x) => Object.values(x.assignments || {}).some((a) => a && a.courseId))
    return t ? Object.values(t.assignments).find((a) => a && a.courseId) : null
  }, STORAGE_KEY)
  ok(!!booked && !!booked.courseId, 'the booking stores only the course id')
  ok(!booked.date && !booked.end, 'and no dates of its own – the period is not copied onto the person')

  // The person's own deviation overrides just that field.
  await block.locator('input[type="date"]').first().fill('2026-03-05')
  await page.waitForTimeout(500)
  ok((await block.innerText()).includes('Weicht vom Kurstermin ab'), 'a personal start is flagged as a deviation')
  await block.locator('.date-clear').first().click()
  await page.waitForTimeout(400)
  ok(!(await block.innerText()).includes('Weicht vom Kurstermin ab'), 'clearing it takes the flag away again')

  await modal.locator('.btn-primary', { hasText: 'Schließen' }).click()
  await page.waitForTimeout(400)

  // ---- 3. the period shows up without having been typed on the person -------
  const cell = page.locator('.planning-table .cell-assign').first()
  ok((await cell.innerText()).includes('03.03.2026'), 'the grid cell carries the course period')
  ok((await cell.innerText()).includes('20.03.2026'), 'from its start to its end')

  await page.locator('.seg-btn', { hasText: 'Kalender' }).first().click()
  await page.waitForSelector('.cal-month')
  await page.waitForTimeout(400)
  const chips = page.locator('.cal-chip')
  ok(await chips.count() >= 1, 'and the calendar places the booking on its start day (' + (await chips.count()) + ')')
  await page.locator('.seg-btn', { hasText: 'Tabelle' }).first().click()
  await page.waitForSelector('.planning-table')

  // ---- 4. seats warn, they do not block ------------------------------------
  // Two seats, three people: fill the same course into three bookings directly.
  await page.evaluate((K) => {
    const d = JSON.parse(localStorage.getItem(K))
    const id = d.courseRuns[0].id
    const step = d.assignmentSteps[0].id
    let n = 0
    d.trainers = d.trainers.map((t) =>
      n++ < 3 ? { ...t, assignments: { ...t.assignments, [step]: { ...(t.assignments?.[step] || {}), courseId: id, status: 'booked' } } } : t
    )
    localStorage.setItem(K, JSON.stringify(d))
  }, STORAGE_KEY)
  await page.reload({ waitUntil: 'networkidle' })
  await page.locator('.tab', { hasText: 'Planung' }).first().click()
  await page.waitForSelector('.planning-table')
  await page.locator('.btn', { hasText: 'Kurstermine' }).first().click()
  await page.waitForSelector('.course-man')
  await page.waitForTimeout(400)

  // At least three: the dialog booking earlier in this run may have landed on a
  // different trainer than the three written straight into storage.
  const count = page.locator('.seat-count').first()
  const booked3 = Number((await count.innerText()).trim())
  ok(booked3 >= 3, 'the booked column counts the people written onto the course (' + booked3 + ')')
  const bg = await count.evaluate((e) => getComputedStyle(e).backgroundColor)
  ok(bg === RED, 'three in two seats is flagged red (' + bg + ')')
  ok(await page.locator('.course-table tbody tr').count() === 1, 'and the entry is still accepted, not refused')
  await page.locator('.modal .btn-primary', { hasText: 'Schließen' }).click()
  await page.waitForTimeout(300)

  // ---- 5. the target duration lives on the course type ---------------------
  await page.locator('.btn', { hasText: 'Spalten bearbeiten' }).first().click()
  await page.waitForSelector('.catman-num')
  await page.locator('.catman-num .input').first().fill('18')
  await page.waitForTimeout(500)
  const steps = await page.evaluate((K) => JSON.parse(localStorage.getItem(K)).assignmentSteps, STORAGE_KEY)
  ok(steps[0].targetDays === 18, 'the target duration is stored on the course type itself (' + steps[0].targetDays + ')')
  await page.locator('.modal .btn-primary', { hasText: 'Schließen' }).click()
  await page.waitForTimeout(300)

  // ---- 6. the booked people still count as provider demand -----------------
  // Without resolving the course, a fully booked plan reads as no demand at all.
  await page.evaluate((K) => {
    const d = JSON.parse(localStorage.getItem(K))
    d.courseRuns = d.courseRuns.map((r) => ({ ...r, providerId: d.providers[0].id }))
    localStorage.setItem(K, JSON.stringify(d))
  }, STORAGE_KEY)
  await page.reload({ waitUntil: 'networkidle' })
  await page.locator('.tab', { hasText: 'Provider' }).first().click()
  const cap = page.locator('.card').filter({ hasText: 'Kapazität & Auslastung' }).first()
  await cap.waitFor()
  await page.waitForTimeout(400)
  // The seed providers carry no slot count, so there is no utilisation BAR to
  // wait for – the assigned column is the figure that matters here.
  const demand = (await cap.locator('td.num.strong').allInnerTexts()).map((x) => Number(x) || 0)
  ok(Math.max(0, ...demand) >= 3,
    'the provider utilisation counts the course bookings (' + demand.join('/') + ')')

  await page.screenshot({ path: shots + '/courses.png', fullPage: false })
  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs[0] : ''))
  await page.close()
  return fails
}
