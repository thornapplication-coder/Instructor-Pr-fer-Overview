import React from 'react'

// Eurowings on-brand categorical palette (burgundy-dominant, skyblue accent).
export const EW_PALETTE = [
  '#AF1E65', '#00A6CF', '#871C54', '#6BCCE0',
  '#D41370', '#701745', '#E8A33D', '#2FA36B', '#787878'
]

export function colorAt(i) {
  return EW_PALETTE[i % EW_PALETTE.length]
}

// ---- Donut chart ----------------------------------------------------------
export function Donut({ data, size = 168, thickness = 26, centerTop, centerBottom }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  const r = (size - thickness) / 2
  const cx = size / 2
  const cy = size / 2
  const C = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="donut">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#EEF0F2" strokeWidth={thickness} />
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
                stroke={d.color || colorAt(i)}
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
            <span className="dot" style={{ background: d.color || colorAt(i) }} />
            <span className="legend-key">{d.label || d.key}</span>
            <span className="legend-val">{d.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---- Horizontal bar list --------------------------------------------------
export function HBars({ data, colorFn }) {
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
                background: colorFn ? colorFn(d, i) : colorAt(i)
              }}
            />
          </div>
          <div className="hbar-val">{d.count}</div>
        </div>
      ))}
    </div>
  )
}

// ---- Overall progress ring ------------------------------------------------
export function ProgressRing({ value, size = 128, thickness = 14, label }) {
  const r = (size - thickness) / 2
  const cx = size / 2
  const C = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(1, value))
  return (
    <div className="progress-ring">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#EEF0F2" strokeWidth={thickness} />
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke="#AF1E65"
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
              style={{ flexGrow: s.count, background: s.color }}
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
            <span className="dot" style={{ background: s.color }} />
            <span className="legend-key">{s.label}</span>
            <span className="legend-val">{s.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
