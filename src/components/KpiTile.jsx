import React from 'react'

export default function KpiTile({ value, label, sub, accent, big }) {
  return (
    <div className={'kpi' + (big ? ' kpi-big' : '')}>
      <div className="kpi-value" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      <div className="kpi-label">{label}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  )
}
