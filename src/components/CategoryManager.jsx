import { BRAND } from '../lib/palette.js'
import React, { useState } from 'react'
import { useStore } from '../lib/store.jsx'

// Reusable editor for an ordered list of categories: { id, label, color? }.
// Supports rename, recolor, add, delete and reorder (drag & drop + arrows).
// The list order is meaningful (used for sorting elsewhere).
export default function CategoryManager({ items, onChange, hasColor = true, defaultColor = BRAND.burgundy }) {
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
            <span className="drag-handle" title="drag">⠿</span>
            {hasColor && (
              <input
                type="color"
                className="color-input"
                value={it.color || defaultColor}
                onChange={(e) => update(i, { color: e.target.value })}
              />
            )}
            <input
              className="input catman-label"
              value={it.label}
              placeholder="…"
              onChange={(e) => update(i, { label: e.target.value })}
            />
            <div className="catman-actions">
              <button className="mini-btn" disabled={i === 0} onClick={() => move(i, i - 1)} title="up">↑</button>
              <button className="mini-btn" disabled={i === items.length - 1} onClick={() => move(i, i + 1)} title="down">↓</button>
              <button className="mini-btn danger" onClick={() => remove(i)} title="delete">✕</button>
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="catman-empty">{t('none')}</li>}
      </ul>
      <button className="btn btn-ghost" onClick={add}>+ {t('addCategory')}</button>
    </div>
  )
}
