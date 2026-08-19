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
  //
  // "Nothing at all" would be the wrong bar: the app really does call its own
  // Supabase project on load - that is the cloud sync, and the shared-link
  // viewer reads through the same path while signed out. The first cut of this
  // check forbade every foreign request and passed only because it happened to
  // look before the sync fired. So the rule is by HOST: our own origin and the
  // one configured backend are expected; anything else is a third party this
  // app has no business talking to.
  // The backend is matched by host rather than imported from cloudConfig.js:
  // that module reads `import.meta.env`, which exists only inside Vite, so
  // plain node cannot load it. A *.supabase.co host is this app's own backend
  // by construction - anything else is a third party.
  const ours = (u) => u.startsWith(baseUrl) || /^https:\/\/[a-z0-9-]+\.supabase\.co\//.test(u)
  const foreign = []
  page.on('request', (r) => {
    const u = r.url()
    if (u.startsWith('data:') || u.startsWith('blob:')) return
    if (ours(u)) return
    foreign.push(u)
  })

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.waitForSelector('.kpi-hero')
  await page.waitForTimeout(1200)

  ok(foreign.length === 0,
    'the page asks nobody but itself and its own backend (' +
    (foreign.slice(0, 3).join(', ') || 'no third-party request') + ')')
  // Named explicitly as well as covered by the rule above: this is the one the
  // whole change is about, and a future "just this once" CDN link should trip a
  // check that says so by name.
  ok(!foreign.some((u) => /googleapis|gstatic/.test(u)),
    '  and Google in particular is not asked for the typeface any more')

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
