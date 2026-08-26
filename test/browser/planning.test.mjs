// The Planning tab's assign dialog.
//
// Opening it used to blank the entire app: PlanningModal is a SIBLING of
// Planning(), not nested inside it, so the `tint` defined in Planning() was
// simply not in scope – a ReferenceError on first render, which React answers
// by unmounting the whole tree. No error message, just a white page.
//
// The tab had no browser coverage at all, which is how a crash on its primary
// action shipped. This drives the real thing: open, assign, save, reopen.
import { reporter, STORAGE_KEY } from './harness.mjs'

export default async function run(browser, baseUrl, shots) {
  const { ok, fails } = reporter('planning – the assign dialog opens and saves')
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e)))

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.waitForSelector('.kpi-hero')
  // ---- 0. one tab, three views --------------------------------------------
  // Board, grid and calendar describe the same journey of the same person, so
  // they live behind one tab now. Planung is a view, not a tab of its own.
  const tabs = await page.locator('.tab').allInnerTexts()
  ok(!tabs.some((x) => x.trim() === 'Planung'), 'Planung is no longer a tab of its own (' + tabs.join(' | ') + ')')
  await page.locator('.tab', { hasText: 'Umschulung' }).first().click()
  await page.waitForSelector('.hub-bar')
  const views = await page.locator('.hub-bar .seg-btn').allInnerTexts()
  ok(views.join('/') === 'Board/Planung/Kalender', 'the tab offers three views (' + views.join(' | ') + ')')
  ok(await page.locator('.board-col').count() > 0, 'and opens on the board')
  // Unsorted the cards came out in storage order, so finding somebody on a
  // fifty-card column meant reading every card.
  const names = (await page.locator('.board-col').first().locator('.conv-name').allInnerTexts()).map((x) => x.trim())
  const sorted = [...names].sort((a, b) => a.localeCompare(b))
  ok(names.length > 3, 'the first column holds a stack of cards (' + names.length + ')')
  ok(names.join('|') === sorted.join('|'),
    'and they are in alphabetical order (' + names.slice(0, 3).join(', ') + ' …)')
  ok(await page.locator('.pane-title').count() === 1, 'exactly one title, not one per view (' + (await page.locator('.pane-title').count()) + ')')

  await page.locator('.hub-bar .seg-btn', { hasText: 'Planung' }).click()
  await page.waitForSelector('.planning-table')
  await page.waitForTimeout(500)
  ok(await page.locator('.board-col').count() === 0, 'switching to Planung puts the board away')
  ok(await page.locator('.pane-title').count() === 1, 'and the grid does not add a second title')

  await page.locator('.hub-bar .seg-btn', { hasText: 'Kalender' }).click()
  await page.waitForSelector('.cal-card, .card')
  await page.waitForTimeout(400)
  ok(await page.locator('.planning-table').count() === 0, 'the calendar view drops the grid')
  await page.locator('.hub-bar .seg-btn', { hasText: 'Planung' }).click()
  await page.waitForSelector('.planning-table')
  await page.waitForTimeout(400)

  // ---- 1. it opens at all --------------------------------------------------
  const chips = page.locator('.planning-table').getByText('zuweisen')
  ok(await chips.count() > 0, 'the grid offers assign chips (' + (await chips.count()) + ')')
  await chips.first().click()
  await page.waitForTimeout(800)

  // The regression was a blank page, so check the app is still standing before
  // checking the dialog – "no modal" and "no app" are different faults.
  ok((await page.locator('.topbar').count()) === 1, 'the app is still rendered (not a white screen)')
  ok((await page.locator('.modal').count()) === 1, 'and the assign dialog is open')
  ok(errs.length === 0, 'opening it raises no page error' + (errs.length ? ': ' + errs[0] : ''))

  const modal = page.locator('.modal')
  const blocks = modal.locator('.assign-block')
  ok(await blocks.count() >= 4, 'one block per planning step (' + (await blocks.count()) + ')')
  // The crash was in the coloured left border of these blocks.
  const border = await blocks.first().evaluate((e) => getComputedStyle(e).borderLeftColor)
  ok(/^rgb/.test(border), 'each block carries its step colour (' + border + ')')

  // ---- 2. an assignment can actually be made -------------------------------
  // Located by its label, not by position: the course-date picker is now the
  // first select in the block, and with no course dates set up it has exactly
  // one option – which used to make this read as "no providers".
  const firstBlock = blocks.first()
  const provider = firstBlock.locator('.field', { hasText: 'Provider' }).locator('select').first()
  const options = await provider.locator('option').count()
  ok(options > 1, 'the provider list is populated (' + options + ' options)')
  const value = await provider.locator('option').nth(1).getAttribute('value')
  await provider.selectOption(value)
  await page.waitForTimeout(400)

  // A date, through the shared clearable field.
  const date = firstBlock.locator('input[type="date"]').first()
  await date.fill('2026-09-15')
  await page.waitForTimeout(600)

  const stored = await page.evaluate((KEY) => {
    const d = JSON.parse(localStorage.getItem(KEY))
    const t = d.trainers.find((x) => Object.values(x.assignments || {}).some((a) => a && a.providerId))
    if (!t) return null
    const step = Object.entries(t.assignments).find(([, a]) => a && a.providerId)
    return { id: t.id, providerId: step[1].providerId, date: step[1].date }
  }, STORAGE_KEY)
  ok(stored && stored.providerId, 'the provider reached storage (' + (stored && stored.providerId) + ')')
  ok(stored && stored.date === '2026-09-15', 'and so did the date (' + (stored && stored.date) + ')')

  // ---- 3. it survives a close/reopen ---------------------------------------
  await modal.locator('.icon-btn').first().click()
  await page.waitForTimeout(400)
  ok((await page.locator('.modal').count()) === 0, 'the dialog closes')
  // The cell now shows the provider instead of "+ zuweisen".
  const filled = await page.locator('.planning-table').getByText('zuweisen').count()
  ok(filled < (await chips.count()) + 1, 'the assigned cell no longer offers "+ zuweisen"')

  await page.locator('.planning-table .link-btn').first().click()
  await page.waitForSelector('.modal')
  await page.waitForTimeout(500)
  ok((await page.locator('.modal').count()) === 1, 'and reopens from the name without crashing')

  // ---- the planning grid on a phone and a tablet ---------------------------
  // Six columns want 888px, so below 1000px this was three quarters of the
  // grid behind a sideways scroll — on the view the bookings are made in.
  // Unlike the other lists this one is a matrix, so the card is the person and
  // every course step is one labelled line inside it.
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(500)
  const card = await page.evaluate(() => {
    const t = document.querySelector('.planning-table')
    if (!t) return { error: 'no planning table' }
    const wrap = t.closest('.table-wrap')
    const row = t.querySelector('tbody tr')
    if (!row) return { error: 'no row' }
    const r = (el) => el.getBoundingClientRect()
    const steps = [...row.querySelectorAll('.pl-step')]
    const name = row.querySelector('.pl-name')
    const staff = row.querySelector('.pl-staff')
    const all = [...row.querySelectorAll('td, td *')]
    return {
      hidden: wrap.scrollWidth - wrap.clientWidth,
      pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
      stepCount: steps.length,
      // Every step on its own line, in the order the header row had them.
      oneStepPerLine: steps.every((s, i) => i === 0 || Math.round(r(s).top) > Math.round(r(steps[i - 1]).top)),
      stepsFullWidth: steps.every((s) => r(s).width > r(row).width - 40),
      nameMid: Math.round(r(name).top + r(name).height / 2),
      staffMid: Math.round(r(staff).top + r(staff).height / 2),
      firstStepTop: Math.round(r(steps[0]).top),
      nameTop: Math.round(r(name).top),
      // Each step keeps the heading the column had.
      headings: steps.map((s) => getComputedStyle(s, '::before').content).filter((c) => c && c !== 'none').length,
      worstRight: Math.max(...all.map((e) => Math.round(r(e).right))),
      cardRight: Math.round(r(row).right)
    }
  })
  ok(!card.error, 'the planning card renders' + (card.error ? ': ' + card.error : ''))
  if (!card.error) {
    ok(card.hidden <= 1, 'nothing hides behind a sideways scroll (' + card.hidden + ')')
    ok(card.pageOverflow <= 0, 'and the page does not scroll sideways (' + card.pageOverflow + ')')
    ok(card.stepCount >= 4, 'every course step is on the card (' + card.stepCount + ')')
    ok(card.oneStepPerLine && card.stepsFullWidth,
      'each booking gets a line of its own, full width – "provider · from – to" does not survive being halved')
    ok(card.headings === card.stepCount, 'and each carries its step name as a heading (' + card.headings + ')')
    ok(Math.abs(card.nameMid - card.staffMid) <= 6, 'name and intern/extern share the head line')
    ok(card.firstStepTop > card.nameTop, 'with the bookings below it')
    ok(card.worstRight <= card.cardRight + 1, 'nothing paints outside the card')
  }
  // A tablet has room for two bookings side by side, which halves the height.
  await page.setViewportSize({ width: 768, height: 1024 })
  await page.waitForTimeout(500)
  const tablet = await page.evaluate(() => {
    const row = document.querySelector('.planning-table tbody tr')
    const steps = [...row.querySelectorAll('.pl-step')]
    const r = (el) => el.getBoundingClientRect()
    return { pairs: Math.round(r(steps[0]).top) === Math.round(r(steps[1]).top),
             height: Math.round(r(row).height) }
  })
  ok(tablet.pairs, 'on a tablet two bookings sit side by side (' + tablet.height + 'px tall)')
  await page.setViewportSize({ width: 1400, height: 1000 })
  await page.waitForTimeout(400)
  const wide = await page.evaluate(() => ({
    display: getComputedStyle(document.querySelector('.planning-table')).display,
    hidden: (() => { const w = document.querySelector('.planning-table').closest('.table-wrap')
                     return w.scrollWidth - w.clientWidth })()
  }))
  ok(wide.display === 'table' && wide.hidden === 0,
    'and a desktop keeps the real grid (' + wide.display + ', ' + wide.hidden + 'px hidden)')

  // ---- the course-date editor ---------------------------------------------
  // Nine columns of form controls wanting 818px in a dialog capped at 720px:
  // seats, booked and the delete button were behind a sideways scroll at every
  // window size, desktop included. The dialog is wider now, and below ~900px
  // the row is a stacked form.
  await page.locator('.btn-ghost', { hasText: 'Kurstermine' }).first().click()
  await page.waitForSelector('.course-table')
  await page.waitForTimeout(400)
  // Add one through the button rather than seeding storage: without a row the
  // checks below would pass on nothing, which is how the first cut of this
  // reported a reachable delete button that did not exist.
  if (await page.locator('.course-table tbody tr:not(:has(.empty-row))').count() === 0) {
    await page.locator('.btn-ghost', { hasText: 'Kurstermin' }).last().click()
    await page.waitForTimeout(500)
  }
  ok(await page.locator('.course-table tbody .cr-del button').count() >= 1,
    'the course-date dialog has a row to measure')
  const deskCourses = await page.evaluate(() => {
    const w = document.querySelector('.course-table').closest('.table-wrap')
    const del = document.querySelector('.course-table tbody .cr-del button')
    return { hidden: w.scrollWidth - w.clientWidth,
             delRight: del ? Math.round(del.getBoundingClientRect().right) : null,
             wrapRight: Math.round(w.getBoundingClientRect().right) }
  })
  ok(deskCourses.hidden === 0, 'on a desktop the course-date table fits its dialog (' + deskCourses.hidden + 'px hidden)')
  ok(deskCourses.delRight !== null && deskCourses.delRight <= deskCourses.wrapRight + 1,
    '  so the delete button is reachable without swiping (' + deskCourses.delRight + ' <= ' + deskCourses.wrapRight + ')')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(500)
  const phoneCourses = await page.evaluate(() => {
    const t = document.querySelector('.course-table')
    const w = t.closest('.table-wrap')
    const row = [...t.querySelectorAll('tbody tr')].find((x) => x.querySelector('.cr-del button'))
    if (!row) return { hidden: w.scrollWidth - w.clientWidth, empty: true }
    const del = row.querySelector('.cr-del button').getBoundingClientRect()
    const fromEl = row.querySelector('.cr-from input')
    return { hidden: w.scrollWidth - w.clientWidth, empty: false,
             delReachable: del.width > 0 && del.right <= window.innerWidth,
             dateWidth: fromEl ? Math.round(fromEl.getBoundingClientRect().width) : 0 }
  })
  ok(phoneCourses.hidden <= 1, 'and on a phone nothing hides either (' + phoneCourses.hidden + ')')
  ok(!phoneCourses.empty, '  with the row still there at phone width')
  if (!phoneCourses.empty) {
    ok(phoneCourses.delReachable, '  the delete button is on the screen')
    // 92px is what half a phone gives it, and the browser then clips the date
    // itself to "09/01/" – the value, not just the padding.
    ok(phoneCourses.dateWidth >= 160, '  and a date field is wide enough to show its date (' + phoneCourses.dateWidth + 'px)')
  }
  await page.setViewportSize({ width: 1400, height: 1000 })
  await page.waitForTimeout(300)

  // ---- how full a course is, said where the booking happens --------------
  //
  // The occupancy lived in the course-date editor - a different dialog - and
  // only as a `title` tooltip, which a tablet cannot show at all. Booking the
  // seventh person onto a five-seat course produced no signal here. Nothing is
  // blocked; it is simply said before the choice rather than discovered after.
  await page.evaluate((K) => {
    const d = JSON.parse(localStorage.getItem(K))
    const step = d.assignmentSteps[0].id
    d.courseRuns = [{ id: 'seatcheck', stepId: step, providerId: d.providers[0]?.id || '', location: 'VIE', from: '2027-03-15', to: '2027-03-19', seats: 2 }]
    const ids = d.trainers.slice(0, 3).map((t) => t.id)
    d.trainers = d.trainers.map((t) => (ids.includes(t.id)
      ? { ...t, assignments: { ...(t.assignments || {}), [step]: { courseId: 'seatcheck', status: 'booked' } } }
      : t))
    localStorage.setItem(K, JSON.stringify(d))
  }, STORAGE_KEY)
  await page.reload({ waitUntil: 'networkidle' })
  // Wait for something that exists on EVERY tab: the app restores the open tab
  // from the address, and this suite is not on the dashboard - waiting for the
  // hero here is waiting for a tab we are not on.
  await page.waitForSelector('.topbar')
  await page.waitForTimeout(700)
  await page.locator('.tab', { hasText: 'Umschulung' }).first().click()
  await page.waitForTimeout(700)
  await page.locator('.hub-bar .seg-btn', { hasText: 'Planung' }).first().click()
  await page.waitForSelector('.planning-table')
  await page.waitForTimeout(800)

  // Somebody NOT on that course: from where they stand the question is whether
  // there is room for them at all.
  await page.locator('.planning-table tbody tr').nth(10).locator('.cell-assign, button').first().click()
  await page.waitForSelector('.modal', { timeout: 8000 })
  await page.waitForTimeout(700)
  const choices = await page.locator('.modal select').first().locator('option').allInnerTexts()
  const line = (choices.map((c) => c.trim()).find((c) => c.includes('15.03.2027')) || '')
  ok(!!line, 'the course date is offered in the booking dialog (' + (line || 'not offered') + ')')
  ok(/3\/2/.test(line), '  saying how many of how many seats are taken (' + line + ')')
  ok(/voll/i.test(line), '  and naming it full, before the choice rather than after')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)

  ok(errs.length === 0, 'no page errors at all' + (errs.length ? ': ' + errs[0] : ''))

  await page.close()
  return fails
}
