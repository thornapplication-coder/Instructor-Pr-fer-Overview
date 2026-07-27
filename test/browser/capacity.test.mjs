// Provider capacity: seats PER MONTH, overall and per course type.
//
// The free-text "Kapazität / Konditionen" field is gone; whatever was typed
// there moves into the notes rather than being deleted. What replaces it is a
// number that can actually be measured against demand - and a breakdown, because
// a provider's total can look comfortable while the one course everybody needs
// is the bottleneck.
import { reporter, STORAGE_KEY } from './harness.mjs'

export default async function run(browser, baseUrl, shots) {
  const { ok, fails } = reporter('provider capacity – per month, per course type')
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } })
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e)))

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.waitForSelector('.kpi-hero')

  // ---- 1. the free-text field is gone, its content is not ------------------
  await page.evaluate((K) => {
    const d = JSON.parse(localStorage.getItem(K))
    d._capNotes = false
    d.providers = d.providers.map((p, i) => (i === 0 ? { ...p, capacity: '8 Slots pro Quartal, Preis auf Anfrage', notes: '' } : p))
    localStorage.setItem(K, JSON.stringify(d))
  }, STORAGE_KEY)
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  const migrated = await page.evaluate((K) => JSON.parse(localStorage.getItem(K)).providers[0], STORAGE_KEY)
  ok(!migrated.capacity, 'the free-text capacity field is gone from the record')
  ok((migrated.notes || '').includes('8 Slots pro Quartal'),
    'and what was typed in it moved into the notes rather than being deleted (' + migrated.notes + ')')

  await page.locator('.tab', { hasText: 'Provider' }).first().click()
  await page.waitForSelector('.data-table')
  await page.waitForTimeout(400)
  const heads = (await page.locator('.data-table th').allInnerTexts()).map((x) => x.trim().toUpperCase())
  ok(!heads.some((h) => h.includes('KONDITIONEN')), 'and the column is gone from the table (' + heads.join(' | ') + ')')
  ok(heads.some((h) => h.includes('PLÄTZE / MONAT')), 'the capacity column says per month (' + heads.join(' | ') + ')')

  // ---- 2. the dialog takes a total and a breakdown -------------------------
  await page.locator('.data-table tbody tr').first().click()
  await page.waitForSelector('.modal')
  await page.waitForTimeout(400)
  const modal = page.locator('.modal')
  ok((await modal.innerText()).includes('Plätze / Monat (gesamt)'), 'the overall field says per month')
  const cells = modal.locator('.slot-cell')
  ok(await cells.count() >= 4, 'one field per course type (' + (await cells.count()) + ')')
  const labels = (await cells.locator('.slot-name').allInnerTexts()).map((x) => x.trim())
  ok(labels.includes('Type Rating') && labels.includes('TRI-Kurs'),
    'named after the planning steps, so demand and capacity are the same thing (' + labels.join(', ') + ')')

  await cells.nth(0).locator('input').fill('2')
  await cells.nth(1).locator('input').fill('5')
  await page.waitForTimeout(300)
  ok((await modal.innerText()).includes('ergibt 7'), 'the dialog adds the breakdown up for you')
  await modal.locator('.btn-primary', { hasText: 'Speichern' }).click()
  await page.waitForTimeout(600)

  const saved = await page.evaluate((K) => JSON.parse(localStorage.getItem(K)).providers.find((p) => p.slotsByStep && Object.values(p.slotsByStep).some(Boolean)), STORAGE_KEY)
  ok(!!saved, 'the breakdown reached storage')
  ok(Object.values(saved.slotsByStep).filter(Boolean).length === 2,
    'with one entry per course type that was filled in (' + JSON.stringify(saved.slotsByStep) + ')')

  // ---- 3. a breakdown over the total warns, it does not block --------------
  await page.locator('.data-table tbody tr').first().click()
  await page.waitForSelector('.modal')
  await page.waitForTimeout(400)
  await page.locator('.modal .field', { hasText: 'Plätze / Monat (gesamt)' }).locator('input').fill('3')
  await page.waitForTimeout(400)
  ok((await page.locator('.modal').innerText()).includes('übersteigt die Gesamtkapazität'),
    'a breakdown promising more than the total is called out')
  ok(await page.locator('.modal .slot-cell input').first().isEnabled(), 'and nothing is disabled – it is a warning, not a block')
  await page.locator('.modal .btn-primary', { hasText: 'Speichern' }).click()
  await page.waitForTimeout(600)

  // ---- 4. demand meets capacity per course type ---------------------------
  await page.evaluate((K) => {
    const d = JSON.parse(localStorage.getItem(K))
    const pid = d.providers.find((p) => p.slotsByStep && Object.values(p.slotsByStep).some(Boolean)).id
    const step = d.assignmentSteps[0].id
    let n = 0
    d.trainers = d.trainers.map((t) =>
      n++ < 4 ? { ...t, assignments: { ...t.assignments, [step]: { ...(t.assignments?.[step] || {}), providerId: pid, status: 'booked' } } } : t
    )
    localStorage.setItem(K, JSON.stringify(d))
  }, STORAGE_KEY)
  await page.reload({ waitUntil: 'networkidle' })
  await page.locator('.tab', { hasText: 'Provider' }).first().click()
  const cap = page.locator('.card').filter({ hasText: 'Kapazität & Auslastung' }).first()
  await cap.waitFor()
  await page.waitForTimeout(500)
  // Demand is the whole open backlog and the seats are a MONTHLY figure, so the
  // chip reads as months. Four people against two seats a month is two months –
  // normal for a phase-in, and deliberately NOT flagged: flagging "more than one
  // month" would put a red mark on every provider forever.
  const chip = cap.locator('.type-tag').first()
  const chipText = (await chip.innerText()).trim()
  ok(chipText.includes('/'), 'the chip shows demand against seats per month (' + chipText + ')')
  ok(/\d+\s*Mon\./.test(chipText), 'and how many months that backlog needs (' + chipText + ')')
  ok(await cap.locator('.type-tag.over').count() === 0, 'a two-month backlog is not flagged red')

  // Raise the backlog past three months and it is.
  await page.evaluate((K) => {
    const d = JSON.parse(localStorage.getItem(K))
    const p = d.providers.find((x) => x.slotsByStep && Object.values(x.slotsByStep).some(Boolean))
    const step = d.assignmentSteps[0].id
    let n = 0
    d.trainers = d.trainers.map((t) =>
      n++ < 20 ? { ...t, assignments: { ...t.assignments, [step]: { ...(t.assignments?.[step] || {}), providerId: p.id, status: 'booked' } } } : t
    )
    localStorage.setItem(K, JSON.stringify(d))
  }, STORAGE_KEY)
  await page.reload({ waitUntil: 'networkidle' })
  await page.locator('.tab', { hasText: 'Provider' }).first().click()
  const cap2 = page.locator('.card').filter({ hasText: 'Kapazität & Auslastung' }).first()
  await cap2.waitFor()
  await page.waitForTimeout(500)
  ok(await cap2.locator('.type-tag.over').count() >= 1,
    'twenty people against two seats a month is flagged (' + (await cap2.locator('.type-tag.over').first().innerText()).trim() + ')')

  await cap.screenshot({ path: shots + '/prov-capacity.png' })
  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs[0] : ''))
  await page.close()
  return fails
}
