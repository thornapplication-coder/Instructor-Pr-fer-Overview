import React from 'react'
import { useStore } from '../lib/store.jsx'

/**
 * "Take this list with you" – on the tab the list is actually on.
 *
 * Every export lives behind the gear, and a gear means settings, not download.
 * A walkthrough found no export affordance on any tab at all: the only door was
 * an icon nobody would try. This is that door, put where the question is asked.
 *
 * It does not duplicate the export code - it navigates to the one place that
 * owns it, naming the row to open, so there is still exactly one export path.
 * The hash is ASSIGNED rather than replaced: an assignment fires `hashchange`,
 * which is what makes App switch tabs. (App only rewrites the fragment when the
 * tab segment itself changes, so the row name survives the switch.)
 */
export default function ExportLink({ id }) {
  const { t } = useStore()
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm export-link no-print no-capture"
      title={t('exportThis')}
      aria-label={t('exportThis')}
      onClick={() => { window.location.hash = '#/settings/' + id }}
    >
      ⤓ <span className="export-link-text">{t('export')}</span>
    </button>
  )
}
