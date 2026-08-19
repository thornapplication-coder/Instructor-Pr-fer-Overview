import React from 'react'
import { useStore } from '../lib/store.jsx'

/**
 * "This list is filtered" – and a way out of it.
 *
 * Filters survive leaving the tab now (see lib/stickyState.js), which is what
 * makes cross-referencing two tabs bearable. It is also what turns a forgotten
 * filter into a lie: come back on Monday, see 12 of 50 people, and the reason
 * is a base filter set on Friday for something else entirely.
 *
 * So persistence and this notice are one change, not two. It appears only when
 * something is actually narrowing the list, it says how much is hidden, and
 * clearing it is one tap.
 */
export default function FilterNote({ active, shown, total, onClear }) {
  const { t } = useStore()
  if (!active) return null
  const hidden = Math.max(0, (total || 0) - (shown || 0))
  return (
    <span className="filter-note">
      <span className="filter-note-text">
        {t('filterActive')}
        {hidden > 0 ? ' · ' + t('filterHidden').replace('{n}', String(hidden)) : ''}
      </span>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
        {t('clearFilters')}
      </button>
    </span>
  )
}
