import React, { useEffect, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import ExportLink from '../components/ExportLink.jsx'
import { hashParts, setHash } from '../lib/hash.js'
import Conversion from './Conversion.jsx'
import Planning from './Planning.jsx'

// Board, planning grid and calendar under one tab.
//
// They were two tabs describing the same journey of the same person: the board
// held six stages, the grid four steps, and each carried its own dates and its
// own status. Nothing compared the two, so they could disagree without anyone
// noticing – a step booked and completed in Planung while the card still sat in
// an earlier column on the board.
//
// This is the cheap half of fixing that: one place, three views, the data
// untouched. Merging the two lists into one is a separate, larger job.
const VIEWS = [
  { id: 'board', labelKey: 'view_board' },
  { id: 'table', labelKey: 'tab_planning' },
  { id: 'calendar', labelKey: 'planning_viewCalendar' }
]

// The chosen view survives leaving the tab and a reload.
//
// It used to be plain component state, so a glance at the dashboard and back
// dropped the planner from "Planung" onto the Kanban board - and the whole
// booking job lives in Planung. Two places remember it: the fragment
// (#/conversion/table, so a reload and a shared link keep it too), and this
// module-level fallback for the moment the tab is re-entered, when the
// fragment has just been rewritten to the bare tab.
let lastView = 'board'

function viewFromHash() {
  const sub = hashParts()[1]
  return VIEWS.some((v) => v.id === sub) ? sub : lastView
}

export default function ConversionHub({ capture }) {
  const { t } = useStore()
  const [view, setView] = useState(viewFromHash)
  useEffect(() => {
    if (capture) return
    lastView = view
    setHash(['conversion', view])
  }, [view, capture])
  return (
    <div className="tab-pane">
      <div className="toolbar no-print hub-bar">
        <h2 className="pane-title">{t('tab_conversion')}</h2>
        <span className="push-right" />
        <ExportLink id="conversion" />
        <div className="seg-toggle" role="group" aria-label={t('planning_view')}>
          {VIEWS.map((v) => (
            <button
              key={v.id}
              className={'seg-btn' + (view === v.id ? ' active' : '')}
              aria-pressed={view === v.id}
              onClick={() => setView(v.id)}
            >
              {t(v.labelKey)}
            </button>
          ))}
        </div>
      </div>
      {/* Each view keeps its OWN filter bar – the board filters people, the grid
          filters rows, and they are not the same question. Only the title and
          the view switch are shared, which is why both take `embedded`. */}
      {view === 'board' ? <Conversion embedded /> : <Planning view={view} embedded />}
    </div>
  )
}
