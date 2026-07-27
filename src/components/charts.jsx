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
// `markOf` (optional) returns the planned value for a column, drawn as a thin
// rule across it. A line rather than a fourth series: the plan is not part of
// the population, it is the height the dark block is supposed to reach.
// `legendMode`: 'last' (default) reads the most recent column – right for a
// STOCK, where adding months would count the same people once per month. 'sum'
// totals every column – right for a FLOW, where each month is different people.
export function TrendColumns({ data, series, height = 180, labelOf, markOf, markLabel, legendMode = 'last', showValues }) {
  const pick = useChartColor()
  // The scale has to contain the target line too. Sized on the bars alone, a
  // target above the tallest month gets clamped to the top edge – and then
  // three different targets all draw at the same height, which reads as one
  // flat plan instead of a rising one.
  const marks = markOf ? data.map((d) => markOf(d.key)).filter((v) => v != null) : []
  const max = Math.max(1, ...data.map((d) => d.total || 0), ...marks)
  // Only every nth label once the axis gets crowded, so months never overlap.
  const step = Math.ceil(data.length / 12)
  return (
    <div className="trend">
      <div className="trend-plot" style={{ height: height + 'px' }}>
        {data.map((d, i) => (
          <div className="trend-col" key={d.key} title={`${labelOf ? labelOf(d.key) : d.key}: ${d.total}`}>
            {(() => {
              const m = markOf ? markOf(d.key) : null
              // Clamped: a milestone bigger than the pool would otherwise draw
              // its line above the plot and look like a rendering fault.
              return m == null ? null : (
                <div
                  className="trend-mark"
                  style={{ bottom: `${Math.min(m, max) / max * 100}%` }}
                  title={`${markLabel || 'Plan'}: ${m}`}
                />
              )
            })()}
            <div className="trend-stack">
              {/* Bottom-up: the stack is drawn in reverse so the first series
                  sits at the base of the column. */}
              {[...series].reverse().map((ser) => {
                const v = d[ser.key] || 0
                if (!v) return null
                const share = v / max
                return (
                  <div
                    key={ser.key}
                    className="trend-seg"
                    style={{ height: `${share * 100}%`, background: pick(ser.color, 0) }}
                    title={`${ser.label}: ${v}`}
                  >
                    {/* Only label a segment tall enough to hold the text – a
                        number spilling out of a 6px sliver is worse than none. */}
                    {showValues && share >= 0.09 && (
                      <span className="trend-seg-val">{v} {ser.short || ser.label}</span>
                    )}
                  </div>
                )
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
          value:
            legendMode === 'sum'
              ? data.reduce((s, d) => s + (d[ser.key] || 0), 0)
              : data.length
                ? data[data.length - 1][ser.key] || 0
                : 0
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

// ---- Multi-line trend -----------------------------------------------------
// One line per category over months. Used for durations, where the interesting
// thing is the SHAPE per course type, not a total – so nothing is stacked and
// nothing is summed across types.
//
// Missing months are holes, not zeros: a month in which nobody finished a TRI
// course says nothing about how long a TRI course takes. The line is therefore
// cut into runs of consecutive readings, and a lone reading shows as a dot.
//
// `series[].target` draws a faint dashed line in the same colour – the same
// identity, so it can never be mistaken for a sixth course type.
export function LineTrend({ data, series, height = 200, labelOf, unit, legendValue, refLine, format }) {
  const fmt = format || String
  const pick = useChartColor()
  const vals = []
  for (const d of data) for (const s of series) if (d.values[s.key] != null) vals.push(d.values[s.key])
  for (const s of series) if (s.target) vals.push(s.target)
  if (refLine) vals.push(refLine.value)
  const raw = Math.max(1, ...vals)
  // A round ceiling, so the axis reads 30 rather than 28,4.
  const stepSize = raw <= 10 ? 2 : raw <= 50 ? 5 : 10
  const max = Math.ceil(raw / stepSize) * stepSize
  const xOf = (i) => (data.length > 1 ? (i / (data.length - 1)) * 100 : 50)
  const yOf = (v) => 100 - (v / max) * 100
  const tick = Math.ceil(data.length / 12)

  // Consecutive readings only – the gaps stay gaps.
  const runsOf = (key) => {
    const runs = []
    let cur = []
    data.forEach((d, i) => {
      const v = d.values[key]
      if (v == null) {
        if (cur.length) runs.push(cur)
        cur = []
      } else cur.push({ x: xOf(i), y: yOf(v) })
    })
    if (cur.length) runs.push(cur)
    return runs
  }

  return (
    <div className="lines">
      <div className="lines-plot" style={{ height: height + 'px' }}>
        <div className="lines-axis">
          <span>{fmt(max)}{unit ? ' ' + unit : ''}</span>
          <span>{fmt(max / 2)}</span>
          <span>0</span>
        </div>
        <div className="lines-area">
          {/* preserveAspectRatio="none" stretches the 100x100 grid to the box;
              non-scaling-stroke keeps the lines from being stretched with it. */}
          <svg className="lines-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {/* One neutral reference for every series – used when the values are
                already expressed against their own target, where a line per
                course type would be five copies of the same 100 %. */}
            {refLine && (
              <line
                className="lines-ref"
                x1="0"
                x2="100"
                y1={yOf(refLine.value)}
                y2={yOf(refLine.value)}
                vectorEffect="non-scaling-stroke"
              />
            )}
            {series.map((s) =>
              s.target ? (
                <line
                  key={'t-' + s.key}
                  className="lines-target"
                  x1="0"
                  x2="100"
                  y1={yOf(s.target)}
                  y2={yOf(s.target)}
                  stroke={pick(s.color, 0)}
                  vectorEffect="non-scaling-stroke"
                />
              ) : null
            )}
            {series.map((s) =>
              runsOf(s.key).map((run, i) => (
                <polyline
                  key={s.key + '-' + i}
                  className="lines-path"
                  points={run.map((p) => p.x + ',' + p.y).join(' ')}
                  fill="none"
                  stroke={pick(s.color, 0)}
                  vectorEffect="non-scaling-stroke"
                />
              ))
            )}
          </svg>
          {series.map((s) =>
            data.map((d, i) =>
              d.values[s.key] == null ? null : (
                <span
                  key={s.key + '-' + d.key}
                  className="lines-dot"
                  style={{
                    left: xOf(i) + '%',
                    bottom: 100 - yOf(d.values[s.key]) + '%',
                    background: pick(s.color, 0)
                  }}
                  title={`${labelOf ? labelOf(d.key) : d.key} · ${s.label}: ${fmt(d.values[s.key])}${unit ? ' ' + unit : ''}`}
                />
              )
            )
          )}
          {/* Inside the plot area, so a tick sits under the point it names
              rather than under the middle of an evenly divided slot. */}
          <div className="lines-ticks">
            {data.map((d, i) =>
              i % tick === 0 ? (
                <span key={d.key} style={{ left: xOf(i) + '%' }}>{labelOf ? labelOf(d.key) : d.key}</span>
              ) : null
            )}
          </div>
        </div>
      </div>
      <ChartLegend
        wrap
        className="stacked-legend"
        items={series.map((s) => ({
          key: s.key,
          color: pick(s.color, 0),
          label: s.label,
          value: legendValue ? legendValue(s) : ''
        }))}
      />
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
