import React, { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import DateInput from '../components/DateInput.jsx'
import Modal from '../components/Modal.jsx'
import CategoryManager from '../components/CategoryManager.jsx'
import HScroll from '../components/HScroll.jsx'
import { CONV_STATUS, stageIndex, stageLabel, STAFF_TYPE, firstStageId } from '../data/pipeline.js'
import { useThemed } from '../lib/useThemed.js'
import { qualLabel, isConversionQual, conversionTrainers, CONVERSION_QUALS } from '../data/qualifications.js'
import { AIRCRAFT } from '../data/aircraft.js'
import { conversionFteSummary } from '../lib/stats.js'
import { trainerAlerts } from '../lib/alerts.js'
import { formatDate, formatFte1 } from '../lib/format.js'

function assignTarget(providers, a) {
  if (!a) return null
  const p = providers.find((x) => x.id === a.providerId)
  if (p && p.name) return p.name
  return a.location || null
}

export default function Conversion() {
  const tint = useThemed()
  const { data, t, lang, setConversion, setStages } = useStore()
  const { trainers, stages, providers, quals, assignmentSteps } = data
  const fte1 = (v) => formatFte1(v, lang)
  const [q, setQ] = useState('')
  const [fBase, setFBase] = useState('')
  const [fOre, setFOre] = useState('')
  const [fQual, setFQual] = useState('')
  const [fStaff, setFStaff] = useState('')
  const [fAircraft, setFAircraft] = useState('')
  const [detail, setDetail] = useState(null)
  const [manageStages, setManageStages] = useState(false)
  const [dragId, setDragId] = useState(null)
  const [overStage, setOverStage] = useState(null)

  // Only SEN / TRE / TRI / LTC take part in the conversion – SFI and TKI do not.
  const convPool = useMemo(() => conversionTrainers(trainers), [trainers])
  const bases = useMemo(() => [...new Set(convPool.map((x) => x.base))].sort(), [convPool])
  const stageIds = useMemo(() => new Set(stages.map((s) => s.id)), [stages])
  const firstId = firstStageId(stages)
  const fteS = conversionFteSummary(convPool, stages)

  const needle = q.trim().toLowerCase()
  const visible = convPool.filter(
    (x) =>
      x.ore !== 'Rente' &&
      (fBase ? x.base === fBase : true) &&
      (fOre ? x.ore === fOre : true) &&
      (fQual ? x.qual === fQual : true) &&
      (fStaff ? (x.staffType || 'internal') === fStaff : true) &&
      (fAircraft ? x.aircraft === fAircraft : true) &&
      (needle
        ? [x.name, qualLabel(quals, x.qual), x.base, x.tlc, x.aircraft, t('staff_' + (x.staffType || 'internal'))]
            .join(' ')
            .toLowerCase()
            .includes(needle)
        : true)
  )

  // The stage<->status coupling now lives in the store's setConversion, so all
  // editors (board drag, inline editor, detail modal) behave identically.
  const setStage = (tr, stageId) => setConversion(tr.id, { stage: stageId })
  const move = (tr, dir) => {
    const idx = stageIndex(stages, tr.conv.stage)
    const nidx = Math.max(0, Math.min(stages.length - 1, idx + dir))
    setStage(tr, stages[nidx].id)
  }
  const drop = (stageId) => {
    const tr = trainers.find((x) => x.id === dragId)
    if (tr) setStage(tr, stageId)
    setDragId(null)
    setOverStage(null)
  }

  return (
    <div className="tab-pane">
      <div className="toolbar">
        <h2 className="pane-title">{t('conversion_title')}</h2>
        <input className="input search" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" value={fAircraft} onChange={(e) => setFAircraft(e.target.value)}>
          <option value="">{t('filterAircraft')}: {t('all')}</option>
          {[...AIRCRAFT].sort().map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select className="input" value={fQual} onChange={(e) => setFQual(e.target.value)}>
          <option value="">{t('filterQual')}: {t('all')}</option>
          {quals.filter((qv) => isConversionQual(qv.id)).map((qv) => <option key={qv.id} value={qv.id}>{qv.label}</option>)}
        </select>
        <select className="input" value={fStaff} onChange={(e) => setFStaff(e.target.value)}>
          <option value="">{t('filterStaff')}: {t('all')}</option>
          <option value="external">{t('staff_external')}</option>
          <option value="internal">{t('staff_internal')}</option>
        </select>
        <select className="input" value={fBase} onChange={(e) => setFBase(e.target.value)}>
          <option value="">{t('filterBase')}: {t('all')}</option>
          {bases.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select className="input" value={fOre} onChange={(e) => setFOre(e.target.value)}>
          <option value="">{t('filterOre')}: {t('all')}</option>
          {['A', 'B', 'C'].map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <span className="push-right" />
        <button className="btn btn-ghost" onClick={() => setManageStages(true)}>
          ⚙ {t('manageStages')}
        </button>
      </div>
      <div className="fte-summary">
        <span className="fte-pill fte-in">{t('fteInConversionShort')}: <b>{fte1(fteS.inConversion)}</b></span>
        <span className="fte-pill fte-av">{t('fteAvailableShort')}: <b>{fte1(fteS.available)}</b></span>
        <span className="fte-pill fte-total">FTE {t('total')}: <b>{fte1(fteS.total)}</b></span>
        <span className="board-hint">{t('boardHint')} · {t('convScopeHint').replace('{q}', CONVERSION_QUALS.join(' · '))}</span>
      </div>

      <HScroll className="board">
        {stages.map((s, si) => {
          const cards = visible.filter((x) => {
            const stg = x.conv?.stage || firstId
            return stg === s.id || (si === 0 && !stageIds.has(stg))
          })
          return (
            <div
              className={'board-col' + (overStage === s.id ? ' drop-over' : '')}
              key={s.id}
              onDragOver={(e) => {
                e.preventDefault()
                if (overStage !== s.id) setOverStage(s.id)
              }}
              onDrop={() => drop(s.id)}
            >
              <div className="board-col-head" style={{ borderTopColor: tint(s.color) }}>
                <span className="board-col-title">{stageLabel(s)}</span>
                <span className="board-col-count">{cards.length}</span>
              </div>
              <div className="board-col-body">
                {cards.map((x) => {
                  const st = CONV_STATUS[x.conv?.status] || CONV_STATUS.on_track
                  const al = trainerAlerts(x, null, stages)
                  return (
                    <div
                      className={'conv-card' + (dragId === x.id ? ' dragging' : '') + (al.level ? ' alert-' + al.level : '')}
                      key={x.id}
                      draggable
                      onDragStart={(e) => {
                        setDragId(x.id)
                        // Firefox aborts a drag whose data store is empty, so set data.
                        try {
                          e.dataTransfer.setData('text/plain', x.id)
                          e.dataTransfer.effectAllowed = 'move'
                        } catch (_) { /* older browsers */ }
                      }}
                      onDragEnd={() => { setDragId(null); setOverStage(null) }}
                    >
                      <div className="conv-card-top">
                        <span className="conv-status-dot" style={{ background: tint(st.color) }} title={lang === 'de' ? st.de : st.en} />
                        <button className="conv-name" onClick={() => setDetail({ ...x })}>{x.name}</button>
                      </div>
                      <div className="conv-meta">
                        <span className="qual-tag sm">{qualLabel(quals, x.qual)}</span>
                        <span
                          className={'role-tag sm ' + (x.role === 'fo' ? 'role-fo' : 'role-captain')}
                          title={t(x.role === 'fo' ? 'role_fo' : 'role_captain')}
                        >
                          {t(x.role === 'fo' ? 'role_foShort' : 'role_captainShort')}
                        </span>
                        <span className="chip-sm">{x.base}</span>
                        {x.aircraft && <span className="ac-tag sm">{x.aircraft}</span>}
                        <span className={'ore-tag ore-' + (x.ore || 'none')}>{x.ore || '–'}</span>
                        <span className="staff-tag sm" style={{ '--tag': tint(STAFF_TYPE[x.staffType || 'internal'].color) }}>
                          {t('staff_' + (x.staffType || 'internal'))}
                        </span>
                      </div>
                      {(() => {
                        const chips = assignmentSteps
                          .map((stp) => ({ stp, label: assignTarget(providers, x.assignments?.[stp.id]) }))
                          .filter((c) => c.label)
                        return chips.length ? (
                          <div className="conv-assign">
                            {chips.map(({ stp, label }) => (
                              <span key={stp.id} className="assign-chip" title={stp.label + ': ' + label}>
                                <b>{stp.label}:</b> {label}
                              </span>
                            ))}
                          </div>
                        ) : null
                      })()}
                      {x.conv?.target && <div className="conv-target">🎯 {formatDate(x.conv.target, lang)}</div>}
                      {x.conv?.note && <div className="conv-note">{x.conv.note}</div>}
                      <div className="conv-actions">
                        <button className="mini-btn" disabled={si === 0} onClick={() => move(x, -1)}>‹</button>
                        <button className="mini-btn" disabled={si === stages.length - 1} onClick={() => move(x, +1)}>›</button>
                      </div>
                    </div>
                  )
                })}
                {cards.length === 0 && <div className="board-empty">–</div>}
              </div>
            </div>
          )
        })}
      </HScroll>

      {detail && (
        <ConvDetail
          trainer={detail}
          stages={stages}
          onClose={() => setDetail(null)}
          onSave={(patch) => { setConversion(detail.id, patch); setDetail(null) }}
        />
      )}

      {manageStages && (
        <Modal title={t('manageStages')} onClose={() => setManageStages(false)}
          footer={<div className="foot-row"><p className="muted small">{t('dragHint')}</p>
            <div className="push-right"><button className="btn btn-primary" onClick={() => setManageStages(false)}>{t('close')}</button></div></div>}>
          <CategoryManager items={stages} onChange={setStages} />
        </Modal>
      )}
    </div>
  )
}

function ConvDetail({ trainer, stages, onClose, onSave }) {
  const { t, lang } = useStore()
  const [c, setC] = useState({ ...trainer.conv })
  const set = (k, v) => setC((s) => ({ ...s, [k]: v }))
  return (
    <Modal
      title={trainer.name}
      onClose={onClose}
      footer={
        <div className="foot-row">
          <div className="push-right">
            <button className="btn btn-ghost" onClick={onClose}>{t('cancel')}</button>
            <button className="btn btn-primary" onClick={() => onSave(c)}>{t('save')}</button>
          </div>
        </div>
      }
    >
      <div className="form-grid">
        <Field label={t('stage')}>
          <select className="input" value={c.stage} onChange={(e) => set('stage', e.target.value)}>
            {stages.map((s) => <option key={s.id} value={s.id}>{stageLabel(s)}</option>)}
          </select>
        </Field>
        <Field label={t('status')}>
          <select className="input" value={c.status} onChange={(e) => set('status', e.target.value)}>
            {Object.entries(CONV_STATUS).map(([k, v]) => (
              <option key={k} value={k}>{lang === 'de' ? v.de : v.en}</option>
            ))}
          </select>
        </Field>
        <Field label={t('targetDate')} span2>
          <DateInput value={c.target} onChange={(v) => set('target', v)} />
        </Field>
        <Field label={t('note')} span2>
          <textarea className="input" rows={3} value={c.note} onChange={(e) => set('note', e.target.value)} />
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
