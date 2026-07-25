// Dates must be removable again.
//
// `<input type="date">` gives no way to empty itself on iOS/iPadOS Safari: the
// native picker has no clear affordance and the text is not selectable. Desktop
// Chrome draws a small ✕ of its own, which is why a target date that could
// never be taken back went unnoticed. Every date field now carries its own
// clear button – this checks the button is there, works, and survives a reload.
import { reporter, STORAGE_KEY } from './harness.mjs'

export default async function run(browser, baseUrl, shots) {
  const { ok, fails } = reporter('dates – set, clear, stays cleared')
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } })
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e)))

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.waitForSelector('.kpi-hero')
  await page.waitForTimeout(500)

  // ---- the conversion editor on the Capacity tab --------------------------
  await page.locator('.tab', { hasText: 'Kapazität' }).first().click()
  await page.waitForSelector('.edit-table')
  await page.waitForTimeout(500)

  const firstRow = page.locator('.edit-table tbody tr').first()
  const field = firstRow.locator('.date-field')
  const input = field.locator('input[type="date"]')
  ok(await field.count() === 1, 'the target date is a date field with room for a button')
  ok(await field.locator('.date-clear').count() === 0, 'an empty date shows no clear button (nothing to clear)')

  await input.fill('2026-11-04')
  await page.waitForTimeout(500)
  ok((await input.inputValue()) === '2026-11-04', 'a date can be set (2026-11-04)')
  const clear = field.locator('.date-clear')
  ok(await clear.count() === 1, 'now a clear button appears')
  ok(await clear.getAttribute('type') === 'button',
    'it is type=button – a submit would close the dialog instead of clearing')

  // It has to be reachable on a touch screen, not just present in the DOM.
  const box = await clear.boundingBox()
  ok(box && box.width >= 24 && box.height >= 22, 'and it is big enough to tap (' + Math.round(box.width) + '×' + Math.round(box.height) + ')')

  await clear.click()
  await page.waitForTimeout(600)
  ok((await input.inputValue()) === '', 'clicking it empties the field')
  ok(await field.locator('.date-clear').count() === 0, 'and the button goes away again')

  // The real complaint was that it came back. Check the store, then reload.
  const afterClear = await page.evaluate((KEY) => {
    const d = JSON.parse(localStorage.getItem(KEY))
    return d.trainers.filter((t) => t.conv?.target).length
  }, STORAGE_KEY)
  ok(afterClear === 0, 'the empty value reached storage – no target dates left (' + afterClear + ')')

  await page.reload({ waitUntil: 'networkidle' })
  await page.locator('.tab', { hasText: 'Kapazität' }).first().click()
  await page.waitForSelector('.edit-table')
  await page.waitForTimeout(600)
  ok((await page.locator('.edit-table tbody tr').first().locator('input[type="date"]').inputValue()) === '',
    'and it is still empty after a reload')

  // ---- the same field inside the conversion detail dialog ------------------
  await page.locator('.tab', { hasText: 'Umschulung' }).first().click()
  await page.waitForSelector('.conv-card')
  // The card itself is the drag handle; the name inside it opens the dialog.
  await page.locator('.conv-name').first().click()
  await page.waitForSelector('.modal')
  await page.waitForTimeout(400)
  const modal = page.locator('.modal')
  const modalField = modal.locator('.date-field').first()
  ok(await modalField.count() === 1, 'the detail dialog uses the same field')
  await modalField.locator('input[type="date"]').fill('2026-11-04')
  await page.waitForTimeout(400)
  await modalField.locator('.date-clear').click()
  await page.waitForTimeout(400)
  ok((await modalField.locator('input[type="date"]').inputValue()) === '', 'and clears there too')
  ok(await modal.count() === 1, 'clearing does not close the dialog')

  // ---- every date field in the app is the clearable one --------------------
  const raw = await page.evaluate(() =>
    document.querySelectorAll('input[type="date"]:not(.date-field input)').length)
  ok(raw === 0, 'no bare date input is left anywhere on screen (' + raw + ')')

  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs[0] : ''))
  await page.close()
  return fails
}
