// What an iPhone walkthrough turned up, checked where it actually lives: in
// the rendered app.
//
// Every one of these was invisible to the logic tests. A dialog whose first
// Enter closes it, a filter that has no counter, a view that forgets itself
// when you glance at the dashboard - none of that is a wrong number, it is a
// wrong screen, and only a browser has screens.
import { reporter, STORAGE_KEY } from './harness.mjs'

export default async function run(browser, baseUrl, shots) {
  const { ok, fails } = reporter('the iPhone walkthrough – focus, flags, memory')
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e)))

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.waitForSelector('.kpi-hero')
  await page.waitForTimeout(600)

  // ---- 1. a dialog opens on its content, not on its close button ----------
  await page.locator('.tab', { hasText: 'Trainer' }).first().click()
  await page.waitForSelector('.trainer-table tbody tr')
  await page.waitForTimeout(400)
  await page.locator('.trainer-table tbody tr').first().click()
  await page.waitForSelector('.modal')
  await page.waitForTimeout(500)

  const focused = await page.evaluate(() => {
    const a = document.activeElement
    return {
      tag: a ? a.tagName.toLowerCase() : '',
      cls: a ? a.className : '',
      inBody: !!(a && a.closest('.modal-body')),
      inHead: !!(a && a.closest('.modal-head'))
    }
  })
  ok(focused.inBody, 'the focus lands inside the dialog body (' + focused.tag + '.' + focused.cls + ')')
  ok(!focused.inHead, '  and not on the ✕ in the header, where Enter would shut the dialog again')

  const named = await page.evaluate(() => {
    const h = document.querySelector('.modal')
    const id = h && h.getAttribute('aria-labelledby')
    const el = id ? document.getElementById(id) : null
    return el ? el.textContent.trim() : ''
  })
  ok(named.length > 0, 'and the dialog carries its own title as its name ("' + named + '")')

  // ---- 2. leaving with unsaved changes asks first -------------------------
  const nameInput = page.locator('.modal .form-grid .field').first().locator('input').first()
  await nameInput.fill('ÄNDERUNG OHNE SPEICHERN')
  await page.waitForTimeout(300)

  // Playwright dismisses a confirm() unless told otherwise – i.e. "no, keep
  // the dialog open". That is exactly the case worth checking first.
  let asked = 0
  const onDialog = (d) => { asked += 1; d.dismiss() }
  page.on('dialog', onDialog)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)
  ok(asked === 1, 'Escape on a changed form asks before throwing the typing away')
  ok(await page.locator('.modal').count() === 1, '  and saying no keeps the dialog, with the text still in it')
  ok((await nameInput.inputValue()) === 'ÄNDERUNG OHNE SPEICHERN', '  the typed name survived the question')
  page.off('dialog', onDialog)

  // Say yes this time.
  const onAccept = (d) => d.accept()
  page.on('dialog', onAccept)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)
  ok(await page.locator('.modal').count() === 0, 'saying yes closes it')
  page.off('dialog', onAccept)

  const stored = await page.evaluate((K) => JSON.parse(localStorage.getItem(K)).trainers.some(
    (t) => (t.name || '').includes('ÄNDERUNG OHNE SPEICHERN')), STORAGE_KEY)
  ok(!stored, '  and nothing of the discarded edit reached storage')

  // An UNCHANGED dialog must not ask – a guard that fires on every close is a
  // guard nobody reads after the third time.
  await page.locator('.trainer-table tbody tr').first().click()
  await page.waitForSelector('.modal')
  await page.waitForTimeout(400)
  let asked2 = 0
  const onAny = (d) => { asked2 += 1; d.accept() }
  page.on('dialog', onAny)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)
  ok(asked2 === 0 && await page.locator('.modal').count() === 0,
    'a dialog that was only READ closes without a question')
  page.off('dialog', onAny)

  // ---- 3. the board says how many need looking at, and can show only those --
  await page.locator('.tab', { hasText: 'Umschulung' }).first().click()
  await page.waitForSelector('.conv-card', { timeout: 8000 })
  await page.waitForTimeout(600)

  // Give two people a target date in the past so there is something to flag.
  const flagged = await page.evaluate((K) => {
    const d = JSON.parse(localStorage.getItem(K))
    const conv = d.trainers.filter((t) => ['SEN', 'TRE', 'TRI', 'LTC'].includes(t.qual) &&
      (t.staffType || 'internal') !== 'external')
    const ids = conv.slice(0, 2).map((t) => t.id)
    d.trainers = d.trainers.map((t) =>
      ids.includes(t.id) ? { ...t, conv: { ...(t.conv || {}), stage: 'simulator', target: '2020-01-01' } } : t)
    localStorage.setItem(K, JSON.stringify(d))
    return ids.length
  }, STORAGE_KEY)
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('.conv-card', { timeout: 8000 })
  await page.waitForTimeout(700)

  const pill = page.locator('.alert-pill.overdue')
  ok(await pill.count() === 1, 'the overdue counter appears once there is anything to count')
  ok((await pill.innerText()).includes(String(flagged)),
    '  and it states the number (' + (await pill.innerText()).replace(/\n/g, ' ') + ')')

  const before = await page.locator('.conv-card').count()
  await pill.click()
  await page.waitForTimeout(500)
  const after = await page.locator('.conv-card').count()
  ok(after === flagged && after < before,
    'tapping it leaves only the flagged cards standing (' + after + ' of ' + before + ')')
  ok(await page.locator('.alert-pill.overdue.on').count() === 1, '  and the counter shows it is pressed')
  await pill.click()
  await page.waitForTimeout(500)
  ok(await page.locator('.conv-card').count() === before, 'tapping again brings them all back')

  const tap = await pill.boundingBox()
  ok(tap && tap.height >= 44, 'it is a real touch target on a phone (' + Math.round(tap?.height || 0) + 'px tall)')

  // ---- 4. the view inside "Umschulung" is remembered ----------------------
  await page.locator('.hub-bar .seg-btn', { hasText: 'Planung' }).first().click()
  await page.waitForTimeout(700)
  ok(page.url().includes('/conversion/table'), 'the chosen view is written into the address (' + page.url().split('#')[1] + ')')

  await page.locator('.tab', { hasText: 'Dashboard' }).first().click()
  await page.waitForSelector('.kpi-hero')
  await page.waitForTimeout(500)
  await page.locator('.tab', { hasText: 'Umschulung' }).first().click()
  await page.waitForTimeout(800)
  const stillPlanning = await page.locator('.hub-bar .seg-btn.active').first().innerText()
  ok(/planung/i.test(stillPlanning),
    'a glance at the dashboard and back does not drop you onto the board (' + stillPlanning.trim() + ')')

  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('.hub-bar')
  await page.waitForTimeout(800)
  const afterReload = await page.locator('.hub-bar .seg-btn.active').first().innerText()
  ok(/planung/i.test(afterReload), '  and a reload keeps it too (' + afterReload.trim() + ')')

  // ---- 5. controls a screen reader can name ------------------------------
  await page.locator('.tab', { hasText: 'Provider' }).first().click()
  await page.waitForSelector('.provider-table, .empty-state')
  await page.waitForTimeout(600)
  await page.locator('.provider-table tbody tr').first().click()
  await page.waitForSelector('.modal')
  await page.waitForTimeout(600)

  const nameless = await page.evaluate(() => {
    const out = []
    document.querySelectorAll('.modal select, .modal input:not([type="checkbox"]):not([type="color"])').forEach((el) => {
      const has = el.getAttribute('aria-label') ||
        el.closest('label') ||
        (el.id && document.querySelector('label[for="' + el.id + '"]')) ||
        el.getAttribute('placeholder')
      if (!has) out.push(el.className + ':' + el.tagName)
    })
    return out
  })
  ok(nameless.length === 0, 'every control in the provider dialog has a name (' + (nameless.join(', ') || 'none nameless') + ')')

  // The ✕ of the dialog itself says what it does, in the interface language.
  const closeLabel = await page.locator('.modal .modal-head .icon-btn').first().getAttribute('aria-label')
  ok(closeLabel === 'Schließen', 'the close button is named in German ("' + closeLabel + '")')
  await page.locator('.modal .modal-foot .btn-ghost').first().click()
  await page.waitForTimeout(400)

  // ---- 6. an empty result says WHY it is empty ---------------------------
  await page.locator('.tab', { hasText: 'Trainer' }).first().click()
  await page.waitForSelector('.trainer-table')
  await page.waitForTimeout(500)
  await page.locator('.toolbar .search').first().fill('ZZZ-GIBT-ES-NICHT')
  await page.waitForTimeout(600)
  const emptyText = await page.locator('.trainer-table .empty-row').first().innerText()
  ok(/filter/i.test(emptyText), 'an empty result blames the filter, not the roster ("' + emptyText.split('\n')[0] + '")')
  const reset = page.locator('.trainer-table .empty-row button')
  ok(await reset.count() === 1, '  and offers the way out')
  await reset.click()
  await page.waitForTimeout(600)
  ok(await page.locator('.trainer-table tbody tr').count() > 1, '  which brings everybody back')

  // ---- 7. what an external trainer cannot have is off the card entirely ----
  //
  // Not "empty": absent. On a card there is no column header - a caption over a
  // dash reads as a field somebody forgot to fill in, which is the opposite of
  // what it means. The dialog stops asking for the same two, as it already did
  // for the conversion block.
  await page.evaluate((K) => {
    const d = JSON.parse(localStorage.getItem(K))
    d.trainers = d.trainers.map((t, i) => i === 0
      ? { ...t, name: 'AAA Extern Karte', staffType: 'external', ore: 'A',
          seniority: '2016-04-15', conv: { stage: 'simulator', status: 'on_track' } }
      : t)
    localStorage.setItem(K, JSON.stringify(d))
  }, STORAGE_KEY)
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('.trainer-table tbody tr')
  await page.waitForTimeout(700)

  const cards = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.trainer-table tbody tr')]
    const shown = (r) => [...r.querySelectorAll('td')]
      .filter((td) => getComputedStyle(td).display !== 'none')
      .map((td) => td.getAttribute('data-label') || '')
    const ext = rows.find((r) => /Extern Karte/.test(r.innerText))
    const own = rows.find((r) => !r.querySelector('.ext-badge'))
    return {
      ext: shown(ext), own: shown(own),
      extH: Math.round(ext.getBoundingClientRect().height),
      ownH: Math.round(own.getBoundingClientRect().height)
    }
  })
  const gone = ['ORE A–C', 'Seniorität', 'Umschulung']
  const stillThere = gone.filter((g) => cards.ext.some((l) => l && l.includes(g.split(' ')[0])))
  ok(stillThere.length === 0,
    'ORE, Seniorität and Umschulung are off the external card (' + (stillThere.join(', ') || 'all three gone') + ')')
  const ownHas = gone.filter((g) => cards.own.some((l) => l && l.includes(g.split(' ')[0])))
  ok(ownHas.length === 3, '  and all three are still on the card of one of our own (' + ownHas.length + ' of 3)')
  ok(cards.extH < cards.ownH,
    '  the external card is shorter for it, with no line left standing empty (' +
    cards.extH + 'px vs ' + cards.ownH + 'px)')

  await page.locator('.trainer-table tbody tr').filter({ hasText: 'Extern Karte' }).first().click()
  await page.waitForSelector('.modal')
  await page.waitForTimeout(500)
  const dlg = await page.locator('.modal').innerText()
  ok(!dlg.includes('Seniorität') && !dlg.includes('ORE'),
    '  and the dialog does not ask for either of them')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  // ---- 8. the four groups that are not one of our trainer grades ----------
  //
  // They used to sit at the tail of the qualification chart as four empty
  // tracks. A bar has no length for nothing, so an empty track reads as a
  // chart that failed rather than as an answer of "none" - which is why these
  // four are figures, and why the check is that they survive being at zero.
  await page.locator('.tab', { hasText: 'Dashboard' }).first().click()
  await page.waitForSelector('.kpi-hero')
  await page.waitForTimeout(700)

  const otherCard = page.locator('.card', { hasText: 'Externe & Nicht-Trainer' }).first()
  ok(await otherCard.count() === 1, 'the dashboard has a card of its own for the four groups')
  const zeroText = await otherCard.innerText()
  ok(['TRE extern', 'TRI extern', 'No Trainer', 'EIS Pilot'].every((g) => zeroText.includes(g)),
    '  naming all four, with nobody in any of them yet')
  ok((await otherCard.locator('.group-tile').count()) === 4,
    '  as four figures rather than four empty bars')

  // Fill them and read the figures back.
  await page.evaluate((K) => {
    const d = JSON.parse(localStorage.getItem(K))
    const want = ['TREX', 'TREX', 'TRIX', 'NOTR']
    let n = 0
    d.trainers = d.trainers.map((t) => (n < want.length ? { ...t, qual: want[n++], fte: n === 2 ? 0.5 : 1 } : t))
    localStorage.setItem(K, JSON.stringify(d))
  }, STORAGE_KEY)
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('.kpi-hero')
  await page.waitForTimeout(800)

  const filled = page.locator('.card', { hasText: 'Externe & Nicht-Trainer' }).first()
  const tiles = await filled.locator('.group-tile').evaluateAll((els) =>
    els.map((e) => ({
      label: e.querySelector('.group-tile-label').innerText.trim(),
      value: e.querySelector('.group-tile-value').innerText.trim(),
      sub: e.querySelector('.group-tile-sub').innerText.trim(),
      empty: e.classList.contains('is-empty')
    })))
  const trex = tiles.find((x) => x.label === 'TRE extern')
  ok(trex && trex.value === '2', 'the counts are the real ones (TRE extern = ' + trex?.value + ')')
  ok(trex && trex.sub === '1,5 FTE',
    '  and the FTE beside them is formatted like every other FTE on the page (' + trex?.sub + ')')
  ok(tiles.find((x) => x.label === 'EIS Pilot')?.empty === true,
    '  a group still at zero stays visible and steps back rather than vanishing')
  ok((await filled.locator('.card-total').innerText()).includes('4'),
    '  and the card total is the four groups together, not the whole roster')

  const geom = await page.evaluate(() => {
    const tilesEls = [...document.querySelectorAll('.group-tile')]
    return {
      worst: Math.max(0, ...tilesEls.map((e) => e.scrollWidth - e.clientWidth)),
      page: document.documentElement.scrollWidth - document.documentElement.clientWidth
    }
  })
  ok(geom.worst === 0 && geom.page === 0,
    '  and nothing overflows at phone width (' + geom.worst + 'px / ' + geom.page + 'px)')

  // ---- 9. one notation for one kind of figure -----------------------------
  //
  // The trainer row printed its FTE through a formatter that took no language
  // at all, so a part-time 0.8 sat with a dot on the same screen as the
  // dashboard's 44,7 - the mixed-notation defect the changelog already
  // recorded once and believed fixed.
  await page.locator('.tab', { hasText: 'Trainer' }).first().click()
  await page.waitForSelector('.trainer-table tbody tr')
  await page.waitForTimeout(600)
  const ftes = await page.locator('.trainer-table td.t-fte').allInnerTexts()
  const dotted = ftes.filter((x) => /\d\.\d/.test(x))
  ok(dotted.length === 0, 'no FTE on the trainer list prints with a dot in German (' + (dotted.join(', ') || 'none') + ')')
  ok(ftes.some((x) => /,/.test(x)), '  and the fractional ones really are there to get wrong (' +
    [...new Set(ftes)].slice(0, 6).join(' ') + ')')

  // ---- 10. the capacity tables can still be sorted on a phone -------------
  //
  // Below 1000px the header row is display:none, so every Th goes with it and
  // `toggle` becomes unreachable. Each card table carries a SortSelect for
  // exactly that; Kapazität was the one that never got one.
  await page.locator('.tab', { hasText: 'Kapazität' }).first().click()
  await page.waitForSelector('.cap-table')
  await page.waitForTimeout(700)
  const pickers = await page.locator('.sort-select:visible').count()
  ok(pickers >= 3, 'each capacity table offers a sort picker once its header row is gone (' + pickers + ')')

  const ids = await page.locator('.sort-select select').evaluateAll((els) => els.map((e) => e.id))
  ok(new Set(ids).size === ids.length, '  and each one has an id of its own, so its label points at it (' + ids.length + ' selects, ' + new Set(ids).size + ' ids)')

  const firstPick = page.locator('.sort-select select').first()
  const orderBefore = await page.locator('.cap-table tbody tr td.cp-key').first().innerText()
  await firstPick.selectOption({ index: 2 })
  await page.waitForTimeout(500)
  const orderAfter = await page.locator('.cap-table tbody tr td.cp-key').first().innerText()
  ok(orderBefore !== orderAfter,
    '  and picking another order really reorders the rows (' + orderBefore.trim() + ' -> ' + orderAfter.trim() + ')')

  // ---- 9. a finger is not a mouse pointer --------------------------------
  //
  // Measured at this width, twenty-five controls were under 44px tall. Where
  // the layout could absorb it the box grew; inside the tables whose width is
  // pinned to the pixel it could not, so an invisible ::after carries the hit
  // area instead. The box therefore still measures 30x26 there ON PURPOSE -
  // what has to be 44 is what the finger can reach, so this hit-tests rather
  // than measures.
  await page.locator('.tab', { hasText: 'Umschulung' }).first().click()
  await page.waitForSelector('.conv-card', { timeout: 8000 })
  await page.waitForTimeout(700)

  const reach = await page.evaluate(() => {
    const probe = (sel) => {
      const el = document.querySelector(sel)
      if (!el) return null
      el.scrollIntoView({ block: 'center' })
      const b = el.getBoundingClientRect()
      const cx = b.x + b.width / 2
      const cy = b.y + b.height / 2
      if (cy < 0 || cy > window.innerHeight) return null
      const hits = (dy) => {
        const t = document.elementFromPoint(cx, cy + dy)
        return !!(t && (t === el || el.contains(t)))
      }
      let up = 0
      let down = 0
      while (up < 40 && hits(-(up + 1))) up++
      while (down < 40 && hits(down + 1)) down++
      return { box: Math.round(b.height), reach: up + down + 1 }
    }
    return { name: probe('.conv-name'), arrow: probe('.conv-card .mini-btn') }
  })

  ok(reach.name && reach.name.reach >= 44,
    'the name on a board card can be hit over 44px, though it draws ' +
    (reach.name?.box || '?') + 'px (' + (reach.name?.reach || 0) + 'px reachable)')
  ok(reach.arrow && reach.arrow.reach >= 44,
    '  and so can the phase arrow beside it (' + (reach.arrow?.reach || 0) + 'px reachable)')

  const grown = await page.evaluate(() => {
    const h = (sel) => {
      const el = document.querySelector(sel)
      return el ? Math.round(el.getBoundingClientRect().height) : 0
    }
    return { seg: h('.seg-btn'), round: h('.icon-round'), btn: h('.btn') }
  })
  ok(grown.seg >= 44 && grown.round >= 44 && grown.btn >= 44,
    'the controls that had room simply grew (view switch ' + grown.seg +
    'px, topbar ' + grown.round + 'px, buttons ' + grown.btn + 'px)')

  // ---- 10. the two ways that were there but unsignposted -----------------
  //
  // Export existed only behind the gear - an icon that means "settings", not
  // "download" - and the short conversion editor existed only on the board.
  // Both now have a door on the tab that asks the question.
  await page.locator('.tab', { hasText: 'Trainer' }).first().click()
  await page.waitForSelector('.trainer-table tbody tr')
  await page.waitForTimeout(600)

  ok(await page.locator('.export-link').count() === 1, 'the Trainer tab has an export button of its own')
  await page.locator('.export-link').first().click()
  await page.waitForTimeout(1500)
  const landed = await page.evaluate(() => {
    const row = document.querySelector('.dl-row.is-target')
    const b = row && row.getBoundingClientRect()
    return {
      hash: window.location.hash,
      which: row && row.getAttribute('data-export'),
      inView: !!b && b.top > -10 && b.bottom < window.innerHeight + 10
    }
  })
  ok(landed.which === 'trainers', '  and it opens the settings AT the trainer row (' + landed.which + ')')
  ok(landed.inView, '  scrolled to where it can be read, not merely present in the page')
  ok(landed.hash === '#/settings/trainers', '  the row is named in the address (' + landed.hash + ')')

  // The phase badge in a trainer row edits the phase.
  await page.locator('.tab', { hasText: 'Trainer' }).first().click()
  await page.waitForSelector('.trainer-table tbody tr')
  await page.waitForTimeout(600)
  // Read the name from the row that OWNS the first badge, not from the first
  // row: the checks above turned the top of the list external, and an external
  // row has no phase badge at all - so the two were different people and the
  // title never matched.
  const who = await page.evaluate(() => {
    const btn = document.querySelector('.stage-btn')
    const row = btn && btn.closest('tr')
    return row ? row.querySelector('.t-name').innerText.split('\n')[0].trim() : ''
  })
  const stageBefore = await page.evaluate((n) => {
    const d = JSON.parse(localStorage.getItem('ewl737:data:v1'))
    return (d.trainers.find((x) => x.name === n) || {}).conv?.stage
  }, who)

  await page.locator('.stage-btn').first().click()
  await page.waitForSelector('.modal')
  await page.waitForTimeout(600)
  const short = await page.evaluate(() => {
    const m = document.querySelector('.modal')
    const body = m.querySelector('.modal-body')
    return {
      title: m.querySelector('h3').innerText.trim(),
      fields: [...m.querySelectorAll('.field-label')].map((e) => e.innerText.trim()),
      scroll: body.scrollHeight - body.clientHeight
    }
  })
  ok(short.title === who, 'the phase badge opens the short editor, titled with the person (' + short.title + ')')
  ok(short.fields.length === 4, '  four fields, not fifteen (' + short.fields.join(', ') + ')')
  ok(short.scroll === 0, '  and nothing to scroll past to reach them (' + short.scroll + 'px)')

  await page.locator('.modal .field', { hasText: 'Phase' }).first().locator('select').selectOption({ index: 3 })
  await page.locator('.modal .btn-primary').first().click()
  await page.waitForTimeout(900)
  const stageAfter = await page.evaluate((n) => {
    const d = JSON.parse(localStorage.getItem('ewl737:data:v1'))
    return (d.trainers.find((x) => x.name === n) || {}).conv?.stage
  }, who)
  ok(stageAfter && stageAfter !== stageBefore,
    '  and saving really moves the phase (' + stageBefore + ' -> ' + stageAfter + ')')

  // The row itself must still open the whole record - the badge is an extra
  // door, not a replacement, and stopPropagation is what keeps both working.
  await page.locator('.trainer-table tbody tr').first().click()
  await page.waitForSelector('.modal')
  await page.waitForTimeout(500)
  const full = await page.locator('.modal h3').innerText()
  ok(/bearbeiten/i.test(full), 'tapping the row still opens the full record (' + full + ')')
  await page.locator('.modal .modal-foot .btn-ghost').first().click()
  await page.waitForTimeout(300)

  // ---- 11. filters that survive the tab, and say that they did -----------
  //
  // The list is fourteen screens long, so re-typing the search after every
  // glance at another tab was a real tax. Keeping it is only half the change:
  // a list that silently opens filtered is worse than one that forgets, so the
  // notice is part of the same check.
  await page.locator('.tab', { hasText: 'Trainer' }).first().click()
  await page.waitForSelector('.trainer-table tbody tr')
  await page.waitForTimeout(600)
  const allRows = await page.locator('.trainer-table tbody tr').count()
  await page.locator('.toolbar .search').first().fill('Kubiak')
  await page.waitForTimeout(700)
  const narrowed = await page.locator('.trainer-table tbody tr').count()
  ok(narrowed < allRows, 'the search narrows the list (' + narrowed + ' of ' + allRows + ')')

  const note = page.locator('.filter-note')
  ok(await note.count() === 1, '  and says so, where the counter is')
  const noteText = (await note.first().innerText()).replace(/\n/g, ' ')
  ok(/\d/.test(noteText), '  naming how much is hidden ("' + noteText + '")')

  await page.locator('.tab', { hasText: 'Dashboard' }).first().click()
  await page.waitForSelector('.kpi-hero')
  await page.waitForTimeout(500)
  await page.locator('.tab', { hasText: 'Trainer' }).first().click()
  await page.waitForSelector('.trainer-table')
  await page.waitForTimeout(700)
  ok((await page.locator('.toolbar .search').first().inputValue()) === 'Kubiak',
    'a glance at another tab and back keeps the search')
  ok((await page.locator('.trainer-table tbody tr').count()) === narrowed, '  and the list with it')

  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('.trainer-table')
  await page.waitForTimeout(800)
  ok((await page.locator('.toolbar .search').first().inputValue()) === 'Kubiak', '  a reload keeps it too')

  await page.locator('.filter-note button').first().click()
  await page.waitForTimeout(700)
  ok((await page.locator('.toolbar .search').first().inputValue()) === '', 'clearing empties the search')
  ok((await page.locator('.trainer-table tbody tr').count()) === allRows, '  and brings everybody back')
  ok(await page.locator('.filter-note').count() === 0, '  and the notice goes with it')

  // It must NOT reach the synced data - what somebody is searching for is not
  // a fact about the roster and has no business on another device.
  const leaked = await page.evaluate(() => {
    const raw = localStorage.getItem('ewl737:data:v1') || ''
    return raw.includes('Kubiak') && /"q"\s*:/.test(raw)
  })
  ok(!leaked, '  and the filter never entered the synced store')

  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs[0] : ''))
  await page.screenshot({ path: shots + '/uxfixes-board.png' })
  await page.close()
  return fails
}
