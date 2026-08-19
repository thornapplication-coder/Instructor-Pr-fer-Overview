import { BRAND } from '../lib/palette.js'
import React, { useState } from 'react'
import { useStore } from '../lib/store.jsx'

// Reusable editor for an ordered list of categories: { id, label, color? }.
// Supports rename, recolor, add, delete and reorder (drag & drop + arrows).
// The list order is meaningful (used for sorting elsewhere).
// `numField` (optional) adds one number input per row, e.g. the target duration
// of a course type. It lives on the category itself so it travels with the
// column: rename "TRI-Kurs" and its 10-day target follows.
// `locked` = the ids are values the code branches on. Renaming and recolouring
// stay open, adding and deleting do not: a fifth assignment status would be a
// value no branch knows, and it would quietly behave like "open" everywhere.
export default function CategoryManager({ items, onChange, hasColor = true, defaultColor = BRAND.burgundy, numField, locked }) {
  const { t, newId } = useStore()
  const [drag, setDrag] = useState(null)

  const update = (i, patch) => onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  // Confirm before removing an established (labelled) category: records still
  // referencing it keep the raw value but lose colour/order, and re-adding mints
  // a new random id, so an accidental one-click delete is hard to undo.
  const remove = (i) => {
    const it = items[i]
    if (it && it.label && !window.confirm(t('deleteCategoryConfirm'))) return
    onChange(items.filter((_, idx) => idx !== i))
  }
  const add = () =>
    onChange([...items, { id: newId('cat'), label: '', color: defaultColor }])
  const move = (from, to) => {
    if (to < 0 || to >= items.length) return
    const next = items.slice()
    const [it] = next.splice(from, 1)
    next.splice(to, 0, it)
    onChange(next)
  }

  return (
    <div className="catman">
      <ul className="catman-list">
        {items.map((it, i) => (
          <li
            key={it.id}
            className={'catman-row' + (drag === i ? ' dragging' : '')}
            draggable
            onDragStart={(e) => {
              setDrag(i)
              // Firefox won't start a drag whose data store is empty.
              try {
                e.dataTransfer.setData('text/plain', String(i))
                e.dataTransfer.effectAllowed = 'move'
              } catch (_) { /* older browsers */ }
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (drag !== null && drag !== i) move(drag, i)
              setDrag(null)
            }}
            onDragEnd={() => setDrag(null)}
          >
            <span className="drag-handle" aria-hidden="true">⠿</span>
            {hasColor && (
              <input
                type="color"
                className="color-input"
                aria-label={t('colorOf') + (it.label ? ' – ' + it.label : '')}
                title={t('colorOf')}
                value={it.color || defaultColor}
                onChange={(e) => update(i, { color: e.target.value })}
              />
            )}
            <input
              className="input catman-label"
              aria-label={t('nameOf') + (it.label ? ' – ' + it.label : '')}
              value={it.label}
              placeholder={t('nameOf')}
              onChange={(e) => update(i, { label: e.target.value })}
            />
            {numField && (
              <label className="catman-num">
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={it[numField.key] || ''}
                  placeholder="–"
                  aria-label={numField.label + ' ' + (it.label || '')}
                  onChange={(e) => update(i, { [numField.key]: e.target.value === '' ? 0 : Number(e.target.value) })}
                />
                <span>{numField.suffix}</span>
              </label>
            )}
            <div className="catman-actions">
              <button className="mini-btn" disabled={i === 0} onClick={() => move(i, i - 1)} title={t('moveUp')} aria-label={t('moveUp')}>↑</button>
              <button className="mini-btn" disabled={i === items.length - 1} onClick={() => move(i, i + 1)} title={t('moveDown')} aria-label={t('moveDown')}>↓</button>
              {!locked && <button className="mini-btn danger" onClick={() => remove(i)} title={t('delete')} aria-label={t('delete')}>✕</button>}
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="catman-empty">{t('none')}</li>}
      </ul>
      {!locked && <button className="btn btn-ghost" onClick={add}>+ {t('addCategory')}</button>}
    </div>
  )
}
