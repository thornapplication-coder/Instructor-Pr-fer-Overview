import React, { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import Modal from './Modal.jsx'
import DateInput from './DateInput.jsx'
import { stageLabel } from '../data/pipeline.js'

/**
 * The four fields a conversion actually consists of: phase, status, target
 * date, note. Nothing else.
 *
 * It used to live inside the conversion board and be reachable only from a
 * card there. The trainer list has the same job to do - "move this person on a
 * phase" is the weekly task - and its own dialog answers it too, but with the
 * conversion block 1255px down a form of fifteen fields, i.e. roughly two
 * screens of scrolling on a phone. Same edit, same store call, one tenth of
 * the distance.
 *
 * `Field` is duplicated across the tabs that use one; this one keeps its own
 * rather than reaching into a tab for it.
 */
function Field({ label, children, span2 }) {
  return (
    <label className={'field' + (span2 ? ' span2' : '')}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  )
}

export default function ConvDetail({ trainer, stages, statusList, onClose, onSave }) {
  const { t, readOnly } = useStore()
  const [c, setC] = useState({ ...trainer.conv })
  const set = (k, v) => setC((s) => ({ ...s, [k]: v }))
  // Same guard the trainer form has: leaving by the ✕, Escape or a tap beside
  // the dialog asks first once something has been typed.
  const dirty = !readOnly && JSON.stringify(c) !== JSON.stringify({ ...trainer.conv })
  return (
    <Modal
      title={trainer.name}
      onClose={onClose}
      confirmClose={dirty}
      footer={
        <div className="foot-row">
          <div className="push-right">
            <button className="btn btn-ghost" onClick={onClose}>{readOnly ? t('close') : t('cancel')}</button>
            {!readOnly && <button className="btn btn-primary" onClick={() => onSave(c)}>{t('save')}</button>}
          </div>
        </div>
      }
    >
      <div className="form-grid">
        <Field label={t('stage')}>
          <select className="input" disabled={readOnly} value={c.stage} onChange={(e) => set('stage', e.target.value)}>
            {stages.map((s) => <option key={s.id} value={s.id}>{stageLabel(s)}</option>)}
          </select>
        </Field>
        <Field label={t('status')}>
          <select className="input" disabled={readOnly} value={c.status} onChange={(e) => set('status', e.target.value)}>
            {statusList.map((v) => (
              <option key={v.id} value={v.id}>{v.label}</option>
            ))}
          </select>
        </Field>
        <Field label={t('targetDate')} span2>
          <DateInput disabled={readOnly} value={c.target} onChange={(v) => set('target', v)} />
        </Field>
        <Field label={t('note')} span2>
          <textarea className="input" rows={3} disabled={readOnly} value={c.note} onChange={(e) => set('note', e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}
