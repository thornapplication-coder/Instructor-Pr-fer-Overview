// The Other Pilots roster: several types per person, a validity worked out
// against today, and the three exports.
import { reporter, STORAGE_KEY } from './harness.mjs'

export default async function run(browser, baseUrl, shots) {
  const { ok, fails } = reporter('other pilots – the roster, its ratings and its exports')
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } })
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e)))

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.waitForSelector('.kpi-hero')
  await page.locator('.tab', { hasText: 'Other Pilots' }).first().click()
  await page.waitForSelector('.pilots-table')
  await page.waitForTimeout(500)

  const heads = (await page.locator('.pilots-table th').allInnerTexts()).map((x) => x.trim().split('\n')[0])
  ok(heads.join('|').includes('BASE') && heads.join('|').includes('TLC'), 'the roster columns are there (' + heads.join(' | ') + ')')
  ok(heads.some((h) => h.includes('GÜLTIG')) && heads.some((h) => h.includes('ABGELAUFEN')),
    'including the two derived ones')

  const rows = page.locator('.pilots-table tbody tr')
  ok(await rows.count() === 64, 'all sixty-four people are listed (' + (await rows.count()) + ')')

  // Sorted by name by default, and the name carries the comma.
  const names = (await page.locator('.pilots-table tbody tr td:nth-child(3)').allInnerTexts()).map((x) => x.trim().split('\n')[0])
  ok(names[0].includes(','), 'the name reads "Nachname, Vorname" (' + names[0] + ')')
  ok(names.join('|') === [...names].sort((a, b) => a.localeCompare(b)).join('|'), 'and the list is alphabetical')

  // Somebody with two ratings shows both, and is marked in both columns.
  const jerry = page.locator('.pilots-table tbody tr').filter({ hasText: 'Altenhuber' }).first()
  // Two lines in each of the five per-rating columns: type, date, Boeing
  // experience, valid, expired.
  ok(await jerry.locator('td:nth-child(4) .rating-line').count() === 2, 'both types are visible')
  ok(await jerry.locator('td:nth-child(5) .rating-line').count() === 2, 'and both dates')
  // The × has to sit on the SAME line as the date it judges: the first rating
  // (expired) marks line 1 of "Abgelaufen", the second (valid) line 2 of
  // "Gültig". One × per person put them both on line 1.
  const lineTop = (sel, i) =>
    jerry.locator(sel).nth(i).evaluate((e) => Math.round(e.getBoundingClientRect().top))
  const d1 = await lineTop('td:nth-child(5) .rating-line', 0)
  const d2 = await lineTop('td:nth-child(5) .rating-line', 1)
  const expiredMark = await lineTop('td:nth-child(8) .rating-line', 0)
  const validMark = await lineTop('td:nth-child(7) .rating-line', 1)
  ok(Math.abs(expiredMark - d1) <= 1, 'the expired × is level with the date that lapsed (' + expiredMark + ' vs ' + d1 + ')')
  ok(Math.abs(validMark - d2) <= 1, 'and the valid × is level with the date that still holds (' + validMark + ' vs ' + d2 + ')')
  const marks = await jerry.locator('td:nth-child(7) .rating-line, td:nth-child(8) .rating-line').allInnerTexts()
  ok(marks.map((x) => x.trim()).join('|') === '|×|×|', 'exactly one mark per rating (' + JSON.stringify(marks) + ')')

  // Centred, and the dates carry their own verdict as a colour.
  const align = await jerry.locator('td').nth(6).evaluate((e) => getComputedStyle(e).textAlign)
  ok(align === 'center', 'the marked columns are centred (' + align + ')')
  const c1 = await jerry.locator('td:nth-child(5) .rating-line').nth(0).evaluate((e) => getComputedStyle(e).color)
  const c2 = await jerry.locator('td:nth-child(5) .rating-line').nth(1).evaluate((e) => getComputedStyle(e).color)
  ok(c1 === 'rgb(179, 18, 44)', 'a lapsed date is red (' + c1 + ')')
  ok(c2 === 'rgb(31, 122, 77)', 'and a date that still holds is green (' + c2 + ')')

  // The verdict is computed: move the date and the mark moves with it.
  await page.evaluate((K) => {
    const d = JSON.parse(localStorage.getItem(K))
    d.otherPilots = d.otherPilots.map((p) =>
      p.name.startsWith('Altenhuber') ? { ...p, ratings: p.ratings.map((r) => ({ ...r, until: '2020-01-31' })) } : p
    )
    localStorage.setItem(K, JSON.stringify(d))
  }, STORAGE_KEY)
  await page.reload({ waitUntil: 'networkidle' })
  await page.locator('.tab', { hasText: 'Other Pilots' }).first().click()
  await page.waitForSelector('.pilots-table')
  await page.waitForTimeout(400)
  const j2 = page.locator('.pilots-table tbody tr').filter({ hasText: 'Altenhuber' }).first()
  const after = (await j2.locator('td:nth-child(7) .rating-line, td:nth-child(8) .rating-line').allInnerTexts()).map((x) => x.trim())
  ok(after.join('|') === '||×|×',
    'both dates in the past means two expired marks and none valid – nothing is read from a stored flag (' + JSON.stringify(after) + ')')

  // ---- the dialog: base and type are dropdowns with an empty choice --------
  await page.locator('.pilots-table tbody tr').first().click()
  await page.waitForSelector('.modal')
  await page.waitForTimeout(400)
  const modal = page.locator('.modal')
  const baseSel = modal.locator('.field', { hasText: 'Base' }).locator('select')
  ok((await baseSel.locator('option').first().getAttribute('value')) === '', 'the base dropdown offers an empty cell')
  ok((await baseSel.locator('option').count()) >= 10, 'and the bases from the settings (' + (await baseSel.locator('option').count()) + ')')

  const ratingRows = modal.locator('.rating-row')
  ok(await ratingRows.count() >= 1, 'the ratings are editable one by one (' + (await ratingRows.count()) + ')')
  const typeSel = ratingRows.first().locator('select')
  ok((await typeSel.locator('option').first().getAttribute('value')) === '', 'the type dropdown offers an empty cell too')
  await modal.locator('.btn-ghost', { hasText: 'Muster' }).click()
  await page.waitForTimeout(300)
  ok(await modal.locator('.rating-row').count() >= 2, 'and another type can be added')

  // TLC is held to three characters as it is typed.
  const tlc = modal.locator('.field', { hasText: 'TLC' }).locator('input')
  await tlc.fill('abcdef')
  await page.waitForTimeout(200)
  ok((await tlc.inputValue()) === 'ABC', 'the TLC is three upper-case characters (' + (await tlc.inputValue()) + ')')
  await modal.locator('.btn-ghost', { hasText: 'Abbrechen' }).click()
  await page.waitForTimeout(300)

  // ---- PDF, Excel and print ------------------------------------------------
  await page.locator('.icon-round').first().click()
  await page.waitForSelector('.dl-row')
  const row = page.locator('.dl-row').filter({ hasText: 'Other Pilots' }).first()
  ok(await row.locator('.dl-chip.pdf').count() === 1, 'the roster offers a PDF')
  ok(await row.locator('.dl-chip.xls').count() === 1, 'an Excel sheet')
  ok(await row.locator('.dl-chip.print').count() === 1, 'and print')
  const fs = (await import('fs')).default
  for (const kind of ['pdf', 'xls']) {
    const dl = page.waitForEvent('download', { timeout: 90000 })
    await row.locator('.dl-chip.' + kind).click()
    let f = null
    try { f = await dl } catch (e) { f = null }
    ok(!!f, 'the ' + kind.toUpperCase() + ' builds')
    if (f) {
      const p = shots + '/pilots.' + kind
      await f.saveAs(p)
      ok(fs.statSync(p).size > 1000, '  and carries the roster (' + Math.round(fs.statSync(p).size / 1024) + ' KB)')
    }
    await page.waitForTimeout(500)
  }

  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs[0] : ''))
  await page.close()

  // ---- the phone -----------------------------------------------------------
  // Eight columns do not fit 390 px. They used to run off the side behind a
  // scroll nobody finds, so the roster read as "base, TLC, name" and stopped.
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await phone.goto(baseUrl, { waitUntil: 'networkidle' })
  await phone.waitForSelector('.kpi-hero')
  await phone.locator('.tab', { hasText: 'Other Pilots' }).first().click()
  await phone.waitForSelector('.pilots-table')
  await phone.waitForTimeout(500)

  const jp = phone.locator('.pilots-table tbody tr').filter({ hasText: 'Altenhuber' }).first()
  const boxes = {}
  for (const c of ['c-base', 'c-tlc', 'c-name', 'c-type', 'c-until', 'c-exp', 'c-valid', 'c-expired']) {
    boxes[c] = await jp.locator('td.' + c).evaluate((e) => {
      const r = e.getBoundingClientRect()
      return { w: Math.round(r.width), right: Math.round(r.right), top: Math.round(r.top) }
    })
  }
  const shown = Object.entries(boxes).filter(([, b]) => b.w > 0 && b.right <= 391)
  ok(shown.length === 8, 'all eight fields are on the screen (' + shown.length + '/8: ' +
    Object.entries(boxes).map(([k, b]) => k + ' ' + b.right).join(', ') + ')')
  const noScroll = await phone.evaluate(() => {
    const w = document.querySelector('.table-wrap')
    return {
      page: document.documentElement.scrollWidth <= window.innerWidth + 1,
      table: w.scrollWidth <= w.clientWidth + 1
    }
  })
  ok(noScroll.page, 'and the page does not scroll sideways to show them')
  ok(noScroll.table, 'nor does the table itself')

  // Without the header row each cell has to name itself.
  const label = await jp.locator('td.c-until').evaluate((e) => getComputedStyle(e, '::before').content)
  ok(/ltigkeit/i.test(label), 'every field carries its own heading (' + label + ')')

  // The card keeps what the table was built for: one line per rating, and the
  // × level with the date it judges.
  const top = (sel, i) => jp.locator(sel).nth(i).evaluate((e) => Math.round(e.getBoundingClientRect().top))
  const pd2 = await top('td.c-until .rating-line', 1)
  const pv2 = await top('td.c-valid .rating-line', 1)
  ok(Math.abs(pv2 - pd2) <= 1, 'the marks stay level with their dates (' + pv2 + ' vs ' + pd2 + ')')
  ok(boxes['c-name'].top < boxes['c-base'].top && boxes['c-base'].top < boxes['c-type'].top,
    'name on top, then base/TLC, then the ratings')
  await phone.screenshot({ path: shots + '/pilots-phone.png', fullPage: false })
  await phone.close()

  // ---- the tablet ----------------------------------------------------------
  // The first cut of this switched at 780px, which reads like a phone
  // breakpoint and is not one: an iPad Air/Pro in portrait is 820-834px and
  // was still 190px short of the table it kept showing.
  for (const [w, h, label] of [[820, 1180, 'iPad Air portrait'], [768, 1024, 'iPad portrait']]) {
    const pad = await browser.newPage({ viewport: { width: w, height: h } })
    await pad.goto(baseUrl, { waitUntil: 'networkidle' })
    await pad.waitForSelector('.kpi-hero')
    await pad.locator('.tab', { hasText: 'Other Pilots' }).first().click()
    await pad.waitForSelector('.pilots-table')
    await pad.waitForTimeout(400)
    const m = await pad.evaluate((vw) => {
      const wrap = document.querySelector('.table-wrap')
      const r = document.querySelector('.pilots-table tbody tr td.c-expired').getBoundingClientRect()
      const valid = document.querySelector('.pilots-table tbody tr td.c-valid').getBoundingClientRect()
      return { hidden: wrap.scrollWidth - wrap.clientWidth, lastRight: Math.round(r.right), vw, validWidth: Math.round(valid.width) }
    }, w)
    ok(m.hidden === 0 && m.lastRight <= w + 1,
      label + ' (' + w + 'px): the last column is on the screen, nothing hidden (' + m.hidden + 'px hidden, right edge ' + m.lastRight + ')')
    // And the card does not spend the extra room stretching two × columns.
    ok(m.validWidth <= 140, '  and the mark columns keep a sane width (' + m.validWidth + 'px)')
    await pad.close()
  }

  // Landscape clears the 966px the table needs, so it stays a table there.
  const land = await browser.newPage({ viewport: { width: 1024, height: 768 } })
  await land.goto(baseUrl, { waitUntil: 'networkidle' })
  await land.waitForSelector('.kpi-hero')
  await land.locator('.tab', { hasText: 'Other Pilots' }).first().click()
  await land.waitForSelector('.pilots-table')
  await land.waitForTimeout(400)
  const lm = await land.evaluate(() => {
    const wrap = document.querySelector('.table-wrap')
    return {
      hidden: wrap.scrollWidth - wrap.clientWidth,
      isTable: getComputedStyle(document.querySelector('.pilots-table')).display === 'table',
      headVisible: document.querySelectorAll('.pilots-table thead th').length
    }
  })
  ok(lm.isTable && lm.headVisible === 8, 'an iPad in landscape keeps the real table with its header row (' + lm.headVisible + ' columns)')
  ok(lm.hidden === 0, '  and it fits without a sideways scroll (' + lm.hidden + 'px hidden)')
  await land.close()

  // ---- the roster correction reaches a device that has the old one ---------
  // 1.33.0 shipped the roster with the wrong bases and no TLCs, and _pilotSeed
  // was already set, so 1.34.0's corrected list could never replace it.
  const old = await browser.newPage({ viewport: { width: 1400, height: 1000 } })
  await old.goto(baseUrl, { waitUntil: 'networkidle' })
  await old.waitForSelector('.kpi-hero')
  await old.evaluate((K) => {
    const d = JSON.parse(localStorage.getItem(K))
    // Exactly the shape 1.33.0 left behind: no TLC, a wrong base, no role, and
    // one person who is not on the corrected sheet.
    d.otherPilots = d.otherPilots.map((p) => {
      const { role, ...rest } = p
      return { ...rest, tlc: '', base: 'VIE', _at: '2026-01-01T00:00:00.000Z' }
    })
    d.otherPilots.push({
      id: 'plt-65', base: 'VIE', tlc: '', name: 'Wenninger-Weinzierl, Armin', ratings: [],
      _at: '2026-01-01T00:00:00.000Z'
    })
    d._pilotSeed = true
    delete d._pilotSeed2
    localStorage.setItem(K, JSON.stringify(d))
  }, STORAGE_KEY)
  await old.reload({ waitUntil: 'networkidle' })
  await old.locator('.tab', { hasText: 'Other Pilots' }).first().click()
  await old.waitForSelector('.pilots-table')
  await old.waitForTimeout(500)
  const tlcs = (await old.locator('.pilots-table td.c-tlc').allInnerTexts()).map((x) => x.trim())
  ok(tlcs.length === 64 && tlcs.every((x) => /^[A-Z0-9]{3}$/.test(x)),
    'the corrected TLCs arrive on a device that still had the first roster (' + tlcs.length + ', e.g. ' + tlcs[0] + ')')
  const basesShown = new Set((await old.locator('.pilots-table td.c-base').allInnerTexts()).map((x) => x.trim()))
  ok(basesShown.size > 1, 'and the corrected bases with them (' + [...basesShown].join(' ') + ')')
  const stamped = await old.evaluate((K) => {
    const d = JSON.parse(localStorage.getItem(K))
    return {
      tomb: !!(d._tomb.otherPilots && d._tomb.otherPilots['plt-65']),
      gone: !d.otherPilots.some((p) => p.id === 'plt-65'),
      // A correction that keeps the old stamp ties in the cloud merge and comes
      // straight back on the next pull.
      fresh: d.otherPilots.every((p) => p._at > '2026-07-01')
    }
  }, STORAGE_KEY)
  ok(stamped.gone, 'the person the corrected sheet does not have is dropped')
  ok(stamped.tomb, 'with a tombstone, so the other device cannot hand them back')
  ok(stamped.fresh, 'and every corrected record is stamped, so it wins the merge')

  // An edited record is not overwritten: a TLC that was typed marks it as
  // touched, and everything typed alongside it stays.
  const edited = await old.evaluate((K) => {
    const d = JSON.parse(localStorage.getItem(K))
    const id = d.otherPilots[0].id
    d.otherPilots = d.otherPilots.map((p) => (p.id === id ? { ...p, base: 'ARN' } : { ...p, tlc: '' }))
    delete d._pilotSeed2
    localStorage.setItem(K, JSON.stringify(d))
    return id
  }, STORAGE_KEY)
  await old.reload({ waitUntil: 'networkidle' })
  await old.locator('.tab', { hasText: 'Other Pilots' }).first().click()
  await old.waitForSelector('.pilots-table')
  await old.waitForTimeout(400)
  const keptEdit = await old.evaluate(([K, id]) => {
    const d = JSON.parse(localStorage.getItem(K))
    const p = d.otherPilots.find((x) => x.id === id)
    const others = d.otherPilots.filter((x) => x.id !== id)
    return { kept: !!p && p.base === 'ARN' && !!p.tlc, refilled: others.every((x) => /^[A-Z0-9]{3}$/.test(x.tlc)) }
  }, [STORAGE_KEY, edited])
  ok(keptEdit.kept, 'a record with a typed TLC keeps the base that was typed with it')
  ok(keptEdit.refilled, 'while the untouched ones around it are still corrected')

  await old.close()
  return fails
}
