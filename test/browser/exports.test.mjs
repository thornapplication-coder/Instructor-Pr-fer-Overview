import { reporter, STORAGE_KEY } from './harness.mjs'

export default async function run(browser, baseUrl, shots) {
  const { ok, fails } = reporter('exports – dashboard PDF paging')
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e)))
  // The sandbox proxy blocks Google Fonts and Supabase; only our OWN assets
  // failing is a defect.
  page.on('requestfailed', (r) => { if (r.url().startsWith(new URL(baseUrl).origin)) errs.push('own asset failed: ' + r.url()) })

  // Catch the download instead of writing it to disk, and read its page count.
  const pdfPages = async () => {
    const [dl] = await Promise.all([
      page.waitForEvent('download', { timeout: 60000 }),
      // The Downloads card lists one row per page; take the Dashboard row's PDF chip.
      page.locator('.downloads-card li, .downloads-card tr, .downloads-card .dl-row')
        .filter({ hasText: 'Dashboard' })
        .first()
        .locator('.dl-chip.pdf')
        .click()
    ])
    const path = await dl.path()
    const { readFileSync } = await import('node:fs')
    const buf = readFileSync(path)
    const text = buf.toString('latin1')
    // Page objects are the /Type /Page entries in the PDF body.
    const n = (text.match(/\/Type\s*\/Page[^s]/g) || []).length
    // jsPDF writes the text streams uncompressed here, which is what lets the
    // page count above work – so the footer is readable in the raw bytes too.
    return { n, bytes: buf.length, text }
  }

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.waitForSelector('.kpi')
  await page.waitForTimeout(600)
  await page.locator('.topbar-right button[aria-label="Einstellungen"]').click()
  await page.waitForTimeout(500)

  const dlButtons = await page.locator('.downloads-card .dl-chip.pdf').count()
  ok(dlButtons > 0, 'the download chips are reachable in Settings (' + dlButtons + ')')

  const a = await pdfPages()
  console.log('     dashboard PDF: ' + a.n + ' page(s), ' + Math.round(a.bytes / 1024) + ' KB')
  ok(a.n >= 1 && a.n <= 2, 'the dashboard PDF renders 1-2 pages, not an endless shrink (' + a.n + ')')
  ok(a.bytes > 20000, 'the PDF has real content in it')
  // The reports get handed on, so no personal byline may ride along. Checked on
  // the produced bytes, not on the helper that builds the string.
  ok(!/copyright/i.test(a.text), 'and no copyright notice anywhere in it')
  // Matched by pattern, not against src/version.js: the running app is whatever
  // `npm run build` last produced, so comparing to the source version would
  // fail purely because a version bump had not been rebuilt yet.
  ok(/v\d+\.\d+\.\d+/.test(a.text), 'but it does carry a build version (' + (/v\d+\.\d+\.\d+/.exec(a.text) || [''])[0] + ')')

  // Same for the Excel export – it shares footerLine() but is written by a
  // different code path.
  const [xls] = await Promise.all([
    page.waitForEvent('download', { timeout: 60000 }),
    page.locator('.downloads-card .dl-chip.xls').first().click()
  ])
  const { readFileSync: readXls } = await import('node:fs')
  const xlsText = readXls(await xls.path()).toString('utf8')
  ok(!/copyright/i.test(xlsText), 'the Excel export carries no copyright notice either')
  ok(/v\d+\.\d+\.\d+/.test(xlsText), 'and still names the build')

  // Force a very tall dashboard and confirm it spills rather than shrinking away.
  await page.evaluate((KEY) => {
    const d = JSON.parse(localStorage.getItem(KEY))
    // many bases -> many chart rows -> a much taller capture
    d.trainers = d.trainers.map((t, i) => ({ ...t, base: 'B' + String(i % 24).padStart(2, '0') }))
    localStorage.setItem(KEY, JSON.stringify(d))
  }, STORAGE_KEY)
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('.kpi')
  await page.waitForTimeout(800)
  await page.locator('.topbar-right button[aria-label="Einstellungen"]').click()
  await page.waitForTimeout(500)
  const b = await pdfPages()
  console.log('     very tall dashboard: ' + b.n + ' page(s), ' + Math.round(b.bytes / 1024) + ' KB')
  ok(b.n >= a.n, 'a much taller dashboard uses at least as many pages (' + a.n + ' -> ' + b.n + ')')
  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs[0] : ''))
  await page.close()
  return fails
}
