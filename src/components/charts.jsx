import React from 'react'
import { useStore } from '../lib/store.jsx'
import { BRAND, colorAt as slotColor, themed } from '../lib/palette.js'

// Charts read their colours from the documented system (src/lib/palette.js);
// nothing is chosen here. The stored hex of a user-editable category is mapped
// to its dark-mode step at render time – a persisted hex cannot re-step itself.
export function useChartColor() {
  const { data } = useStore()
  const dark = (data?.theme || 'light') === 'dark'
  // `i` is the slot; past slot 8 it returns the neutral overflow rather than
  // cycling, which used to hand two categories the identical colour.
  return (color, i) => themed(color, dark) || slotColor(i, dark)
}

export { slotColor as colorAt }

// ---- Donut chart ----------------------------------------------------------
export function Donut({ data, size = 168, thickness = 26, centerTop, centerBottom }) {
  const pick = useChartColor()
  const total = data.reduce((s, d) => s + d.count, 0)
  const r = (size - thickness) / 2
  const cx = size / 2
  const cy = size / 2
  const C = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="donut">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--chart-track)" strokeWidth={thickness} />
        {total > 0 &&
          data.map((d, i) => {
            const frac = d.count / total
            const len = frac * C
            const el = (
              <circle
                key={d.key}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={pick(d.color, i)}
                strokeWidth={thickness}
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${cx} ${cy})`}
                strokeLinecap="butt"
              />
            )
            offset += len
            return el
          })}
        <text x={cx} y={cy - 4} textAnchor="middle" className="donut-num">
          {centerTop ?? total}
        </text>
        {centerBottom && (
          <text x={cx} y={cy + 16} textAnchor="middle" className="donut-sub">
            {centerBottom}
          </text>
        )}
      </svg>
      <ul className="legend">
        {data.map((d, i) => (
          <li key={d.key}>
            <span className="dot" style={{ background: pick(d.color, i) }} />
            <span className="legend-key">{d.label || d.key}</span>
            <span className="legend-val">{d.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---- Horizontal bar list --------------------------------------------------
// ONE series, so one colour: base, authority and part-time are plain names, and
// the bar length already carries the comparison. Painting each bar a different
// hue spends the identity channel on information the chart is showing twice and
// makes the card read as five unrelated things. `colorFn` stays for the rare
// case where the colour genuinely means something.
export function HBars({ data, colorFn }) {
  const pick = useChartColor()
  const max = Math.max(1, ...data.map((d) => d.count))
  return (
    <div className="hbars">
      {data.map((d, i) => (
        <div className="hbar-row" key={d.key}>
          <div className="hbar-label" title={d.label || d.key}>
            {d.label || d.key}
          </div>
          <div className="hbar-track">
            <div
              className="hbar-fill"
              style={{
                width: `${(d.count / max) * 100}%`,
                background: colorFn ? pick(colorFn(d, i), i) : pick(null, 0)
              }}
            />
          </div>
          <div className="hbar-val">{d.count}</div>
        </div>
      ))}
    </div>
  )
}

// ---- Stacked horizontal bars (one bar per row, split into series) ---------
// data rows: { key, label?, [series.key]: number }. series: [{ key, label, color }].
export function StackedBars({ data, series }) {
  const pick = useChartColor()
  const rowTotal = (d) => series.reduce((s, ser) => s + (d[ser.key] || 0), 0)
  const max = Math.max(1, ...data.map(rowTotal))
  return (
    <div className="hbars stacked">
      {data.map((d) => (
        <div className="hbar-row" key={d.key}>
          <div className="hbar-label" title={d.label || d.key}>{d.label || d.key}</div>
          <div className="hbar-track">
            {series.map((ser) => {
              const v = d[ser.key] || 0
              return v ? (
                <div
                  key={ser.key}
                  className="hbar-seg"
                  style={{ width: `${(v / max) * 100}%`, background: pick(ser.color, 0) }}
                  title={`${ser.label}: ${v}`}
                />
              ) : null
            })}
          </div>
          <div className="hbar-val">{rowTotal(d)}</div>
        </div>
      ))}
      <ul className="legend legend-wrap stacked-legend">
        {series.map((ser) => (
          <li key={ser.key}>
            <span className="dot" style={{ background: pick(ser.color, 0) }} />
            <span className="legend-key">{ser.label}</span>
            <span className="legend-val">{data.reduce((s, d) => s + (d[ser.key] || 0), 0)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---- Overall progress ring ------------------------------------------------
export function ProgressRing({ value, size = 128, thickness = 14, label }) {
  const pick = useChartColor()
  const r = (size - thickness) / 2
  const cx = size / 2
  const C = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(1, value))
  return (
    <div className="progress-ring">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--chart-track)" strokeWidth={thickness} />
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={pick(BRAND.burgundy, 0)}
          strokeWidth={thickness}
          strokeDasharray={`${pct * C} ${C}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cx})`}
        />
        <text x={cx} y={cx + 6} textAnchor="middle" className="ring-num">
          {Math.round(pct * 100)}%
        </text>
      </svg>
      {label && <div className="progress-ring-label">{label}</div>}
    </div>
  )
}

// ---- Pipeline stacked bar -------------------------------------------------
export function PipelineBar({ stages }) {
  const pick = useChartColor()
  const total = stages.reduce((s, d) => s + d.count, 0)
  return (
    <div className="pipeline-bar-wrap">
      <div className="pipeline-bar">
        {total === 0 && <div className="pipeline-empty" />}
        {stages.map((s) =>
          s.count > 0 ? (
            <div
              key={s.id}
              className="pipeline-seg"
              style={{ flexGrow: s.count, background: pick(s.color, 0) }}
              title={`${s.label}: ${s.count}`}
            >
              {s.count}
            </div>
          ) : null
        )}
      </div>
      <ul className="legend legend-wrap">
        {stages.map((s) => (
          <li key={s.id}>
            <span className="dot" style={{ background: pick(s.color, 0) }} />
            <span className="legend-key">{s.label}</span>
            <span className="legend-val">{s.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
