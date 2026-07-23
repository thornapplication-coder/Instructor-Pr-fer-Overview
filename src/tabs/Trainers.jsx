import React, { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import Modal from '../components/Modal.jsx'
import { formatPartTime, formatDate, classNames } from '../lib/format.js'
import { CONV_STATUS, STAFF_TYPE } from '../data/pipeline.js'

const QUALS = ['TRE', 'TRE/SEN', 'LTC', 'TRI', 'new TRI']
const ORES = ['A', 'B', 'C', 'Rente', '']

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

function StageBadge({ trainer, stages, lang }) {
  const stage = stages.find((s) => s.id === trainer.conv?.stage) || stages[0]
  const st = CONV_STATUS[trainer.conv?.status] || CONV_STATUS.on_track
  return (
    <span className="stage-badge" style={{ borderColor: stage.color }}>
      <span className="stage-dot" style={{ background: st.color }} />
      {lang === 'de' ? stage.de : stage.en}
    </span>
  )
}

export default function Trainers() {
  const { data, t, lang, upsertTrainer, deleteTrainer, newId } = useStore()
  const { trainers, stages } = data
  const [q, setQ] = useState('')
  const [fBase, setFBase] = useState('')
  const [fQual, setFQual] = useState('')
  const [fOre, setFOre] = useState('')
  const [fStaff, setFStaff] = useState('')
  const [editing, setEditing] = useState(null) // trainer object or null

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
      .filter((x) =>
        needle
          ? [x.name, x.tlc, x.remark, x.base, x.authority]
              .join(' ')
              .toLowerCase()
              .includes(needle)
          : true
      )
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [trainers, q, fBase, fQual, fOre, fStaff])

  const startAdd = () =>
    setEditing({
      id: newId('trn'),
      qual: 'new TRI',
      base: '',
      tlc: '',
      name: '',
      remark: '',
      partTime: 'VZ',
      simSessions: 0,
      lifusLegs: 0,
      ore: 'C',
      staffType: 'internal',
      ltcDate: '',
      triDate: '',
      treDate: '',
      authority: '',
      bFrom: '',
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
          {QUALS.map((qv) => (
            <option key={qv} value={qv}>{qv}</option>
          ))}
        </select>
        <select className="input" value={fOre} onChange={(e) => setFOre(e.target.value)}>
          <option value="">{t('filterOre')}: {t('all')}</option>
          {['A', 'B', 'C', 'Rente'].map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <select className="input" value={fStaff} onChange={(e) => setFStaff(e.target.value)}>
          <option value="">{t('filterStaff')}: {t('all')}</option>
          <option value="internal">{t('staff_internal')}</option>
          <option value="external">{t('staff_external')}</option>
        </select>
        <span className="count-pill">
          {rows.length} / {trainers.length} {t('showing')}
        </span>
        <button className="btn btn-primary push-right" onClick={startAdd}>
          + {t('addTrainer')}
        </button>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('f_qual')}</th>
              <th>{t('f_base')}</th>
              <th>{t('f_tlc')}</th>
              <th>{t('f_name')}</th>
              <th>{t('f_remark')}</th>
              <th className="num">{t('f_partTime')}</th>
              <th className="num">SIM</th>
              <th className="num">LIFUS</th>
              <th>{t('f_ore')}</th>
              <th>{t('f_staffType')}</th>
              <th>{t('f_authority')}</th>
              <th>{t('f_conversion')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.id} onClick={() => setEditing({ ...x })} className="clickable">
                <td><span className="qual-tag">{x.qual}</span></td>
                <td>{x.base}</td>
                <td className="mono">{x.tlc}</td>
                <td className="strong">{x.name}</td>
                <td className="muted">{x.remark || '–'}</td>
                <td className="num">{formatPartTime(x.partTime, lang)}</td>
                <td className="num">{x.simSessions}</td>
                <td className="num">{x.lifusLegs}</td>
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
                <td><StageBadge trainer={x} stages={stages} lang={lang} /></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={12} className="empty-row">{t('noTrainers')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <TrainerForm
          trainer={editing}
          stages={stages}
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
    </div>
  )
}

function TrainerForm({ trainer, stages, authorities, bases, onClose, onSave, onDelete }) {
  const { t, lang } = useStore()
  const [f, setF] = useState({ ...trainer, partTimeInput: ptToInput(trainer.partTime) })
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }))

  const submit = () => {
    const out = {
      ...f,
      partTime: ptFromInput(f.partTimeInput),
      simSessions: Number(f.simSessions) || 0,
      lifusLegs: Number(f.lifusLegs) || 0
    }
    delete out.partTimeInput
    delete out._isNew
    if (!out.name.trim()) {
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
          <input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label={t('f_qual')}>
          <select className="input" value={f.qual} onChange={(e) => set('qual', e.target.value)}>
            {QUALS.map((q) => <option key={q}>{q}</option>)}
          </select>
        </Field>
        <Field label={t('f_base')}>
          <input className="input" list="baseList" value={f.base} onChange={(e) => set('base', e.target.value)} />
          <datalist id="baseList">{bases.map((b) => <option key={b} value={b} />)}</datalist>
        </Field>
        <Field label={t('f_tlc')}>
          <input className="input" value={f.tlc} onChange={(e) => set('tlc', e.target.value)} />
        </Field>
        <Field label={t('f_partTime')}>
          <input className="input" value={f.partTimeInput} placeholder="VZ / 80%" onChange={(e) => set('partTimeInput', e.target.value)} />
        </Field>
        <Field label={t('f_remark')} span2>
          <input className="input" value={f.remark} onChange={(e) => set('remark', e.target.value)} />
        </Field>
        <Field label={t('f_ore')}>
          <select className="input" value={f.ore} onChange={(e) => set('ore', e.target.value)}>
            {ORES.map((o) => <option key={o} value={o}>{o || '–'}</option>)}
          </select>
        </Field>
        <Field label={t('f_staffType')}>
          <select className="input" value={f.staffType || 'internal'} onChange={(e) => set('staffType', e.target.value)}>
            <option value="internal">{t('staff_internal')}</option>
            <option value="external">{t('staff_external')}</option>
          </select>
        </Field>
        <Field label={t('f_sim')}>
          <input className="input" type="number" value={f.simSessions} onChange={(e) => set('simSessions', e.target.value)} />
        </Field>
        <Field label={t('f_lifus')}>
          <input className="input" type="number" value={f.lifusLegs} onChange={(e) => set('lifusLegs', e.target.value)} />
        </Field>
        <Field label={t('f_authority')} span2>
          <input className="input" list="authList" value={f.authority} onChange={(e) => set('authority', e.target.value)} />
          <datalist id="authList">{authorities.map((a) => <option key={a} value={a} />)}</datalist>
        </Field>
        <Field label={t('f_ltc')}>
          <input className="input" type="date" value={f.ltcDate} onChange={(e) => set('ltcDate', e.target.value)} />
        </Field>
        <Field label={t('f_tri')}>
          <input className="input" type="date" value={f.triDate} onChange={(e) => set('triDate', e.target.value)} />
        </Field>
        <Field label={t('f_tre')}>
          <input className="input" type="date" value={f.treDate} onChange={(e) => set('treDate', e.target.value)} />
        </Field>
        <Field label={t('f_bFrom')}>
          <input className="input" value={f.bFrom} onChange={(e) => set('bFrom', e.target.value)} />
        </Field>

        <div className="form-sep span2">{t('f_conversion')}</div>
        <Field label={t('stage')}>
          <select
            className="input"
            value={f.conv.stage}
            onChange={(e) => set('conv', { ...f.conv, stage: e.target.value })}
          >
            {stages.map((s) => (
              <option key={s.id} value={s.id}>{lang === 'de' ? s.de : s.en}</option>
            ))}
          </select>
        </Field>
        <Field label={t('status')}>
          <select
            className="input"
            value={f.conv.status}
            onChange={(e) => set('conv', { ...f.conv, status: e.target.value })}
          >
            {Object.entries(CONV_STATUS).map(([k, v]) => (
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
