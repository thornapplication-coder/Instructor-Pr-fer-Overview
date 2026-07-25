import React from 'react'
import { useStore } from '../lib/store.jsx'

/**
 * A date field that can actually be emptied.
 *
 * `<input type="date">` offers no way to clear itself on iOS/iPadOS Safari –
 * there is no clear affordance in the native picker and the text is not
 * selectable – so a target date, once set, could never be taken back. Desktop
 * Chrome happens to draw a small ✕, which is why this went unnoticed.
 *
 * Every date in this app is optional, so the button is always the right
 * affordance; it only appears when there is something to clear.
 */
export default function DateInput({ value, onChange, className = '', ...rest }) {
  const { t } = useStore()
  const v = value || ''
  return (
    <span className="date-field">
      <input
        className={'input ' + className}
        type="date"
        value={v}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
      {v && (
        // type="button": these sit inside forms, and the implicit "submit"
        // would close the dialog instead of clearing the field.
        <button
          type="button"
          className="mini-btn date-clear"
          onClick={() => onChange('')}
          aria-label={t('clearDate')}
          title={t('clearDate')}
        >
          ✕
        </button>
      )}
    </span>
  )
}
