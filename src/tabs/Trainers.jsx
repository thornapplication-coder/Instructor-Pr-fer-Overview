import React, { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import Modal from '../components/Modal.jsx'
import CategoryManager from '../components/CategoryManager.jsx'
import { useSort, Th } from '../components/sortable.jsx'
import { formatPartTime, formatDate, classNames, fteFromPartTime, formatFte } from '../lib/format.js'
import { CONV_STATUS, STAFF_TYPE, stageLabel, stageIndex } from '../data/pipeline.js'
import { qualIndex, qualLabel } from '../data/qualifications.js'
import { AIRCRAFT } from '../data/aircraft.js'

const ORE_RANK = { A: 0, B: 1, C: 2, Rente: 3 }
const alpha = (arr) => [...arr].sort((a, b) => String(a).localeCompare(String(b)))

const ORES = ['A', 'B', 'C', 'Rente', '']

// Cockpit role: everyone is a Captain unless explicitly marked First Officer.
const roleOf = (x) => (x.role === 'fo' ? 'fo' : 'captain')

function RoleTag({ role, t }) {
  const fo = role === 'fo'
  return (
    <span
      className={'role-tag ' + (fo ? 'role-fo' : 'role-captain')}
      title={fo ? t('role_fo') : t('role_captain')}
    >
      {fo ? t('role_foShort') : t('role_captainShort')}
    </span>
  )
}

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
  const stage = stages.find((s) => s.id === trainer.conv?.stage) || stages[0]
  const st = CONV_STATUS[trainer.conv?.status] || CONV_STATUS.on_track
  return (
    <span className="stage-badge" style={{ borderColor: stage?.color }}>
      <span className="stage-dot" style={{ background: st.color }} />
      {stageLabel(stage)}
    </span>
  )
}

export default function Trainers() {
  const { data, t, lang, upsertTrainer, deleteTrainer, newId, setQuals } = useStore()
  const { trainers, stages, quals } = data
  const qualColor = (id) => (quals.find((qq) => qq.id === id) || {}).color || '#787878'
  const [q, setQ] = useState('')
  const [fBase, setFBase] = useState('')
  const [fQual, setFQual] = useState('')
  const [fOre, setFOre] = useState('')
  const [fStaff, setFStaff] = useState('')
  const [fAircraft, setFAircraft] = useState('')
  const [fRole, setFRole] = useState('')
  const [editing, setEditing] = useState(null) // trainer object or null
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
      .filter((x) => (fOre ? x.ore === fOre : true))
      .filter((x) => (fStaff ? (x.staffType || 'internal') === fStaff : true))
      .filter((x) => (fAircraft ? x.aircraft === fAircraft : true))
      .filter((x) => (fRole ? roleOf(x) === fRole : true))
      .filter((x) =>
        needle
          ? [
              x.name, x.tlc, x.remark, x.base, x.authority, x.aircraft,
              qualLabel(quals, x.qual),
              t(roleOf(x) === 'fo' ? 'role_fo' : 'role_captain')
            ]
              .join(' ')
              .toLowerCase()
              .includes(needle)
          : true
      )
  }, [trainers, q, fBase, fQual, fOre, fStaff, fAircraft, fRole, quals, t])

  const accessors = useMemo(
    () => ({
      qual: (x) => qualIndex(quals, x.qual),
      base: (x) => x.base,
      tlc: (x) => x.tlc,
      name: (x) => x.name,
      role: (x) => (roleOf(x) === 'captain' ? 0 : 1), // Captains first
      remark: (x) => x.remark || '',
      fte: (x) => (typeof x.fte === 'number' ? x.fte : 1),
      aircraft: (x) => x.aircraft || '',
      ore: (x) => (x.ore in ORE_RANK ? ORE_RANK[x.ore] : 9),
      staff: (x) => x.staffType || 'internal',
      authority: (x) => x.authority || '',
      stage: (x) => stageIndex(stages, x.conv?.stage)
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
      partTime: 'VZ',
      fte: 1,
      aircraft: 'A320',
      ore: 'C',
      staffType: 'internal',
      ltcDate: '',
      triDate: '',
      treDate: '',
      authority: '',
      conv: { stage: 'nominated', status: 'on_track', target: '', note: '' },
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
          {['A', 'B', 'C', 'Rente'].map((o) => (
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
        <span className="count-pill">
          {rows.length} / {trainers.length} {t('showing')}
        </span>
        <span className="push-right" />
        <button className="btn btn-ghost" onClick={() => setManageQuals(true)}>
          ⚙ {t('manageQuals')}
        </button>
        <button className="btn btn-primary" onClick={startAdd}>
          + {t('addTrainer')}
        </button>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {(() => { const p = { sortKey, dir, onSort: toggle }; return (<>
              <Th label={t('f_qual')} k="qual" {...p} />
              <Th label={t('f_base')} k="base" {...p} />
              <Th label={t('f_tlc')} k="tlc" {...p} />
              <Th label={t('f_name')} k="name" {...p} />
              <Th label={t('f_role')} k="role" {...p} />
              <Th label={t('f_remark')} k="remark" {...p} />
              <Th label={t('f_partTime')} k="fte" className="num" {...p} />
              <Th label={t('f_fte')} k="fte" className="num" {...p} />
              <Th label={t('f_aircraft')} k="aircraft" {...p} />
              <Th label={t('f_ore')} k="ore" {...p} />
              <Th label={t('f_staffType')} k="staff" {...p} />
              <Th label={t('f_authority')} k="authority" {...p} />
              <Th label={t('f_conversion')} k="stage" {...p} />
              </>) })()}
            </tr>
          </thead>
          <tbody>
            {sorted.map((x) => (
              <tr
                key={x.id}
                onClick={() => setEditing({ ...x })}
                className="clickable"
                tabIndex={0}
                role="button"
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditing({ ...x }) } }}
              >
                <td><span className="qual-tag" style={{ background: qualColor(x.qual) }}>{qualLabel(quals, x.qual)}</span></td>
                <td>{x.base}</td>
                <td className="mono">{x.tlc}</td>
                <td className="strong">{x.name}</td>
                <td><RoleTag role={roleOf(x)} t={t} /></td>
                <td className="muted">{x.remark || '–'}</td>
                <td className="num">{formatPartTime(x.partTime, lang)}</td>
                <td className="num">{formatFte(x.fte)}</td>
                <td><span className="ac-tag">{x.aircraft || '–'}</span></td>
                <td>
                  <span className={classNames('ore-tag', 'ore-' + (x.ore || 'none'))}>
                    {x.ore || '–'}
                  </span>
                </td>
                <td>
                  <span className="staff-tag" style={{ background: (STAFF_TYPE[x.staffType || 'internal']).color }}>
                    {t('staff_' + (x.staffType || 'internal'))}
                  </span>
                </td>
                <td className="muted small">{x.authority || '–'}</td>
                <td><StageBadge trainer={x} stages={stages} /></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={13} className="empty-row">{t('noTrainers')}</td>
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
  const { t, lang } = useStore()
  const [f, setF] = useState({ ...trainer, partTimeInput: ptToInput(trainer.partTime) })
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
      wide
      footer={
        <div className="foot-row">
          {!f._isNew && (
            <button className="btn btn-danger" onClick={() => onDelete(f.id)}>
              {t('delete')}
            </button>
          )}
          <div className="push-right">
            <button className="btn btn-ghost" onClick={onClose}>{t('cancel')}</button>
            <button className="btn btn-primary" onClick={submit}>{t('save')}</button>
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
        <Field label={t('f_aircraft')}>
          <select className="input" value={f.aircraft || 'A320'} onChange={(e) => set('aircraft', e.target.value)}>
            {!AIRCRAFT.includes(f.aircraft) && f.aircraft && <option value={f.aircraft}>{f.aircraft}</option>}
            {AIRCRAFT.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </Field>
        <Field label={t('f_ore')}>
          <select className="input" value={f.ore} onChange={(e) => set('ore', e.target.value)}>
            <option value=""></option>
            {['A', 'B', 'C', 'Rente'].map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        <Field label={t('f_staffType')}>
          <select className="input" value={f.staffType || 'internal'} onChange={(e) => set('staffType', e.target.value)}>
            <option value=""></option>
            <option value="external">{t('staff_external')}</option>
            <option value="internal">{t('staff_internal')}</option>
          </select>
        </Field>
        <Field label={t('f_authority')} span2>
          <input className="input" list="authList" value={f.authority} onChange={(e) => set('authority', e.target.value)} />
          <datalist id="authList">{authorities.map((a) => <option key={a} value={a} />)}</datalist>
        </Field>

        <div className="form-sep span2">{t('f_trainerSince')}</div>
        <Field label={t('f_ltc')}>
          <input className="input" type="date" value={f.ltcDate} onChange={(e) => set('ltcDate', e.target.value)} />
        </Field>
        <Field label={t('f_tri')}>
          <input className="input" type="date" value={f.triDate} onChange={(e) => set('triDate', e.target.value)} />
        </Field>
        <Field label={t('f_tre')}>
          <input className="input" type="date" value={f.treDate} onChange={(e) => set('treDate', e.target.value)} />
        </Field>

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
          <input
            className="input"
            type="date"
            value={f.conv.target}
            onChange={(e) => set('conv', { ...f.conv, target: e.target.value })}
          />
        </Field>
        <Field label={t('note')} span2>
          <input
            className="input"
            value={f.conv.note}
            onChange={(e) => set('conv', { ...f.conv, note: e.target.value })}
          />
        </Field>
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
