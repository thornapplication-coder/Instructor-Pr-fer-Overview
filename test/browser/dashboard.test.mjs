import { reporter } from './harness.mjs'

export default async function run(browser, baseUrl, shots) {
  const { ok, fails } = reporter('dashboard – cards, table width, heads vs FTE')
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e)))
  // The sandbox proxy blocks Google Fonts and Supabase; only our OWN assets
  // failing is a defect.
  page.on('requestfailed', (r) => { if (r.url().startsWith(new URL(baseUrl).origin)) errs.push('own asset failed: ' + r.url()) })

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.waitForSelector('.topbar')
  await page.waitForTimeout(400)

  // ---- 1. subtitle gone -------------------------------------------------------
  ok(await page.locator('.brand-text p').count() === 0, 'the "Boeing 737 MAX Phase-In" subtitle is gone')
  ok(!/Boeing 737 MAX/.test(await page.locator('.topbar').innerText()), 'no Boeing 737 MAX anywhere in the header')

  // ---- 2. settings is a gear in the header, in the requested order ------------
  ok(await page.locator('.tab', { hasText: 'Einstellungen' }).count() === 0, 'Settings is no longer a tab')
  const order = await page.locator('.topbar-right > *').evaluateAll((els) =>
    els.map((e) => e.getAttribute('aria-label') || e.className.split(' ')[0])
  )
  console.log('     header order: ' + order.join(' | '))
  const idx = (s) => order.findIndex((o) => o && o.toLowerCase().includes(s))
  ok(idx('language') >= 0 && idx('einstellungen') === idx('language') + 1, 'the gear sits directly after DE/EN')
  ok(idx('neu laden') === idx('einstellungen') + 1, 'reload comes after the gear')
  ok(idx('speichern') === idx('neu laden') + 1, 'save comes after reload')
  ok(idx('dunkelmodus') === idx('speichern') + 1 || idx('hellmodus') === idx('speichern') + 1, 'dark mode comes last')

  const gear = page.locator('.topbar-right button[aria-label="Einstellungen"]')
  await gear.click()
  await page.waitForTimeout(400)
  ok(await page.locator('.changelog-entry').count() > 0, 'the gear opens the settings page')
  ok(await gear.evaluate((e) => e.classList.contains('active')), 'the gear shows it is the active view')
  ok(await gear.getAttribute('aria-current') === 'page', 'and says so to a screen reader')

  // ---- 3. the trainer table got narrower -------------------------------------
  await page.locator('.tab', { hasText: 'Trainer' }).first().click()
  await page.waitForSelector('.data-table')
  await page.waitForTimeout(300)
  const box = await page.locator('.table-wrap').evaluate((e) => ({ c: e.clientWidth, s: e.scrollWidth }))
  const pad = await page.locator('.data-table td').first().evaluate((e) => getComputedStyle(e).paddingLeft)
  console.log('     container ' + box.c + 'px, content ' + box.s + 'px, cell padding ' + pad)
  ok(await page.locator('.data-table.compact').count() === 1, 'the trainer table uses the compact variant')
  // 12px originally, 8px when the table was first narrowed, 6px since the
  // "Anmerkungen" column arrived – the header words set the column widths, so
  // padding is the only room left to give.
  ok(pad === '6px', 'cell padding tightened to 6px (' + pad + ')')
  ok(box.s <= box.c, 'the table fits without sideways scrolling (' + box.s + ' <= ' + box.c + ')')
  // On a phone it is not a table any more: fourteen columns left four on the
  // screen and 863px behind a sideways scroll nobody finds, so each row is a
  // card there. Eight fields carry it; the other five are read in the dialog.
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(400)
  const small = await page.locator('.table-wrap').evaluate((e) => ({ c: e.clientWidth, s: e.scrollWidth }))
  ok(small.s <= small.c + 1, 'on a phone nothing hides behind a sideways scroll (' + small.s + ' <= ' + small.c + ')')
  const card = page.locator('.trainer-table tbody tr').first()
  const seen = await card.evaluate((tr) => {
    const box = (sel) => {
      const el = tr.querySelector(sel)
      if (!el) return null
      const s = getComputedStyle(el)
      if (s.display === 'none') return null
      const r = el.getBoundingClientRect()
      return { top: Math.round(r.top), right: Math.round(r.right) }
    }
    return {
      shown: ['.t-name', '.t-qual', '.t-base', '.t-tlc', '.t-role', '.t-fte', '.t-ac', '.t-ore', '.t-stage', '.t-sen']
        .filter((s) => box(s)),
      hidden: ['.t-pt', '.t-staff', '.t-auth', '.t-remark', '.t-note'].filter((s) => !box(s)),
      worstRight: Math.max(...['.t-name', '.t-qual', '.t-base', '.t-role', '.t-ore', '.t-stage']
        .map((s) => (box(s) || { right: 0 }).right)),
      headTop: box('.t-name').top,
      qualTop: box('.t-qual').top,
      bodyTop: box('.t-base').top
    }
  })
  ok(seen.shown.length === 10, 'ten fields carry the card (' + seen.shown.length + ')')
  ok(seen.hidden.length === 5, 'and the five free-text/rare ones step aside for the dialog (' + seen.hidden.length + ')')
  ok(seen.worstRight <= 391, 'nothing runs off the side (worst right edge ' + seen.worstRight + ')')
  ok(Math.abs(seen.headTop - seen.qualTop) <= 12, 'name and qualification share the head line')
  ok(seen.bodyTop > seen.headTop, 'and the rest sits below it')
  // An iPad in landscape is 1024px and the fourteen columns want 1234px, so it
  // is a card there too. This is the width the first cut got wrong.
  await page.setViewportSize({ width: 1024, height: 768 })
  await page.waitForTimeout(400)
  const tablet = await page.locator('.table-wrap').evaluate((e) => ({ c: e.clientWidth, s: e.scrollWidth }))
  ok(tablet.s <= tablet.c + 1, 'an iPad in landscape hides nothing either (' + tablet.s + ' <= ' + tablet.c + ')')
  // And the width where the real table does fit keeps it.
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.waitForTimeout(400)
  const wide = await page.evaluate(() => ({
    display: getComputedStyle(document.querySelector('.trainer-table')).display,
    heads: document.querySelectorAll('.trainer-table thead th').length,
    hidden: (() => { const w = document.querySelector('.table-wrap'); return w.scrollWidth - w.clientWidth })()
  }))
  ok(wide.display === 'table' && wide.heads === 15, 'a desktop keeps the real table with all fifteen columns (' + wide.heads + ')')
  ok(wide.hidden === 0, '  and it fits (' + wide.hidden + 'px hidden)')
  // Hiding the idle sort marks is still what makes it fit - but only just, and
  // the margin depends on the typeface.
  //
  // This assertion used to demand 60px+ of overflow, and it got 83px. That
  // figure was measured in system-ui, because until 1.53.0 Mulish came from
  // fonts.googleapis.com and never loaded in this headless run: the suite was
  // quietly checking the table in the FALLBACK font the whole time. Now the
  // font ships with the app, the same forced marks cost 2px instead of 83.
  //
  // Both numbers are real and both matter: Mulish is what a reader sees, and
  // system-ui is what they saw offline before. So the check is that the marks
  // still push the table past its container at all - a lower bound of 60 would
  // now be asserting a property of the wrong font.
  await page.addStyleTag({ content: ".data-table th[aria-sort='none'] .sort-arrow { display: inline !important }" })
  await page.waitForTimeout(300)
  const withArrows = await page.evaluate(() => { const w = document.querySelector('.table-wrap'); return w.scrollWidth - w.clientWidth })
  ok(withArrows > 0, '  and it would not with a mark on every idle column (' + withArrows + 'px hidden, in Mulish)')

  // And the fit is not a lucky property of Mulish being narrow: force the old
  // fallback and the table must still fit without the marks.
  await page.addStyleTag({
    content: ".data-table, .data-table * { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif !important }" +
      " .data-table th[aria-sort='none'] .sort-arrow { display: none !important }"
  })
  await page.waitForTimeout(400)
  const fallbackFit = await page.evaluate(() => { const w = document.querySelector('.table-wrap'); return w.scrollWidth - w.clientWidth })
  ok(fallbackFit === 0, '  and it still fits if the typeface ever falls back to the system one (' + fallbackFit + 'px hidden)')
  await page.reload({ waitUntil: 'networkidle' })
  await page.locator('.tab', { hasText: 'Trainer' }).first().click()
  await page.waitForSelector('.trainer-table')
  await page.waitForTimeout(400)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.waitForTimeout(300)
  // The compact variant must not leak into the other tables.
  await page.locator('.tab', { hasText: 'Provider' }).first().click()
  await page.waitForSelector('.data-table')
  await page.waitForTimeout(300)
  ok(await page.locator('.data-table.compact').count() === 0, 'other tables keep their original size')
  // `compact` is shared with the course dates. The trainer card rules must
  // hang off `trainer-table` alone, or that table would be rearranged by rules
  // written for columns it does not have. It has a card of its OWN since the
  // dialog turned out not to fit at any width – so the check is not "still a
  // table" but "laid out by its own grid, not the trainer's".
  // It sits under Umschulung → Planung. Asserted, not skipped: a check that
  // quietly finds nothing reads exactly like a check that passed.
  await page.setViewportSize({ width: 390, height: 844 })
  await page.locator('.tab', { hasText: 'Umschulung' }).first().click()
  await page.waitForTimeout(400)
  await page.locator('.seg-btn', { hasText: 'Planung' }).first().click()
  await page.waitForTimeout(500)
  await page.locator('.btn-ghost', { hasText: 'Kurstermine' }).first().click()
  await page.waitForSelector('.course-table')
  await page.waitForTimeout(400)
  ok(await page.locator('.course-table').count() === 1, 'found the course-date table under Umschulung → Planung → Kurstermine')
  const courseGrid = await page.evaluate(() => {
    const row = document.querySelector('.course-table tbody tr')
    if (!row) return { empty: true }
    const areas = getComputedStyle(row).gridTemplateAreas
    return {
      empty: false,
      // Its own areas name the course fields (ty/pv/lo/fr/to/dy/se/bk/rm);
      // the trainer grid names nm/qu/bs/tl/ro/ft/ac/or/st.
      ownGrid: /ty/.test(areas) && !/qu/.test(areas),
      // And none of the trainer's cells can be hiding here.
      trainerCells: row.querySelectorAll('.t-name, .t-qual, .t-stage').length,
      areas
    }
  })
  ok(!courseGrid.empty, 'the course-date dialog has a row at phone width')
  ok(courseGrid.ownGrid && courseGrid.trainerCells === 0,
    'and it is laid out by its own card grid, not the trainer table\'s (' + courseGrid.areas + ')')
  // Close it: the backdrop swallows every later click on a tab.
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  ok(await page.locator('.modal-backdrop').count() === 0, 'and the dialog closes again')
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.waitForTimeout(300)

  // ---- 4. heads vs FTE on the dashboard --------------------------------------
  await page.locator('.tab', { hasText: 'Dashboard' }).first().click()
  await page.waitForSelector('.kpi')
  await page.waitForTimeout(400)
  const cards = page.locator('.card', { has: page.locator('.nbars') })
  ok(await cards.count() === 2, 'two heads-vs-FTE cards (base and aircraft)')

  const baseCard = page.locator('.card').filter({ hasText: 'Köpfe vs. FTE je Base' }).first()
  const acCard = page.locator('.card').filter({ hasText: 'Köpfe vs. FTE je Aircraft' }).first()
  ok(await baseCard.count() === 1 && await acCard.count() === 1, 'both are titled as asked')

  const rowsBase = await baseCard.locator('.nbar-row').count()
  ok(rowsBase >= 4, 'the base chart has one row per base (' + rowsBase + ')')
  const acRows = await acCard.locator('.nbar-row .hbar-label').allInnerTexts()
  ok(acRows.includes('A320') && acRows.includes('B737'), 'the aircraft chart lists A320 and B737 (' + acRows.join(', ') + ')')

  // Two bars per row, and FTE never exceeds heads (that is what makes them
  // comparable on one axis).
  const firstRow = baseCard.locator('.nbar-row').first()
  ok(await firstRow.locator('.nbar-whole').count() === 1, 'one band per row (the headcount)')
  ok(await firstRow.locator('.nbar-part').count() === 1, 'with the FTE nested inside it')
  const vals = await firstRow.locator('.nbar-val').allInnerTexts()
  const num = (s) => Number(s.replace(',', '.'))
  ok(vals.length === 2 && num(vals[1]) <= num(vals[0]), 'FTE (' + vals[1] + ') never exceeds heads (' + vals[0] + ')')
  // The nested bar must actually sit inside its band, never past it.
  const geom = await firstRow.evaluate((el) => {
    const w = el.querySelector('.nbar-whole').getBoundingClientRect()
    const p = el.querySelector('.nbar-part').getBoundingClientRect()
    return { inside: p.right <= w.right + 1, ratio: p.width / w.width }
  })
  ok(geom.inside, 'the FTE bar never runs past the headcount band')
  ok(geom.ratio > 0.5 && geom.ratio <= 1, 'and fills a sensible share of it (' + geom.ratio.toFixed(2) + ')')
  const legend = await baseCard.locator('.legend-key').allInnerTexts()
  ok(legend.join(',') === 'Köpfe,FTE', 'legend names both series: ' + legend.join(' / '))

  // The totals must match the Capacity tab – same numbers, different view.
  const dashTotal = await baseCard.locator('.legend-val').allInnerTexts()
  await page.locator('.tab', { hasText: 'Kapazität' }).first().click()
  await page.waitForSelector('.cap-table', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(400)
  const capText = await page.locator('.tab-pane').innerText()
  ok(capText.includes(dashTotal[0]), 'the head total (' + dashTotal[0] + ') also appears on the Capacity tab')

  await page.locator('.tab', { hasText: 'Dashboard' }).first().click()
  await page.waitForSelector('.nbars')
  await page.waitForTimeout(400)
  await baseCard.screenshot({ path: shots + '/headfte.png' })
  // ---- seniority, on every screen it has to survive ------------------------
  //
  // The date comes from the company seniority list (Stand 03.07.2026) and is
  // read into the roster we already have - a lookup, never an import. Checked
  // at the four widths that actually exist on the desks and in the bags.
  //
  // Back to the Trainer tab first: the block above ends on the Dashboard, and
  // querying `.trainer-table` there returns null rather than failing an
  // assertion – it takes the whole run down with a TypeError.
  await page.locator('.tab', { hasText: 'Trainer' }).first().click()
  await page.waitForSelector('.trainer-table')
  await page.waitForTimeout(400)
  for (const [label, w, h] of [['iPhone', 390, 844], ['iPad portrait', 820, 1180],
                               ['iPad Pro portrait', 834, 1194], ['iPad landscape', 1024, 768]]) {
    await page.setViewportSize({ width: w, height: h })
    await page.waitForTimeout(450)
    const r = await page.evaluate(() => {
      const t = document.querySelector('.trainer-table')
      const wrap = t.closest('.table-wrap')
      const row = t.querySelector('tbody tr')
      const sen = row.querySelector('.t-sen')
      const stage = row.querySelector('.t-stage')
      const rect = (e) => e.getBoundingClientRect()
      const cells = [...row.querySelectorAll('td')].filter((c) => getComputedStyle(c).display !== 'none')
      return {
        shown: !!sen && getComputedStyle(sen).display !== 'none',
        text: sen ? sen.innerText.trim() : '',
        label: sen ? getComputedStyle(sen, '::before').content : 'none',
        width: sen ? Math.round(rect(sen).width) : 0,
        sameLine: sen && stage ? Math.abs(Math.round(rect(sen).top) - Math.round(rect(stage).top)) <= 4 : false,
        hidden: wrap.scrollWidth - wrap.clientWidth,
        pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
        worstRight: Math.max(...cells.map((c) => Math.round(rect(c).right))),
        cardRight: Math.round(rect(row).right)
      }
    })
    ok(r.shown, label + ': the seniority date is on the card')
    ok(/^\d{2}\.\d{2}\.\d{4}$/.test(r.text), label + ': and it is a real date, not the ISO string (' + r.text + ')')
    ok(r.label !== 'none' && r.label.toLowerCase().includes('senior'),
      label + ': carrying the heading its column had (' + r.label + ')')
    // It shares the last line with the conversion phase. A fifth line on fifty
    // cards is fifty times the scroll, so this placement is the point.
    ok(r.sameLine, label + ': sharing the last line with the phase, not adding one')
    ok(r.hidden <= 1 && r.pageOverflow <= 0,
      label + ': nothing hides behind a sideways scroll (' + r.hidden + ' / ' + r.pageOverflow + ')')
    ok(r.worstRight <= r.cardRight + 1, label + ': and nothing paints outside the card')
    // A tablet must not hand the date the whole slack track: 460px of box for a
    // ten-character date was what the first cut did.
    ok(r.width <= 200, label + ': the date gets a date-sized box (' + r.width + 'px)')
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.waitForTimeout(400)

  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs[0] : ''))
  await page.close()
  return fails
}
