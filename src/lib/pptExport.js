// The dashboard as a slide deck.
//
// Not a second implementation of the dashboard: the deck is the dashboard,
// photographed card by card. Rebuilding the charts as native PowerPoint shapes
// would mean a second set of numbers that can disagree with the screen, and
// this project has paid for that kind of duplicate once already (see the FTE
// notes in CLAUDE.md). What is on the slide is exactly what the app renders.
//
// The order is the user's own: `captureTabCards` walks the rendered tab in DOM
// order, and that order is what "⠿ Anordnen" stores.
import { APP_VERSION } from '../version.js'
import { BRAND } from './palette.js'

// 16:9, in inches - the shape every projector and every Teams call expects.
const W = 13.333
const H = 7.5
const MARGIN = 0.45
const HEAD = 0.85

function stamp(lang) {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return lang === 'de'
    ? `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`
    : `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/**
 * Build the deck and hand it to the browser.
 *
 * `cards` is what captureTabCards returned: { title, section, canvas }.
 * Returns the number of slides written, or 0 if there was nothing to write -
 * the caller says so rather than downloading an empty file.
 */
export async function exportDashboardPptx(cards, t, lang) {
  const list = (cards || []).filter((c) => c && c.canvas)
  if (!list.length) return 0

  const PptxGenJS = (await import('pptxgenjs')).default
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_16x9'
  pptx.author = 'Eurowings'
  pptx.title = t('tab_dashboard')
  pptx.subject = t('appTitle')

  const dateStr = stamp(lang)

  for (const card of list) {
    const slide = pptx.addSlide()

    // The heading band, in the brand burgundy the app's own top bar uses.
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: W, h: HEAD, fill: { color: BRAND.burgundy.replace('#', '') }, line: { width: 0 }
    })
    slide.addText(card.title || t('tab_dashboard'), {
      x: MARGIN, y: 0.12, w: W - 2 * MARGIN - 2.6, h: HEAD - 0.24,
      fontSize: 22, bold: true, color: 'FFFFFF', valign: 'middle'
    })
    // The section a figure belongs to. Without it "50" and "47" look like a
    // contradiction instead of two different populations. Skipped when it IS
    // the title - the band slides carry the section as their heading, and the
    // same words twice on one slide reads as a mistake.
    if (card.section && card.section !== card.title) {
      slide.addText(card.section, {
        x: W - MARGIN - 2.6, y: 0.12, w: 2.6, h: HEAD - 0.24,
        fontSize: 12, color: 'FFFFFF', align: 'right', valign: 'middle'
      })
    }

    // The card itself, scaled to fit whole - never cropped, never stretched.
    const availW = W - 2 * MARGIN
    const availH = H - HEAD - MARGIN - 0.35
    const ratio = card.canvas.width / card.canvas.height
    let w = availW
    let h = w / ratio
    if (h > availH) { h = availH; w = h * ratio }
    slide.addImage({
      data: card.canvas.toDataURL('image/png'),
      x: MARGIN + (availW - w) / 2,
      y: HEAD + 0.2 + (availH - h) / 2,
      w,
      h
    })

    slide.addText(`${t('appTitle')} · ${dateStr} · v${APP_VERSION}`, {
      x: MARGIN, y: H - 0.42, w: availW, h: 0.3,
      fontSize: 9, color: '8A9199', align: 'right'
    })
  }

  await pptx.writeFile({ fileName: `dashboard-${new Date().toISOString().slice(0, 10)}.pptx` })
  return list.length
}
