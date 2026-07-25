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

// ---- Trend columns (one stacked column per month) -------------------------
// Progress over time: each column is a month, split into the conversion stages.
// Columns rather than lines because the three series always add up to the same
// population – the reader is meant to see the dark "released" block growing
// from the bottom, not three curves crossing.
//
// The series are a PROGRESSION, so they take one hue getting darker (released
// darkest, at the bottom where it grows from). Status green/amber/red stays
// reserved and is never a series colour here.
export function TrendColumns({ data, series, height = 180, labelOf }) {
  const pick = useChartColor()
  const max = Math.max(1, ...data.map((d) => d.total || 0))
  // Only every nth label once the axis gets crowded, so months never overlap.
  const step = Math.ceil(data.length / 12)
  return (
    <div className="trend">
      <div className="trend-plot" style={{ height: height + 'px' }}>
        {data.map((d, i) => (
          <div className="trend-col" key={d.key} title={`${labelOf ? labelOf(d.key) : d.key}: ${d.total}`}>
            <div className="trend-stack">
              {/* Bottom-up: the stack is drawn in reverse so the first series
                  sits at the base of the column. */}
              {[...series].reverse().map((ser) => {
                const v = d[ser.key] || 0
                return v ? (
                  <div
                    key={ser.key}
                    className="trend-seg"
                    style={{ height: `${(v / max) * 100}%`, background: pick(ser.color, 0) }}
                    title={`${ser.label}: ${v}`}
                  />
                ) : null
              })}
            </div>
            <div className="trend-tick">{i % step === 0 ? (labelOf ? labelOf(d.key) : d.key) : ''}</div>
          </div>
        ))}
      </div>
      <ChartLegend
        wrap
        className="stacked-legend"
        items={series.map((ser) => ({
          key: ser.key,
          color: pick(ser.color, 0),
          label: ser.label,
          // The LATEST month, not a sum: adding a headcount across months would
          // count the same people once per month and mean nothing.
          value: data.length ? data[data.length - 1][ser.key] || 0 : 0
        }))}
      />
    </div>
  )
}

// ---- Nested bars (a part inside its whole) --------------------------------
// For a measure and a subset of it – headcount and the FTE those heads add up
// to. Nested rather than side by side because that is the actual relationship:
// FTE can never exceed heads, and the empty remainder IS the part-time share,
// which is the thing worth seeing. One coloured mark per row, so the series
// colour can never be read as a row identity.
// `totals` is optional but should be passed whenever the rows carry rounded
// values: adding up five rows that were each rounded to one decimal is not the
// same number as rounding the exact sum once. That is how the base card came to
// claim 43 FTE while every other card said 42,9 for the identical people.
export function NestedBars({ data, series, format, totals }) {
  const pick = useChartColor()
  const [whole, part] = series
  const max = Math.max(1, ...data.map((d) => d[whole.key] || 0))
  const fmt = format || ((v) => v)
  return (
    <div className="nbars">
      {data.map((d) => {
        const w = d[whole.key] || 0
        const p = d[part.key] || 0
        // Clamped so hand-entered data (FTE above 1 per person) cannot draw the
        // inner bar outside its band; the printed numbers stay truthful.
        const inner = w > 0 ? Math.min(p, w) / w : 0
        return (
          <div className="nbar-row" key={d.key}>
            <div className="hbar-label" title={d.label || d.key}>{d.label || d.key}</div>
            <div className="nbar-track">
              {w > 0 && (
                <div
                  className="nbar-whole"
                  style={{ width: `${(w / max) * 100}%`, background: pick(whole.color, 0) }}
                  title={`${whole.label}: ${fmt(w)}`}
                >
                  {p > 0 && (
                    <div
                      className="nbar-part"
                      style={{ width: `${inner * 100}%`, background: pick(part.color, 0) }}
                      title={`${part.label}: ${fmt(p)}`}
                    />
                  )}
                </div>
              )}
            </div>
            <div className="nbar-vals">
              <span className="nbar-val">{fmt(w)}</span>
              <span className="nbar-val part">{fmt(p)}</span>
            </div>
          </div>
        )
      })}
      <ChartLegend
        wrap
        items={series.map((ser) => ({
          key: ser.key,
          color: pick(ser.color, 0),
          label: ser.label,
          value: fmt(
            totals && totals[ser.key] != null
              ? totals[ser.key]
              : data.reduce((s2, d) => s2 + (d[ser.key] || 0), 0)
          )
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
