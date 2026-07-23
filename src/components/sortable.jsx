import React, { useMemo, useState } from 'react'

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

// Sortable table header cell.
export function Th({ label, k, sortKey, dir, onSort, className }) {
  const active = sortKey === k
  return (
    <th className={(className || '') + ' sortable' + (active ? ' active' : '')} onClick={() => onSort(k)}>
      <span className="th-inner">
        {label}
        <span className="sort-arrow">{active ? (dir === 'asc' ? '▲' : '▼') : '⇅'}</span>
      </span>
    </th>
  )
}
