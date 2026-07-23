import React, { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import Modal from '../components/Modal.jsx'
import { CONV_STATUS, stageIndex, ASSIGNMENT_STEPS, STAFF_TYPE } from '../data/pipeline.js'
import { formatDate } from '../lib/format.js'

function assignTarget(providers, a) {
  if (!a) return null
  const p = providers.find((x) => x.id === a.providerId)
  if (p && p.name) return p.name
  return a.location || null
}

export default function Conversion() {
  const { data, t, lang, setConversion } = useStore()
  const { trainers, stages, providers } = data
  const [fBase, setFBase] = useState('')
  const [fOre, setFOre] = useState('')
  const [detail, setDetail] = useState(null)

  const bases = useMemo(() => [...new Set(trainers.map((x) => x.base))].sort(), [trainers])

  const visible = trainers.filter(
    (x) =>
      (fBase ? x.base === fBase : true) &&
      (fOre ? x.ore === fOre : true) &&
      x.ore !== 'Rente'
  )

  const move = (tr, dir) => {
    const idx = stageIndex(stages, tr.conv.stage)
    const nidx = Math.max(0, Math.min(stages.length - 1, idx + dir))
    const patch = { stage: stages[nidx].id }
    if (stages[nidx].id === 'released') patch.status = 'done'
    setConversion(tr.id, patch)
  }

  return (
    <div className="tab-pane">
      <div className="toolbar">
        <h2 className="pane-title">{t('conversion_title')}</h2>
        <select className="input" value={fBase} onChange={(e) => setFBase(e.target.value)}>
          <option value="">{t('filterBase')}: {t('all')}</option>
          {bases.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select className="input" value={fOre} onChange={(e) => setFOre(e.target.value)}>
          <option value="">{t('filterOre')}: {t('all')}</option>
          {['A', 'B', 'C'].map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <span className="board-hint push-right">{t('boardHint')}</span>
      </div>

      <div className="board">
        {stages.map((s, si) => {
          const cards = visible.filter((x) => (x.conv?.stage || 'nominated') === s.id)
          return (
            <div className="board-col" key={s.id}>
              <div className="board-col-head" style={{ borderTopColor: s.color }}>
                <span className="board-col-title">{lang === 'de' ? s.de : s.en}</span>
                <span className="board-col-count">{cards.length}</span>
              </div>
              <div className="board-col-body">
                {cards.map((x) => {
                  const st = CONV_STATUS[x.conv?.status] || CONV_STATUS.on_track
                  return (
                    <div className="conv-card" key={x.id}>
                      <div className="conv-card-top">
                        <span className="conv-status-dot" style={{ background: st.color }} title={lang === 'de' ? st.de : st.en} />
                        <button className="conv-name" onClick={() => setDetail({ ...x })}>
                          {x.name}
                        </button>
                      </div>
                      <div className="conv-meta">
                        <span className="qual-tag sm">{x.qual}</span>
                        <span className="chip-sm">{x.base}</span>
                        <span className={'ore-tag ore-' + (x.ore || 'none')}>{x.ore || '–'}</span>
                        <span
                          className="staff-tag sm"
                          style={{ background: STAFF_TYPE[x.staffType || 'internal'].color }}
                        >
                          {t('staff_' + (x.staffType || 'internal'))}
                        </span>
                      </div>
                      {(() => {
                        const chips = ASSIGNMENT_STEPS.map((s) => ({ s, label: assignTarget(providers, x.assignments?.[s.id]) })).filter((c) => c.label)
                        return chips.length ? (
                          <div className="conv-assign">
                            {chips.map(({ s, label }) => (
                              <span key={s.id} className="assign-chip" title={(lang === 'de' ? s.de : s.en) + ': ' + label}>
                                <b>{s.id === 'lifus' ? 'LIFUS' : s.id.toUpperCase()}</b> {label}
                              </span>
                            ))}
                          </div>
                        ) : null
                      })()}
                      {x.conv?.target && (
                        <div className="conv-target">🎯 {formatDate(x.conv.target, lang)}</div>
                      )}
                      {x.conv?.note && <div className="conv-note">{x.conv.note}</div>}
                      <div className="conv-actions">
                        <button className="mini-btn" disabled={si === 0} onClick={() => move(x, -1)}>
                          ‹
                        </button>
                        <button
                          className="mini-btn"
                          disabled={si === stages.length - 1}
                          onClick={() => move(x, +1)}
                        >
                          ›
                        </button>
                      </div>
                    </div>
                  )
                })}
                {cards.length === 0 && <div className="board-empty">–</div>}
              </div>
            </div>
          )
        })}
      </div>

      {detail && (
        <ConvDetail
          trainer={detail}
          stages={stages}
          onClose={() => setDetail(null)}
          onSave={(patch) => {
            setConversion(detail.id, patch)
            setDetail(null)
          }}
        />
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
            {stages.map((s) => <option key={s.id} value={s.id}>{lang === 'de' ? s.de : s.en}</option>)}
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
          <input className="input" type="date" value={c.target} onChange={(e) => set('target', e.target.value)} />
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
