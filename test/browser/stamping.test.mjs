import { reporter, STORAGE_KEY } from './harness.mjs'

export default async function run(browser, baseUrl, shots) {
  const { ok, fails } = reporter('sync – per-record stamps and tombstones')
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e)))
  // The sandbox proxy blocks Google Fonts and Supabase; only our OWN assets
  // failing is a defect.
  page.on('requestfailed', (r) => { if (r.url().startsWith(new URL(baseUrl).origin)) errs.push('own asset failed: ' + r.url()) })

  const KEY = STORAGE_KEY

  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()) })

  const store = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '{}'), KEY)
  const stamps = (d) => Object.fromEntries((d.trainers || []).map((t) => [t.id, t._at]))

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.waitForSelector('.topbar')
  await page.waitForTimeout(600)

  // ---- 1. every seeded record carries a stamp ---------------------------------
  {
    const d = await store()
    const lists = ['trainers', 'providers', 'stages', 'quals', 'assignmentSteps', 'providerCourses', 'providerStatus', 'simVersions']
    const missing = lists.filter((k) => (d[k] || []).some((r) => !r._at))
    ok(missing.length === 0, 'all merged lists are stamped on first load' + (missing.length ? ' – missing in ' + missing.join(', ') : ''))
    ok(d._tomb && typeof d._tomb === 'object', 'the tombstone map exists')
    ok((d.trainers || []).length > 40, 'seed data loaded (' + (d.trainers || []).length + ' trainers)')
  }

  // ---- 2. an edit stamps exactly ONE record ------------------------------------
  {
    const before = stamps(await store())
    await page.locator('.tab', { hasText: 'Umschulung' }).first().click()
    await page.waitForSelector('.conv-card')
    await page.locator('.conv-card .mini-btn').nth(1).click() // move the first card one stage on
    await page.waitForTimeout(700)
    const after = stamps(await store())
    const moved = Object.keys(after).filter((id) => after[id] !== before[id])
    ok(moved.length === 1, 'moving one card re-stamps exactly one trainer (got ' + moved.length + ')')
    ok(Object.keys(after).length === Object.keys(before).length, 'no trainer lost or added')
  }

  // ---- 3. a scalar setting stamps nothing --------------------------------------
  {
    const before = stamps(await store())
    await page.locator('.lang-btn', { hasText: 'EN' }).click()
    await page.waitForTimeout(700)
    const d = await store()
    ok(d.lang === 'en', 'language switched')
    const changed = Object.keys(stamps(d)).filter((id) => stamps(d)[id] !== before[id])
    ok(changed.length === 0, 'switching the language re-stamps no records')
    await page.locator('.lang-btn', { hasText: 'DE' }).click()
    await page.waitForTimeout(500)
  }

  // ---- 4. deleting a record leaves a tombstone ---------------------------------
  {
    await page.locator('.tab', { hasText: 'Provider' }).first().click()
    await page.waitForTimeout(400)
    const before = await store()
    const victim = before.providers[before.providers.length - 1]
    await page.evaluate(() => window.scrollTo(0, 0))
    const row = page.locator('tbody tr').last()
    await row.click()
    await page.waitForSelector('.modal', { timeout: 5000 })
    page.once('dialog', (d) => d.accept())
    const del = page.locator('.modal button', { hasText: /Löschen|Delete/ }).first()
    if (await del.count()) {
      await del.click()
      await page.waitForTimeout(800)
      const after = await store()
      ok(after.providers.length === before.providers.length - 1, 'provider removed from the list')
      ok(!!after._tomb?.providers?.[victim.id], 'deletion left a tombstone for ' + victim.id)
    } else {
      ok(false, 'could not find the delete button in the provider dialog')
    }
  }

  // ---- 5. legacy data without stamps gets backfilled ---------------------------
  {
    await page.evaluate((k) => {
      localStorage.setItem(k, JSON.stringify({
        schema: 2, lang: 'de', theme: 'light',
        trainers: [{ id: 'legacy-1', name: 'Alt, Anna', tlc: 'AAA' }],
        providers: [], stages: [], quals: [], assignmentSteps: [],
        providerCourses: [], providerStatus: [], simVersions: [], otherPilots: [],
        _provSeeded: true, _courseSeed2: true, _provStatus2: true, _qualMerge: true, _roleSeed: true,
        updatedAt: '2026-01-01T00:00:00.000Z'
      }))
    }, KEY)
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForSelector('.topbar')
    await page.waitForTimeout(700)
    const d = await store()
    const t = (d.trainers || []).find((x) => x.id === 'legacy-1')
    ok(!!t, 'legacy record survived the load')
    ok(t?._at === '2026-01-01T00:00:00.000Z', 'unstamped record inherits the blob timestamp, not "now" (' + t?._at + ')')
  }

  // ---- a phase keeps its OWN stamp across a reload ------------------------
  //
  // `migrateStage` used to be a whitelist and dropped `_at`. `stages` is in
  // MERGE_LISTS, where `_at` is the entire basis of the record merge - and
  // `backfillStamps` refills a list wholesale as soon as one member lacks a
  // stamp, so every phase came out carrying the blob's `updatedAt` instead of
  // its own. That turned `stages` into whole-list, last-device-to-touch-
  // anything-wins: rename a phase on one device, merely OPEN the app on
  // another, and the untouched list outranks the rename.
  //
  // So the check is the real pipeline - write a stamp, reload, read it back -
  // because `normalize()` runs on every load and that is where it was lost.
  {
    // Written out in full rather than mapped over whatever is in storage: the
    // checks above leave a deliberately minimal blob behind, and mapping an
    // empty list would have made this pass by testing nothing.
    await page.evaluate((k) => {
      const d = JSON.parse(localStorage.getItem(k) || '{}')
      d.updatedAt = '2030-01-01T00:00:00.000Z' // deliberately far newer than the stage
      d.stages = [
        { id: 'nominated', label: 'Umbenannt', color: '#FD95BC', _at: '2020-05-05T00:00:00.000Z' },
        { id: 'released', label: '737 freigegeben', color: '#970054', _at: '2020-05-05T00:00:00.000Z' }
      ]
      localStorage.setItem(k, JSON.stringify(d))
    }, KEY)
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForSelector('.topbar')
    await page.waitForTimeout(700)

    const after = await store()
    const first = (after.stages || [])[0]
    ok(first?._at === '2020-05-05T00:00:00.000Z',
      'a phase keeps its own stamp through a reload (' + first?._at + ')')
    ok(first?.label === 'Umbenannt', '  and its label with it (' + first?.label + ')')
    // The blob timestamp must NOT have leaked onto it - that was the bug.
    ok(first?._at !== after.updatedAt,
      '  and did not inherit the blob timestamp, which is what erased renames')
    ok((after.stages || []).every((st) => st && st._at), 'every phase carries a stamp at all')
    ok(!('de' in (first || {})) && !('en' in (first || {})),
      '  while the dead keys of the old shape are not carried on')
  }

  // ---- a restore is a restore, not a suggestion ---------------------------
  //
  // `importData` wrote the file's own timestamps straight into the store: the
  // blob kept the backup's old `updatedAt`, every record kept the `_at` it had
  // when the backup was written, and nothing the file REMOVED left a tombstone.
  // Two seconds later the cloud merge ran, and against a row that had moved on
  // the server won nearly every contest - while the screen had already said
  // "Daten erfolgreich importiert."
  //
  // Checked here through the real store, because that is where it was lost:
  // import a deliberately OLD file and read back what the store now holds.
  {
    const oldFile = {
      schema: 2,
      updatedAt: '2019-01-01T00:00:00.000Z',
      lang: 'de',
      trainers: [
        { id: 'keep-1', name: 'Aus dem Backup', tlc: 'BAK', _at: '2019-01-01T00:00:00.000Z' }
      ],
      providers: [],
      otherPilots: []
    }
    // The import lives in the settings, and the file input only exists while
    // that tab is rendered - so go there first rather than hunting for it on
    // whatever tab the checks above left behind.
    await page.locator('.topbar-right button[aria-label="Einstellungen"]').first().click()
    await page.waitForTimeout(900)
    // The confirmation now states what will happen; say yes to it.
    const onConfirm = (d) => d.accept()
    page.on('dialog', onConfirm)

    const res = await page.evaluate(async (payload) => {
      const { file, k } = payload
      const before = JSON.parse(localStorage.getItem(k) || '{}')
      const hadIds = (before.trainers || []).map((t) => t.id)
      // Drive the real path: the file input's onload handler is what the app
      // runs, so hand the store the same object through the same door.
      const input = document.querySelector('input[type="file"]')
      if (!input) return { err: 'no file input' }
      const blob = new Blob([JSON.stringify(file)], { type: 'application/json' })
      const dt = new DataTransfer()
      dt.items.add(new File([blob], 'backup.json', { type: 'application/json' }))
      input.files = dt.files
      input.dispatchEvent(new Event('change', { bubbles: true }))
      await new Promise((r) => setTimeout(r, 900))
      const after = JSON.parse(localStorage.getItem(k) || '{}')
      return { hadIds, after }
    }, { file: oldFile, k: KEY })
    page.off('dialog', onConfirm)

    if (res.err) {
      ok(false, 'the settings page offers a JSON import (' + res.err + ')')
    } else {
      const after = res.after
      const restored = (after.trainers || []).find((t) => t.id === 'keep-1')
      ok(!!restored, 'the record from the backup is in the store (' + (restored?.name || 'missing') + ')')
      // The whole point: it must NOT still carry 2019, or the next pull beats it.
      ok(restored && restored._at > '2020-01-01T00:00:00.000Z',
        '  stamped with now, not with the backup\'s own date (' + restored?._at + ')')
      ok(after.updatedAt > '2020-01-01T00:00:00.000Z',
        '  and so is the dataset itself, so the settings do not revert either (' + after.updatedAt + ')')

      // Everything the file left out has to leave a tombstone, or the other
      // devices simply put it back.
      const tombs = (after._tomb && after._tomb.trainers) || {}
      const dropped = res.hadIds.filter((id) => id !== 'keep-1')
      const tombed = dropped.filter((id) => tombs[id])
      ok(dropped.length > 0, 'the backup really did drop records (' + dropped.length + ')')
      ok(tombed.length === dropped.length,
        '  and every one of them left a tombstone (' + tombed.length + ' of ' + dropped.length + ')')
    }
  }

  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs[0] : ''))
  await page.close()
  return fails
}
