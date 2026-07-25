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

// One legend for every chart here. It used to be four verbatim copies, so any
// change (a11y, dark mode, truncation) had to be made four times and drifted.
function ChartLegend({ items, wrap, className }) {
  return (
    <ul className={'legend' + (wrap ? ' legend-wrap' : '') + (className ? ' ' + className : '')}>
      {items.map((it) => (
        <li key={it.key}>
          <span className="dot" style={{ background: it.color }} />
          <span className="legend-key">{it.label}</span>
          <span className="legend-val">{it.value}</span>
        </li>
      ))}
    </ul>
  )
}

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
      <ChartLegend items={data.map((d, i) => ({ key: d.key, color: pick(d.color, i), label: d.label || d.key, value: d.count }))} />
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
      <ChartLegend
        wrap
        className="stacked-legend"
        items={series.map((ser) => ({
          key: ser.key,
          color: pick(ser.color, 0),
          label: ser.label,
          value: data.reduce((s, d) => s + (d[ser.key] || 0), 0)
        }))}
      />
    </div>
  )
}

// ---- Grouped bars (two measures per row, side by side) --------------------
// For comparing two measures of the SAME unit-ish scale across categories –
// here headcount against FTE. Deliberately grouped, not stacked: stacking would
// draw "heads + FTE", a sum that means nothing. And deliberately one axis: two
// scales would invent a relationship the data does not have.
export function GroupedBars({ data, series, format }) {
  const pick = useChartColor()
  const max = Math.max(1, ...data.flatMap((d) => series.map((ser) => d[ser.key] || 0)))
  const fmt = format || ((v) => v)
  return (
    <div className="gbars">
      {data.map((d) => (
        <div className="gbar-row" key={d.key}>
          <div className="hbar-label" title={d.label || d.key}>{d.label || d.key}</div>
          <div className="gbar-group">
            {series.map((ser, i) => {
              const v = d[ser.key] || 0
              return (
                <div className="gbar-line" key={ser.key}>
                  <div className="gbar-track">
                    {/* No mark for a zero: .gbar-fill has a 3px minimum, so an
                        empty B737 row would otherwise show a coloured stub and
                        read as "a little capacity exists". */}
                    {v > 0 && (
                      <div
                        className="gbar-fill"
                        style={{ width: `${(v / max) * 100}%`, background: pick(ser.color, i) }}
                        title={`${ser.label}: ${fmt(v)}`}
                      />
                    )}
                  </div>
                  <span className="gbar-val">{fmt(v)}</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
      <ChartLegend
        wrap
        items={series.map((ser, i) => ({
          key: ser.key,
          color: pick(ser.color, i),
          label: ser.label,
          value: fmt(data.reduce((s2, d) => s2 + (d[ser.key] || 0), 0))
        }))}
      />
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
      <ChartLegend
        wrap
        items={stages.map((s) => ({ key: s.id, color: pick(s.color, 0), label: s.label, value: s.count }))}
      />
    </div>
  )
}
