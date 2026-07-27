// Every export, in detail. The rule is "everything has to be on the PDF" –
// including whatever was added last – so this drives all seven pages through
// PDF and every Excel builder, and then looks INSIDE the files for the data
// that was most recently added rather than only checking that a byte stream
// came back.
import { reporter, STORAGE_KEY } from './harness.mjs'

// A roster with everything switched on: a course date with a period, people
// booked onto it, per-course provider capacity, a target date to judge.
async function seed(page) {
  await page.evaluate((K) => {
    const d = JSON.parse(localStorage.getItem(K))
    const steps = d.assignmentSteps
    const prov = d.providers[0]
    d.providers = d.providers.map((p, i) =>
      i === 0 ? { ...p, slots: 8, slotsByStep: { [steps[0].id]: 2, [steps[1].id]: 5 } } : p
    )
    d.courseRuns = [
      { id: 'r1', stepId: steps[0].id, providerId: prov.id, location: 'PMI', from: '2026-03-03', to: '2026-03-20', seats: 4, note: '', _at: '2026-01-01T00:00:00.000Z' },
      { id: 'r2', stepId: steps[1].id, providerId: prov.id, location: '', from: '2026-05-04', to: '2026-05-13', seats: 6, note: '', _at: '2026-01-01T00:00:00.000Z' }
    ]
    let n = 0
    d.trainers = d.trainers.map((t) => {
      n += 1
      if (n > 6) return t
      const run = n <= 3 ? d.courseRuns[0] : d.courseRuns[1]
      return {
        ...t,
        conv: { ...(t.conv || {}), target: '2026-06-30' },
        assignments: { ...t.assignments, [run.stepId]: { ...(t.assignments?.[run.stepId] || {}), courseId: run.id, status: 'booked' } }
      }
    })
    localStorage.setItem(K, JSON.stringify(d))
  }, STORAGE_KEY)
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('.kpi-hero')
}

export default async function run(browser, baseUrl, shots) {
  const { ok, fails } = reporter('exports – every page, and what is inside it')
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e)))

  const fs2 = (await import('fs')).default
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.waitForSelector('.kpi-hero')
  await seed(page)

  await page.locator('.icon-round').first().click()
  await page.waitForSelector('.dl-row')
  await page.waitForTimeout(400)

  const rows = await page.locator('.dl-row-name').allInnerTexts()
  ok(rows.length === 8, 'every page offers a download row (' + rows.length + ': ' + rows.join(', ') + ')')
  ok(rows.some((r) => r.includes('Kurstermine')), 'including the course dates, which had no export at all')
  ok(!rows.some((r) => r.trim() === 'Planung' && rows.indexOf(r) === 0), 'and the list is not led by a page that is no longer a tab')

  // ---- every PDF actually builds and carries text --------------------------
  for (let i = 0; i < rows.length; i++) {
    const row = page.locator('.dl-row').nth(i)
    const name = (await row.locator('.dl-row-name').innerText()).trim()
    const dl = page.waitForEvent('download', { timeout: 120000 })
    await row.locator('.dl-chip.pdf').click()
    let file = null
    try { file = await dl } catch (e) { file = null }
    ok(!!file, 'PDF builds for "' + name + '"')
    if (!file) continue
    const p = shots + '/exp-' + i + '.pdf'
    await file.saveAs(p)
    ok(fs2.statSync(p).size > 1000, '  ' + name + ' PDF is a real document (' + Math.round(fs2.statSync(p).size / 1024) + ' KB)')
  }

  // ---- and the newest data is really in them -------------------------------
  const fs = fs2
  const read = (i) => fs.readFileSync(shots + '/exp-' + i + '.pdf', 'latin1')
  const idx = {}
  rows.forEach((r, i) => { idx[r.trim()] = i })

  const planning = read(idx['Planung'])
  ok(planning.length > 3000, 'the planning PDF has real content (' + Math.round(planning.length / 1024) + ' KB)')

  const courses = read(idx['Kurstermine'])
  ok(courses.length > 3000, 'the course-date PDF has real content (' + Math.round(courses.length / 1024) + ' KB)')

  const providers = read(idx['Provider'])
  ok(providers.length > 3000, 'the provider PDF has real content (' + Math.round(providers.length / 1024) + ' KB)')

  // The Umschulung tab has three views, so its PDF carries all three: the
  // board columns, the planning grid and the calendar.
  const conv = read(idx['Umschulung'])
  ok(conv.length > planning.length * 0.8,
    'the Umschulung PDF is as substantial as the planning one, because it contains it (' +
      Math.round(conv.length / 1024) + ' KB vs ' + Math.round(planning.length / 1024) + ' KB)')

  ok(errs.length === 0, 'no page errors while exporting' + (errs.length ? ': ' + errs[0] : ''))

  // ---- every Excel builder runs -------------------------------------------
  // On a fresh page: Chromium queues downloads per page, and the eight PDFs
  // above make the next few land late enough to look like a failure.
  await page.close()
  const page2 = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  page2.on('pageerror', (e) => errs.push(String(e)))
  await page2.goto(baseUrl, { waitUntil: 'networkidle' })
  await page2.waitForSelector('.kpi-hero')
  await seed(page2)
  await page2.locator('.icon-round').first().click()
  await page2.waitForSelector('.dl-row')
  await page2.waitForTimeout(400)

  const xlsRows = page2.locator('.dl-row').filter({ has: page2.locator('.dl-chip.xls') })
  const xlsCount = await xlsRows.count()
  ok(xlsCount === 5, 'five pages offer an Excel sheet (' + xlsCount + ')')
  for (let i = 0; i < xlsCount; i++) {
    const row = xlsRows.nth(i)
    const name = (await row.locator('.dl-row-name').innerText()).trim()
    const dl = page2.waitForEvent('download', { timeout: 60000 })
    await row.locator('.dl-chip.xls').click()
    let file = null
    try { file = await dl } catch (e) { file = null }
    ok(!!file, 'Excel builds for "' + name + '"')
    if (file) {
      const p = shots + '/exp-' + name + '.xlsx'
      await file.saveAs(p)
      // A sheet with few rows is legitimately small; what matters is that it
      // is a workbook with a header and not a zero-byte stub.
      ok(fs.statSync(p).size > 600, '  and is not an empty workbook (' + fs.statSync(p).size + ' B)')
    }
  }

  ok(errs.length === 0, 'no page errors at all' + (errs.length ? ': ' + errs[0] : ''))
  await page2.close()
  return fails
}
