import React, { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import DateInput from '../components/DateInput.jsx'
import Modal from '../components/Modal.jsx'
import CategoryManager from '../components/CategoryManager.jsx'
import HScroll from '../components/HScroll.jsx'
import { stageIndex, stageLabel, firstStageId } from '../data/pipeline.js'
import { useThemed } from '../lib/useThemed.js'
import { qualLabel, isConversionQual, conversionTrainers, CONVERSION_QUALS } from '../data/qualifications.js'
import { colorOf, idsOf, labelOf } from '../data/lists.js'
import { conversionFteSummary } from '../lib/stats.js'
import { finishForecast, findRun, resolveAssignment, spanText } from '../lib/courses.js'
import { trainerAlerts } from '../lib/alerts.js'
import { formatDate, formatFte1 } from '../lib/format.js'
import { AircraftTag, OreTag, RoleTag } from '../components/tags.jsx'

// Where a step happens. Resolved through the course date, so a card does not
// go blank for the people who are properly booked onto a course.
function assignTarget(providers, runs, a, lang) {
  if (!a) return null
  const r = resolveAssignment(a, findRun(runs, a.courseId))
  const p = providers.find((x) => x.id === r.providerId)
  if (p && p.name) return p.name
  if (r.location) return r.location
  // A course with no provider named yet is still a booking – returning null
  // here dropped the chip and the card looked unplanned. Formatted, not the raw
  // ISO string: the target date right below it is formatted too, and two
  // notations for the same kind of figure on one card is the FTE lesson again.
  return spanText(r.from, r.to, lang) || null
}

export default function Conversion({ embedded }) {
  const tint = useThemed()
  const { data, t, lang, setConversion, setStages } = useStore()
  const { trainers, stages, providers, quals, assignmentSteps, courseRuns, aircraftTypes, oreTiers, convStatus } = data
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
  // Sorted by name. Unsorted this rendered in storage order, which is the order
  // the seed happened to have and the order an import happened to produce –
  // finding a person on a fifty-card column then meant reading every card.
  const visible = convPool.filter(
    (x) =>
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
  ).sort((a, b) => (a.name || '').localeCompare(b.name || ''))

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
        {/* The hub above already names the tab and offers the view switch. */}
        {!embedded && <h2 className="pane-title">{t('conversion_title')}</h2>}
        <input className="input search" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" value={fAircraft} onChange={(e) => setFAircraft(e.target.value)}>
          <option value="">{t('filterAircraft')}: {t('all')}</option>
          {aircraftTypes.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
        </select>
        <select className="input" value={fQual} onChange={(e) => setFQual(e.target.value)}>
          <option value="">{t('filterQual')}: {t('all')}</option>
          {quals.filter((qv) => isConversionQual(qv.id)).map((qv) => <option key={qv.id} value={qv.id}>{qv.label}</option>)}
        </select>
        <select className="input" value={fStaff} onChange={(e) => setFStaff(e.target.value)}>
          <option value="">{t('filterStaff')}: {t('all')}</option>
          {data.staffTypes.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <select className="input" value={fBase} onChange={(e) => setFBase(e.target.value)}>
          <option value="">{t('filterBase')}: {t('all')}</option>
          {bases.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select className="input" value={fOre} onChange={(e) => setFOre(e.target.value)}>
          <option value="">{t('filterOre')}: {t('all')}</option>
          {oreTiers.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
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
                  const stId = x.conv?.status || 'on_track'
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
                        <span className="conv-status-dot" style={{ background: tint(colorOf(convStatus, stId)) }} title={labelOf(convStatus, stId)} />
                        <button className="conv-name" onClick={() => setDetail({ ...x })}>{x.name}</button>
                      </div>
                      <div className="conv-meta">
                        <span className="qual-tag sm">{qualLabel(quals, x.qual)}</span>
                        <RoleTag role={x.role} sm />
                        <span className="chip-sm">{x.base}</span>
                        {x.aircraft && <AircraftTag value={x.aircraft} sm />}
                        <OreTag value={x.ore} sm />
                        <span className="staff-tag sm" style={{ '--tag': tint(colorOf(data.staffTypes, x.staffType || 'internal')) }}>
                          {labelOf(data.staffTypes, x.staffType || 'internal')}
                        </span>
                      </div>
                      {(() => {
                        const chips = assignmentSteps
                          .map((stp) => ({ stp, label: assignTarget(providers, courseRuns, x.assignments?.[stp.id], lang) }))
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
                      {x.conv?.target && (
                        <div className="conv-target">
                          🎯 {formatDate(x.conv.target, lang)}
                          {(() => {
                            // The verdict the target date was missing: the last
                            // booked course end against it. Held back while the
                            // plan is incomplete – a half-entered plan always
                            // forecasts an early finish, which would be a
                            // flattering lie rather than a measurement.
                            const f = finishForecast(x, assignmentSteps, courseRuns)
                            if (f.over == null) return null
                            if (!f.complete) {
                              return <span className="target-chip partial" title={t('target_partialHint')}>
                                {t('target_partial').replace('{n}', String(f.known)).replace('{m}', String(f.of))}
                              </span>
                            }
                            return f.over > 0 ? (
                              <span className="target-chip over" title={t('target_overHint')}>
                                +{f.over} {t('course_daysShort')}
                              </span>
                            ) : (
                              <span className="target-chip ok" title={t('target_okHint')}>✓</span>
                            )
                          })()}
                        </div>
                      )}
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
          statusList={convStatus}
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

function ConvDetail({ trainer, stages, statusList, onClose, onSave }) {
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
            {statusList.map((v) => (
              <option key={v.id} value={v.id}>{v.label}</option>
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
