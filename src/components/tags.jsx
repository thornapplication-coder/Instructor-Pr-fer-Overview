import React from 'react'
import { useStore } from '../lib/store.jsx'
import { useThemed } from '../lib/useThemed.js'
import { AC_COLORS, ORE_COLORS, ROLE_CPT, ROLE_FO } from '../lib/palette.js'

// The small identity chips that appear on cards and in tables. They live here
// rather than as three copies with hardcoded hexes in CSS: the same categories
// are drawn in the dashboard charts from palette.js, and the two sets had
// already drifted apart (First Officer was blue on a card and pink in the
// donut) with no dark-mode step on the CSS side.
export function RoleTag({ role, sm }) {
  const { t } = useStore()
  const tint = useThemed()
  const fo = role === 'fo'
  return (
    <span
      className={'role-tag' + (sm ? ' sm' : '')}
      style={{ '--tag': tint(fo ? ROLE_FO : ROLE_CPT) }}
      title={fo ? t('role_fo') : t('role_captain')}
    >
      {fo ? t('role_foShort') : t('role_captainShort')}
    </span>
  )
}

export function AircraftTag({ value, sm }) {
  const tint = useThemed()
  if (!value) return <span className={'ac-tag' + (sm ? ' sm' : '')}>–</span>
  return (
    <span className={'ac-tag' + (sm ? ' sm' : '')} style={{ '--tag': tint(AC_COLORS[value]) }}>
      {value}
    </span>
  )
}

// ORE is a priority tier, so an ordinal ramp: A darkest, C lightest. A person
// without a tier is not a fourth category and takes no colour at all.
export function OreTag({ value, sm }) {
  const tint = useThemed()
  const col = ORE_COLORS[value]
  return (
    <span
      className={'ore-tag' + (sm ? ' sm' : '')}
      style={col ? { '--tag': tint(col) } : undefined}
    >
      {value || '–'}
    </span>
  )
}
