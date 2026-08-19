import React, { useId, useMemo, useState } from 'react'

// Reusable client-side sorting for tables.
// `accessors` maps a column key -> function(row) returning a comparable value.
export function useSort(rows, accessors, initialKey, initialDir = 'asc') {
  const [sortKey, setSortKey] = useState(initialKey)
  const [dir, setDir] = useState(initialDir)

  const sorted = useMemo(() => {
    const acc = accessors[sortKey]
    if (!acc) return rows
    const arr = [...rows].sort((a, b) => {
      const va = acc(a)
      const vb = acc(b)
      if (typeof va === 'number' && typeof vb === 'number') return va - vb
      return String(va ?? '').localeCompare(String(vb ?? ''), undefined, { numeric: true, sensitivity: 'base' })
    })
    return dir === 'asc' ? arr : arr.reverse()
  }, [rows, sortKey, dir, accessors])

  const toggle = (k) => {
    if (k === sortKey) setDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k)
      setDir('asc')
    }
  }
  return { sorted, sortKey, dir, toggle }
}

/**
 * The sort control for card mode.
 *
 * Below its breakpoint a list is no longer a table: the header row is hidden,
 * and with it the only way to sort, because `toggle` is reachable through `Th`
 * alone. That is a real loss on the capacity list, whose whole job is ranking —
 * "which provider is the bottleneck" is one tap on a column heading at a desk
 * and was nothing at all on a phone.
 *
 * `at` is the width the table turns into cards, so this appears exactly when
 * the header row disappears. `options` is deliberately a short list rather than
 * every sortable column: on a phone the useful question is which two or three
 * orders you want, not all fourteen.
 */
export function SortSelect({ options, sortKey, dir, onSort, label, at = 1000 }) {
  // One id per instance. It used to be `sort-${at}`, and a page can hold more
  // than one of these at the same breakpoint (the Provider tab has two, the
  // Capacity tab three) - so the label pointed at the first select and the
  // other two had no label at all.
  const id = useId()
  const known = options.some((o) => o.k === sortKey)
  return (
    <div className={'sort-select card-only-' + at}>
      <label className="sort-select-label" htmlFor={id}>{label}</label>
      <select
        id={id}
        className="input"
        value={known ? sortKey : ''}
        onChange={(e) => {
          // `toggle` flips the direction when the key is unchanged, so only
          // call it for a genuinely different one – picking the current entry
          // out of the list must not silently reverse the list.
          if (e.target.value && e.target.value !== sortKey) onSort(e.target.value)
        }}
      >
        {!known && <option value="">–</option>}
        {options.map((o) => <option key={o.k} value={o.k}>{o.label}</option>)}
      </select>
      <button
        type="button"
        className="mini-btn sort-dir"
        onClick={() => onSort(sortKey)}
        aria-label={dir === 'asc' ? 'aufsteigend' : 'absteigend'}
        title={dir === 'asc' ? 'aufsteigend' : 'absteigend'}
      >
        {dir === 'asc' ? '▲' : '▼'}
      </button>
    </div>
  )
}

// Sortable table header cell. Keyboard-operable (Enter/Space) and announces the
// current sort direction via aria-sort.
export function Th({ label, k, sortKey, dir, onSort, className }) {
  const active = sortKey === k
  const ariaSort = active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'
  // `role="button"` used to sit on the <th> itself, which replaced its
  // columnheader role – a screen reader announced "button", not "column
  // header, sorted ascending", and the cells below lost the header they belong
  // to. The header stays a header and carries `aria-sort`; the thing you press
  // is a real button inside it.
  return (
    <th
      className={(className || '') + ' sortable' + (active ? ' active' : '')}
      scope="col"
      aria-sort={ariaSort}
    >
      <button type="button" className="th-inner" onClick={() => onSort(k)}>
        {label}
        <span className="sort-arrow" aria-hidden="true">{active ? (dir === 'asc' ? '▲' : '▼') : '⇅'}</span>
      </button>
    </th>
  )
}
