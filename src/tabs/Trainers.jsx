import React, { useMemo, useRef, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import ExportLink from '../components/ExportLink.jsx'
import ConvDetail from '../components/ConvDetail.jsx'
import { AircraftTag, OreTag, RoleTag } from '../components/tags.jsx'
import DateInput from '../components/DateInput.jsx'
import Modal from '../components/Modal.jsx'
import CategoryManager from '../components/CategoryManager.jsx'
import { useSort, Th, SortSelect } from '../components/sortable.jsx'
import { formatPartTime, formatDate, classNames, fteFromPartTime, formatFte } from '../lib/format.js'
import { CONV_STATUS, STAFF_TYPE, stageLabel, stageIndex } from '../data/pipeline.js'
import { OVERFLOW } from '../lib/palette.js'
import { useThemed } from '../lib/useThemed.js'
import { qualIndex, qualLabel, convertsAtAll, isOwnStaff } from '../data/qualifications.js'
import { labelOf } from '../data/lists.js'
import { AIRCRAFT } from '../data/aircraft.js'

const ORE_RANK = { A: 0, B: 1, C: 2 }
const alpha = (arr) => [...arr].sort((a, b) => String(a).localeCompare(String(b)))

const ORES = ['A', 'B', 'C', '']

// Cockpit role: everyone is a Captain unless explicitly marked First Officer.
const roleOf = (x) => (x.role === 'fo' ? 'fo' : 'captain')

function ptToInput(pt) {
  if (pt === '' || pt === null || pt === undefined) return ''
  if (typeof pt === 'number') return pt >= 1 ? 'VZ' : Math.round(pt * 100) + '%'
  return String(pt)
}
function ptFromInput(v) {
  const s = String(v || '').trim()
  if (s === '' || s.toUpperCase() === 'VZ') return s === '' ? '' : 'VZ'
  const pct = /^(\d+)\s*%$/.exec(s)
  if (pct) return Number(pct[1]) / 100
  const num = /^0?\.\d+$/.exec(s)
  if (num) return Number(s)
  return s
}

function StageBadge({ trainer, stages }) {
  const tint = useThemed()
  const stage = stages.find((s) => s.id === trainer.conv?.stage) || stages[0]
  const st = CONV_STATUS[trainer.conv?.status] || CONV_STATUS.on_track
  return (
    <span className="stage-badge" style={{ borderColor: stage?.color }}>
      <span className="stage-dot" style={{ background: tint(st.color) }} />
      {stageLabel(stage)}
    </span>
  )
}

export default function Trainers() {
  const tint = useThemed()
  const { data, t, lang, upsertTrainer, deleteTrainer, newId, setQuals, setConversion, readOnly } = useStore()
  const { trainers, stages, quals } = data
  const qualColor = (id) => (quals.find((qq) => qq.id === id) || {}).color || OVERFLOW
  const [q, setQ] = useState('')
  const [fBase, setFBase] = useState('')
  const [fQual, setFQual] = useState('')
  const [fOre, setFOre] = useState('')
  const [fStaff, setFStaff] = useState('')
  const [fAircraft, setFAircraft] = useState('')
  const [fRole, setFRole] = useState('')
  const [editing, setEditing] = useState(null) // trainer object or null
  // The short conversion editor, opened from the phase badge in the row.
  const [convFor, setConvFor] = useState(null)
  const [manageQuals, setManageQuals] = useState(false)

  const bases = useMemo(() => [...new Set(trainers.map((x) => x.base))].sort(), [trainers])
  const authorities = useMemo(
    () => [...new Set(trainers.map((x) => x.authority).filter(Boolean))].sort(),
    [trainers]
  )

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return trainers
      .filter((x) => (fBase ? x.base === fBase : true))
      .filter((x) => (fQual ? x.qual === fQual : true))
      // Through the same predicate the cell uses: a leftover tier on somebody
      // who is now external is not shown, so it must not answer the filter
      // either - a row that appears under "ORE: A" and then prints a dash is
      // the list contradicting itself.
      .filter((x) => (fOre ? isOwnStaff(x) && x.ore === fOre : true))
      .filter((x) => (fStaff ? (x.staffType || 'internal') === fStaff : true))
      .filter((x) => (fAircraft ? x.aircraft === fAircraft : true))
      .filter((x) => (fRole ? roleOf(x) === fRole : true))
      .filter((x) =>
        needle
          ? [
              x.name, x.tlc, x.remark, x.note, x.base, x.authority, x.aircraft,
              qualLabel(quals, x.qual),
              t(roleOf(x) === 'fo' ? 'role_fo' : 'role_captain')
            ]
              .join(' ')
              .toLowerCase()
              .includes(needle)
          : true
      )
  }, [trainers, q, fBase, fQual, fOre, fStaff, fAircraft, fRole, quals, t])

  const filtersOn = !!(q || fBase || fQual || fOre || fStaff || fAircraft || fRole)
  const clearFilters = () => {
    setQ('')
    setFBase('')
    setFQual('')
    setFOre('')
    setFStaff('')
    setFAircraft('')
    setFRole('')
  }

  const accessors = useMemo(
    () => ({
      qual: (x) => qualIndex(quals, x.qual),
      base: (x) => x.base,
      tlc: (x) => x.tlc,
      name: (x) => x.name,
      role: (x) => (roleOf(x) === 'captain' ? 0 : 1), // Captains first
      // Earliest date = most senior, so plain ascending is the useful order.
      // A blank sorts LAST rather than to the top: three people are not in the
      // company list at all, and an empty field is not "most senior".
      // External trainers sort last too, and for the same reason: the cell
      // shows a dash, and sorting a row by a figure it does not display is how
      // a list stops being readable.
      seniority: (x) => (isOwnStaff(x) && x.seniority) || '9999-12-31',
      remark: (x) => x.remark || '',
      note: (x) => x.note || '',
      fte: (x) => (typeof x.fte === 'number' ? x.fte : 1),
      aircraft: (x) => x.aircraft || '',
      ore: (x) => (isOwnStaff(x) && x.ore in ORE_RANK ? ORE_RANK[x.ore] : 9),
      staff: (x) => x.staffType || 'internal',
      authority: (x) => x.authority || '',
      stage: (x) => (isOwnStaff(x) ? stageIndex(stages, x.conv?.stage) : 99)
    }),
    [quals, stages]
  )
  const { sorted, sortKey, dir, toggle } = useSort(rows, accessors, 'name')

  const startAdd = () =>
    setEditing({
      id: newId('trn'),
      qual: 'TRI',
      base: '',
      tlc: '',
      name: '',
      role: 'captain',
      remark: '',
      note: '',
      seniority: '',
      partTime: 'VZ',
      fte: 1,
      aircraft: 'A320',
      // Empty, not 'C'. A pre-filled priority is a claim nobody made, and the
      // ORE chart counts whatever is there - so the default used to invent a
      // C for every person somebody added.
      ore: '',
      staffType: 'internal',
      extCompany: '',
      ltcDate: '',
      triDate: '',
      treDate: '',
      authority: '',
      conv: { stage: stages[0]?.id ?? 'nominated', status: 'on_track', target: '', note: '' },
      _isNew: true
    })

  return (
    <div className="tab-pane">
      <div className="toolbar">
        <input
          className="input search"
          placeholder={t('search')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="input" value={fBase} onChange={(e) => setFBase(e.target.value)}>
          <option value="">{t('filterBase')}: {t('all')}</option>
          {bases.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <select className="input" value={fQual} onChange={(e) => setFQual(e.target.value)}>
          <option value="">{t('filterQual')}: {t('all')}</option>
          {quals.map((qv) => (
            <option key={qv.id} value={qv.id}>{qv.label}</option>
          ))}
        </select>
        <select className="input" value={fAircraft} onChange={(e) => setFAircraft(e.target.value)}>
          <option value="">{t('filterAircraft')}: {t('all')}</option>
          {alpha(AIRCRAFT).map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select className="input" value={fOre} onChange={(e) => setFOre(e.target.value)}>
          <option value="">{t('filterOre')}: {t('all')}</option>
          {['A', 'B', 'C'].map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <select className="input" value={fRole} onChange={(e) => setFRole(e.target.value)}>
          <option value="">{t('f_role')}: {t('all')}</option>
          <option value="captain">{t('role_captain')}</option>
          <option value="fo">{t('role_fo')}</option>
        </select>
        <select className="input" value={fStaff} onChange={(e) => setFStaff(e.target.value)}>
          <option value="">{t('filterStaff')}: {t('all')}</option>
          <option value="internal">{t('staff_internal')}</option>
          <option value="external">{t('staff_external')}</option>
        </select>
        <SortSelect
          label={t('sortBy')}
          at={1280}
          sortKey={sortKey}
          dir={dir}
          onSort={toggle}
          options={[
            { k: 'name', label: t('f_name') },
            { k: 'qual', label: t('f_qual') },
            { k: 'base', label: t('f_base') },
            { k: 'fte', label: t('f_fte') },
            { k: 'ore', label: t('f_ore') },
            { k: 'seniority', label: t('f_seniority') },
            { k: 'stage', label: t('f_conversion') }
          ]}
        />
        <span className="count-pill">
          {rows.length} / {trainers.length} {t('showing')}
        </span>
        <span className="push-right" />
        <ExportLink id="trainers" />
        <button className="btn btn-ghost" onClick={() => setManageQuals(true)}>
          ⚙ {t('manageQuals')}
        </button>
        {!readOnly && <button className="btn btn-primary" onClick={startAdd}>
          + {t('addTrainer')}
        </button>}
      </div>

      <div className="table-wrap">
        {/* `compact` is the narrow-cell variant and is shared with the course
            dates; `trainer-table` is what the phone card layout hangs off, and
            it belongs to this table alone. */}
        <table className="data-table compact card-at-1280 trainer-table" role="table">
          <thead role="rowgroup">
            <tr role="row">
              {(() => { const p = { sortKey, dir, onSort: toggle }; return (<>
              <Th label={t('f_qual')} k="qual" {...p} />
              <Th label={t('f_base')} k="base" {...p} />
              <Th label={t('f_tlc')} k="tlc" {...p} />
              <Th label={t('f_name')} k="name" {...p} />
              <Th label={t('f_role')} k="role" {...p} />
              <Th label={t('f_seniority')} k="seniority" {...p} />
              <Th label={t('f_partTime')} k="fte" className="num" {...p} />
              <Th label={t('f_fte')} k="fte" className="num" {...p} />
              <Th label={t('f_aircraft')} k="aircraft" {...p} />
              <Th label={t('f_ore')} k="ore" {...p} />
              <Th label={t('f_staffType')} k="staff" {...p} />
              <Th label={t('f_authority')} k="authority" {...p} />
              <Th label={t('f_conversion')} k="stage" {...p} />
              {/* Free text last: both are read, not scanned, so they belong
                  after the columns you sort and filter by. */}
              <Th label={t('f_remark')} k="remark" {...p} />
              <Th label={t('f_note')} k="note" {...p} />
              </>) })()}
            </tr>
          </thead>
          <tbody role="rowgroup">
            {sorted.map((x) => (
              <tr role="row"
                key={x.id}
                onClick={() => setEditing({ ...x })}
                className="clickable"
                // tabIndex only: role="button" on a <tr role="row"> would void the row/cell
                // semantics and make screen readers read all 13 cells as one name.
                tabIndex={0}
                aria-label={x.name}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditing({ ...x }) } }}
              >
                {/* Each cell names itself and carries a handle. Both are inert
                    while this is a table; below 1000px the row becomes a card,
                    the header row is gone, and the CSS rearranges the cells by
                    those handles. Five of them (Teilzeit, Intern/Extern,
                    Behörde, Anmerkung, Notiz) step aside there and are read in
                    the dialog instead — fourteen fields per card would turn
                    fifty people into a very long scroll. */}
                <td role="cell" className="t-qual card-chip-end"><span className="qual-tag" style={{ background: qualColor(x.qual) }}>{qualLabel(quals, x.qual)}</span></td>
                <td role="cell" className="t-base" data-label={t('f_base')}>{x.base}</td>
                <td role="cell" className="t-tlc mono" data-label={t('f_tlc')}>{x.tlc}</td>
                <td role="cell" className="t-name card-name strong">
                  {x.name}
                  {/* On the card the affiliation column is one of the five
                      fields that step aside for the dialog, so "extern" was
                      invisible exactly where it matters most. The badge rides
                      along with the name and is hidden again from 1280px up,
                      where the real column is back - and where the table has no
                      width to spare for saying it twice. */}
                  {x.staffType === 'external' && (
                    <span className="ext-badge">
                      {t('staff_external')}
                      {x.extCompany ? ' · ' + labelOf(data.extCompanies, x.extCompany) : ''}
                    </span>
                  )}
                </td>
                <td role="cell" className="t-role" data-label={t('f_role')}><RoleTag role={roleOf(x)} /></td>
                {/* Seniority, ORE and the conversion phase are positions in
                    OUR list, OUR priority scheme and OUR pipeline. Somebody
                    else's employee has none of the three, so the card drops
                    the line altogether (`cell-na`) rather than printing three
                    dashes under three headings that do not apply. The column
                    stays in the table: a column belongs to the list, not to
                    the row, and every other row still needs it. */}
                <td role="cell" className={'t-sen' + (isOwnStaff(x) ? '' : ' cell-na')} data-label={t('f_seniority')}>{isOwnStaff(x) && x.seniority ? formatDate(x.seniority, lang) : '–'}</td>
                <td role="cell" className="t-pt num" data-label={t('f_partTime')}>{formatPartTime(x.partTime, lang)}</td>
                <td role="cell" className="t-fte num" data-label={t('f_fte')}>{formatFte(x.fte, lang)}</td>
                <td role="cell" className="t-ac" data-label={t('f_aircraft')}><AircraftTag value={x.aircraft} /></td>
                <td role="cell" className={'t-ore' + (isOwnStaff(x) ? '' : ' cell-na')} data-label={t('f_ore')}>
                  {isOwnStaff(x) ? <OreTag value={x.ore} /> : '–'}
                </td>
                <td role="cell" className="t-staff" data-label={t('f_staffType')}>
                  <span className="staff-tag" style={{ '--tag': tint((STAFF_TYPE[x.staffType || 'internal']).color) }}>
                    {t('staff_' + (x.staffType || 'internal'))}
                  </span>
                  {x.staffType === 'external' && x.extCompany && (
                    <span className="muted small ext-co"> {labelOf(data.extCompanies, x.extCompany)}</span>
                  )}
                </td>
                <td role="cell" className="t-auth muted small" data-label={t('f_authority')}>{x.authority || '–'}</td>
                <td role="cell" className={'t-stage' + (isOwnStaff(x) ? '' : ' cell-na')} data-label={t('f_conversion')}>{isOwnStaff(x) ? (
                    /* Opens the four-field conversion editor rather than the
                       full record. The same edit through the trainer dialog
                       means scrolling past fourteen unrelated fields; the
                       board has had the short way all along and nothing on
                       this tab pointed at it. stopPropagation because the row
                       itself opens the whole record. */
                    <button
                      type="button"
                      className="stage-btn"
                      title={t('editConversion')}
                      aria-label={t('editConversion') + ' – ' + x.name}
                      onClick={(e) => { e.stopPropagation(); setConvFor({ ...x }) }}
                    >
                      <StageBadge trainer={x} stages={stages} />
                    </button>
                  ) : '–'}</td>
                <td role="cell" className="t-remark muted" data-label={t('f_remark')}><span className="cell-clamp" title={x.remark || ''}>{x.remark || '–'}</span></td>
                <td role="cell" className="t-note muted" data-label={t('f_note')}><span className="cell-clamp" title={x.note || ''}>{x.note || '–'}</span></td>
              </tr>
            ))}
            {/* "Keine Trainer gefunden" alone leaves open which of the two it
                is: an empty list, or a filter that happens to match nobody.
                With 50 people and seven filters it is nearly always the
                second, so say so and offer the way out. */}
            {rows.length === 0 && (
              <tr role="row">
                <td role="cell" colSpan={14} className="empty-row">
                  {filtersOn ? (
                    <>
                      {t('emptyTrainersFiltered')}{' '}
                      <button className="btn btn-ghost btn-sm" onClick={clearFilters}>{t('clearFilters')}</button>
                    </>
                  ) : (
                    t('noTrainers')
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <TrainerForm
          trainer={editing}
          stages={stages}
          quals={quals}
          authorities={authorities}
          bases={bases}
          onClose={() => setEditing(null)}
          onSave={(tr) => {
            upsertTrainer(tr)
            setEditing(null)
          }}
          onDelete={(id) => {
            if (window.confirm(t('deleteTrainerConfirm'))) {
              deleteTrainer(id)
              setEditing(null)
            }
          }}
        />
      )}

      {convFor && (
        <ConvDetail
          trainer={convFor}
          stages={stages}
          statusList={data.convStatus}
          onClose={() => setConvFor(null)}
          onSave={(patch) => { setConversion(convFor.id, patch); setConvFor(null) }}
        />
      )}

      {manageQuals && (
        <Modal title={t('manageQuals')} onClose={() => setManageQuals(false)}
          footer={<div className="foot-row"><p className="muted small">{t('dragHint')}</p>
            <div className="push-right"><button className="btn btn-primary" onClick={() => setManageQuals(false)}>{t('close')}</button></div></div>}>
          <CategoryManager items={quals} onChange={setQuals} />
        </Modal>
      )}
    </div>
  )
}

function TrainerForm({ trainer, stages, quals, authorities, bases, onClose, onSave, onDelete }) {
  const { t, lang, readOnly, data } = useStore()
  const extCompanies = data.extCompanies || []
  const [f, setF] = useState({ ...trainer, partTimeInput: ptToInput(trainer.partTime) })
  // What the dialog opened with, so an accidental close can tell "nothing was
  // typed" from "a minute of typing". A ref, not state: it must not change.
  const opened = useRef(null)
  if (opened.current === null) opened.current = JSON.stringify({ ...trainer, partTimeInput: ptToInput(trainer.partTime) })
  const dirty = !readOnly && JSON.stringify(f) !== opened.current
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }))
  // Changing part-time pre-fills FTE (still editable afterwards).
  const setPartTime = (v) =>
    setF((s) => ({ ...s, partTimeInput: v, fte: fteFromPartTime(ptFromInput(v)) }))

  const submit = () => {
    const out = {
      ...f,
      partTime: ptFromInput(f.partTimeInput),
      simSessions: Number(f.simSessions) || 0,
      lifusLegs: Number(f.lifusLegs) || 0,
      fte: f.fte === '' || f.fte == null || isNaN(Number(f.fte)) ? 1 : Number(f.fte),
      aircraft: f.aircraft || 'A320'
    }
    delete out.partTimeInput
    delete out._isNew
    if (!(out.name || '').trim()) {
      window.alert(lang === 'de' ? 'Bitte einen Namen eingeben.' : 'Please enter a name.')
      return
    }
    onSave(out)
  }

  return (
    <Modal
      title={f._isNew ? t('addTrainer') : t('editTrainer')}
      onClose={onClose}
      confirmClose={dirty}
      wide
      footer={
        <div className="foot-row">
          {/* A viewer may open the record to read the fields the card leaves
              out; what goes away is every way to change it. */}
          {!readOnly && !f._isNew && (
            <button className="btn btn-danger" onClick={() => onDelete(f.id)}>
              {t('delete')}
            </button>
          )}
          <div className="push-right">
            <button className="btn btn-ghost" onClick={onClose}>{readOnly ? t('close') : t('cancel')}</button>
            {!readOnly && <button className="btn btn-primary" onClick={submit}>{t('save')}</button>}
          </div>
        </div>
      }
    >
      <div className="form-grid">
        <Field label={t('f_name')} span2>
          <input className="input" value={f.name || ''} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label={t('f_qual')}>
          <select className="input" value={f.qual} onChange={(e) => set('qual', e.target.value)}>
            <option value=""></option>
            {!quals.some((qq) => qq.id === f.qual) && f.qual && <option value={f.qual}>{f.qual}</option>}
            {quals.map((qq) => <option key={qq.id} value={qq.id}>{qq.label}</option>)}
          </select>
        </Field>
        <Field label={t('f_role')}>
          <select className="input" value={f.role === 'fo' ? 'fo' : 'captain'} onChange={(e) => set('role', e.target.value)}>
            <option value="captain">{t('role_captain')}</option>
            <option value="fo">{t('role_fo')}</option>
          </select>
        </Field>
        <Field label={t('f_base')}>
          <select className="input" value={f.base} onChange={(e) => set('base', e.target.value)}>
            <option value=""></option>
            {!bases.includes(f.base) && f.base && <option value={f.base}>{f.base}</option>}
            {bases.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
        <Field label={t('f_tlc')}>
          <input className="input" value={f.tlc} onChange={(e) => set('tlc', e.target.value)} />
        </Field>
        <Field label={t('f_partTime')}>
          <input className="input" value={f.partTimeInput} placeholder="VZ / 80%" onChange={(e) => setPartTime(e.target.value)} />
        </Field>
        <Field label={t('f_fte') + ' (1 = 100%)'}>
          <input
            className="input"
            type="number"
            step="0.05"
            min="0"
            max="2"
            value={f.fte ?? 1}
            onChange={(e) => set('fte', e.target.value)}
            title={t('fteAutoHint')}
          />
        </Field>
        <Field label={t('f_remark')} span2>
          <input className="input" value={f.remark} onChange={(e) => set('remark', e.target.value)} />
        </Field>
        <Field label={t('f_note')} span2>
          <input className="input" value={f.note || ''} onChange={(e) => set('note', e.target.value)} />
        </Field>
        <Field label={t('f_aircraft')}>
          <select className="input" value={f.aircraft || 'A320'} onChange={(e) => set('aircraft', e.target.value)}>
            {!AIRCRAFT.includes(f.aircraft) && f.aircraft && <option value={f.aircraft}>{f.aircraft}</option>}
            {AIRCRAFT.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </Field>
        {/* Same rule as the conversion block below: an ORE tier is a rank in
            our own priority scheme, so it is not a question for somebody
            else's employee. Nothing is cleared - switching back to internal
            brings the value back. */}
        {isOwnStaff(f) && (
          <Field label={t('f_ore')}>
            <select className="input" value={f.ore} onChange={(e) => set('ore', e.target.value)}>
              <option value=""></option>
              {['A', 'B', 'C'].map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
        )}
        <Field label={t('f_staffType')}>
          <select className="input" value={f.staffType || 'internal'} onChange={(e) => set('staffType', e.target.value)}>
            <option value=""></option>
            <option value="external">{t('staff_external')}</option>
            <option value="internal">{t('staff_internal')}</option>
          </select>
        </Field>
        {/* Only for an external trainer: an "from which company" on somebody
            who is ours is a question with no answer. The value is NOT cleared
            when the type flips back, so a mis-click loses nothing. */}
        {f.staffType === 'external' && (
          <Field label={t('f_extCompany')}>
            <select className="input" value={f.extCompany || ''} onChange={(e) => set('extCompany', e.target.value)}>
              <option value=""></option>
              {extCompanies.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </Field>
        )}
        <Field label={t('f_authority')} span2>
          <input className="input" list="authList" value={f.authority} onChange={(e) => set('authority', e.target.value)} />
          <datalist id="authList">{authorities.map((a) => <option key={a} value={a} />)}</datalist>
        </Field>

        {/* Company seniority, not a trainer qualification - hence its own line
            above the "trainer since" block rather than a fourth date in it.
            It is a position in the Eurowings list, so an external trainer does
            not have one and is not asked for it. */}
        {isOwnStaff(f) && (
          <Field label={t('f_seniority')}>
            <DateInput value={f.seniority || ''} onChange={(v) => set('seniority', v)} />
          </Field>
        )}

        <div className="form-sep span2">{t('f_trainerSince')}</div>
        <Field label={t('f_ltc')}>
          <DateInput value={f.ltcDate} onChange={(v) => set('ltcDate', v)} />
        </Field>
        <Field label={t('f_tri')}>
          <DateInput value={f.triDate} onChange={(v) => set('triDate', v)} />
        </Field>
        <Field label={t('f_tre')}>
          <DateInput value={f.treDate} onChange={(v) => set('treDate', v)} />
        </Field>

        {/* No conversion block for somebody who is not converted. Asking for a
            phase, a status and a target date that no view anywhere reads would
            be an invitation to fill in numbers that go nowhere. The values are
            not cleared - switching back to internal brings them back. */}
        {convertsAtAll(f) && <>
        <div className="form-sep span2">{t('f_conversion')}</div>
        <Field label={t('stage')}>
          <select
            className="input"
            value={f.conv.stage}
            onChange={(e) => set('conv', { ...f.conv, stage: e.target.value || (stages[0]?.id ?? 'nominated') })}
          >
            <option value=""></option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>{stageLabel(s)}</option>
            ))}
          </select>
        </Field>
        <Field label={t('status')}>
          <select
            className="input"
            value={f.conv.status}
            onChange={(e) => set('conv', { ...f.conv, status: e.target.value || 'on_track' })}
          >
            <option value=""></option>
            {Object.entries(CONV_STATUS)
              .sort((a, b) => (lang === 'de' ? a[1].de : a[1].en).localeCompare(lang === 'de' ? b[1].de : b[1].en))
              .map(([k, v]) => (
                <option key={k} value={k}>{lang === 'de' ? v.de : v.en}</option>
              ))}
          </select>
        </Field>
        <Field label={t('targetDate')}>
          <DateInput
            value={f.conv.target}
            onChange={(v) => set('conv', { ...f.conv, target: v })}
          />
        </Field>
        <Field label={t('note')} span2>
          <input
            className="input"
            value={f.conv.note}
            onChange={(e) => set('conv', { ...f.conv, note: e.target.value })}
          />
        </Field>
        </>}
      </div>
    </Modal>
  )
}

function Field({ label, children, span2 }) {
  return (
    <label className={'field' + (span2 ? ' span2' : '')}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  )
}
