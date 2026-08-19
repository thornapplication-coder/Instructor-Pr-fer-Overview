// The typeface is ours, and the page asks nobody else for anything.
//
// Mulish used to come from fonts.googleapis.com. Offline that stylesheet
// cannot load, so the interface fell back to system-ui - and every width in
// styles.css was measured against Mulish, including the ones this very suite
// asserts, and including the PDF export, which html2canvas renders from the
// live DOM. A tested invariant hung on a CDN being reachable. It also sent the
// reader's IP to Google on every load of a tool holding colleagues' names.
//
// So the check is in two halves: the font is really applied (not merely
// declared), and the page makes no third-party request at all.
import { reporter } from './harness.mjs'

export default async function run(browser, baseUrl, shots) {
  const { ok, fails } = reporter('the typeface – ours, and nobody else is asked')
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e)))

  // Everything the page fetches, from the very first request.
  const foreign = []
  page.on('request', (r) => {
    const u = r.url()
    if (!u.startsWith(baseUrl) && !u.startsWith('data:') && !u.startsWith('blob:')) foreign.push(u)
  })

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.waitForSelector('.kpi-hero')
  await page.waitForTimeout(1200)

  ok(foreign.length === 0,
    'the page fetches nothing from anywhere else (' + (foreign.slice(0, 3).join(', ') || 'no foreign request') + ')')

  const font = await page.evaluate(async () => {
    await document.fonts.ready
    const measure = (family) => {
      const s = document.createElement('span')
      s.style.cssText = 'position:absolute;visibility:hidden;font-size:40px;font-family:' + family
      s.textContent = 'Instruktoren & Prüfer 0,75'
      document.body.appendChild(s)
      const w = s.getBoundingClientRect().width
      s.remove()
      return w
    }
    return {
      declared: getComputedStyle(document.body).fontFamily,
      ready: document.fonts.check('700 16px Mulish'),
      italic: document.fonts.check('italic 400 16px Mulish'),
      mulish: measure("'Mulish'"),
      fallback: measure('system-ui')
    }
  })

  ok(/Mulish/.test(font.declared), 'the body asks for Mulish (' + font.declared.split(',')[0] + ')')
  ok(font.ready === true, '  and the face is actually loaded, not just declared')
  // Declaring a font that never arrives leaves getComputedStyle saying "Mulish"
  // while the text is drawn in the fallback - so measure instead of asking.
  ok(Math.round(font.mulish) !== Math.round(font.fallback),
    '  and the text is really drawn in it (' + Math.round(font.mulish) + 'px vs ' + Math.round(font.fallback) + 'px in system-ui)')
  ok(font.italic === true, 'the italic cut is there too – the chart hints below every card use it')

  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs[0] : ''))
  await page.close()
  return fails
}
