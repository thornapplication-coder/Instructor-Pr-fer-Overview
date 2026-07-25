import React, { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import KpiTile from '../components/KpiTile.jsx'
import { Donut, NestedBars, HBars, ProgressRing, PipelineBar, StackedBars, TrendColumns, colorAt } from '../components/charts.jsx'
import { historySeries, monthKey, monthLabelShort } from '../lib/history.js'
import { planStatus, planFor } from '../lib/plan.js'
import { monthLabel } from '../lib/alerts.js'
import { useThemed } from '../lib/useThemed.js'
import {
  headcount,
  conversionSummary,
  byBase,
  byQual,
  byOre,
  byAuthority,
  byPartTime,
  byFunction,
  qualByAircraft,
  pipelineDistribution,
  conversionFteSummary,
  capacityByBase,
  capacityByAircraft
} from '../lib/stats.js'
import { conversionProgress, STAFF_TYPE } from '../data/pipeline.js'
import { qualLabel, conversionTrainers, CONVERSION_QUALS } from '../data/qualifications.js'
import { AIRCRAFT } from '../data/aircraft.js'
import { CATEGORICAL, MEASURE_WHOLE, MEASURE_PART, STATUS, BRAND, stageRamp } from '../lib/palette.js'
import { formatFte1 } from '../lib/format.js'

// ORE is a priority tier (A before B before C), so it reads as an ordinal ramp –
// darker means more urgent.
// Everything else here is identity and takes documented categorical slots.
const ORE_RAMP = stageRamp(3)
const ORE_COLORS = { A: ORE_RAMP[2], B: ORE_RAMP[1], C: ORE_RAMP[0] }
const AC_COLORS = { A320: CATEGORICAL[0], B737: CATEGORICAL[1] }
// Slot 4 rather than slot 2: the role tag sits right next to the aircraft tag on
// a conversion card, and two identical blues there would read as one thing.
const ROLE_COLORS = { captain: CATEGORICAL[0], fo: CATEGORICAL[3] }

function Card({ title, total, children }) {
  const { t } = useStore()
  return (
    <section className="card">
      <div className="card-head">
        <h3 className="card-title">{title}</h3>
        {total != null && <span className="card-total">{t('total')}: {total}</span>}
      </div>
      {children}
    </section>
  )
}

// Order a zone's widgets by the stored id order; unknown/new widgets are
// appended in their default order (forward-compatible when widgets are added).
function ordered(widgets, orderIds) {
  if (!orderIds || !orderIds.length) return widgets
  const byId = new Map(widgets.map((w) => [w.id, w]))
  const out = []
  for (const id of orderIds) if (byId.has(id)) { out.push(byId.get(id)); byId.delete(id) }
  for (const w of widgets) if (byId.has(w.id)) out.push(w)
  return out
}

// A group of dashboard widgets. In view mode it renders the widgets straight
// into the grid (identical to before, so the PDF capture is unchanged). In
// arrange mode each widget gets a drag handle and can be reordered by drag&drop.
function ReorderZone({ zone, items, className, editing, onReorder, t }) {
  const [dragId, setDragId] = useState(null)
  const [overId, setOverId] = useState(null)
  if (!editing) {
    return <div className={className}>{items.map((it) => <React.Fragment key={it.id}>{it.node}</React.Fragment>)}</div>
  }
  const move = (from, to) => {
    const ids = items.map((i) => i.id)
    const fi = ids.indexOf(from)
    const ti = ids.indexOf(to)
    if (fi < 0 || ti < 0 || fi === ti) return
    ids.splice(ti, 0, ids.splice(fi, 1)[0])
    onReorder(zone, ids)
  }
  // Shift by one position. HTML5 drag is unavailable on iOS Safari and to
  // keyboard users, so these buttons are the primary path there.
  const shift = (i, dir) => {
    const to = i + dir
    if (to < 0 || to >= items.length) return
    move(items[i].id, items[to].id)
  }
  return (
    <div className={className + ' dash-editing'}>
      {items.map((it, i) => (
        <div
          key={it.id}
          className={'dash-item' + (dragId === it.id ? ' dragging' : '') + (overId === it.id ? ' drop-over' : '')}
          draggable
          onDragStart={(e) => {
            setDragId(it.id)
            try { e.dataTransfer.setData('text/plain', it.id); e.dataTransfer.effectAllowed = 'move' } catch (_) { /* older browsers */ }
          }}
          onDragOver={(e) => { e.preventDefault(); if (overId !== it.id) setOverId(it.id) }}
          onDrop={() => { if (dragId && dragId !== it.id) move(dragId, it.id); setDragId(null); setOverId(null) }}
          onDragEnd={() => { setDragId(null); setOverId(null) }}
        >
          <div className="dash-move">
            <button className="mini-btn" disabled={i === 0} onClick={() => shift(i, -1)} aria-label={t('moveBack')} title={t('moveBack')}>‹</button>
            <button className="mini-btn" disabled={i === items.length - 1} onClick={() => shift(i, +1)} aria-label={t('moveForward')} title={t('moveForward')}>›</button>
          </div>
          {it.node}
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { data, t, lang, setDashboardOrder } = useStore()
  const tint = useThemed()
  const { trainers, stages, quals: qualDefs } = data
  const [editing, setEditing] = useState(false)
  const order = (data.dashboard && data.dashboard.order) || {}
  const total = trainers.length

  const qualOrder = qualDefs.map((q) => q.id)
  const hc = headcount(trainers)
  // The conversion only applies to SEN / TRE / TRI / LTC (not SFI / TKI).
  const convPool = conversionTrainers(trainers)
  const cs = conversionSummary(convPool, stages)
  const fteS = conversionFteSummary(convPool, stages)
  const qualData = byQual(trainers, qualOrder).map((r) => ({ ...r, label: qualLabel(qualDefs, r.key) }))
  const qualAc = qualByAircraft(trainers, qualOrder, AIRCRAFT).map((r) => ({ ...r, label: qualLabel(qualDefs, r.key) }))
  const bases = byBase(trainers)
  // ORE is the conversion priority, so it follows the conversion scope.
  const ore = byOre(convPool).map((r) => ({ ...r, color: ORE_COLORS[r.key] }))
  const auth = byAuthority(trainers)
  const pt = byPartTime(trainers)
  const fn = byFunction(trainers)
  const staffInternal = trainers.filter((x) => (x.staffType || 'internal') === 'internal').length
  const staffExternal = trainers.length - staffInternal
  const aircraft = AIRCRAFT.map((a) => ({ key: a, count: trainers.filter((x) => x.aircraft === a).length, color: AC_COLORS[a] }))
  const acSeries = AIRCRAFT.map((a, i) => ({ key: a, label: a, color: AC_COLORS[a] || colorAt(i) }))
  // Heads against FTE: the same people counted two ways, so one axis and two
  // grouped bars. The gap between them is the part-time share, which is the
  // point of showing them together. Retirees are already excluded by capacityBy.
  // The whole first, then the part that sits inside it.
  const headFte = [
    { key: 'heads', label: t('metric_heads'), color: MEASURE_WHOLE },
    { key: 'fte', label: t('metric_fte'), color: MEASURE_PART }
  ]
  const toHeadFte = (r) => ({ key: r.key, label: r.key, heads: r.headcount, fte: r.total })
  // Keep the authoritative totals alongside the rows – the legend must not add
  // the rounded rows back up (see NestedBars).
  const toHeadFteCap = (cap) => ({ rows: cap.rows.map(toHeadFte), totals: toHeadFte(cap.totals) })
  const capBase = useMemo(
    () => toHeadFteCap(capacityByBase(trainers, AIRCRAFT, stages)),
    [trainers, stages]
  )
  const capAc = useMemo(
    () => toHeadFteCap(capacityByAircraft(trainers, AIRCRAFT, stages)),
    [trainers, stages]
  )
  const fte1 = (v) => formatFte1(v, lang)

  // Progress over time. The three series are stages of one journey, so they
  // take one hue getting darker – released is the darkest and sits at the base
  // of each column, where the reader watches it grow.
  const trend = useMemo(() => historySeries(data.history), [data.history])
  const TREND_RAMP = stageRamp(3)
  const trendSeries = [
    { key: 'released', label: t('kpi_released'), color: TREND_RAMP[2] },
    { key: 'inProgress', label: t('kpi_inProgress'), color: TREND_RAMP[1] },
    { key: 'notStarted', label: t('kpi_notStarted'), color: TREND_RAMP[0] }
  ]

  // Plan vs. actual. Measured against TODAY's released count rather than the
  // recorded month, so the card reacts the moment somebody is released instead
  // of waiting for the recorder.
  const thisMonth = monthKey(new Date())
  const plan = useMemo(() => planStatus(data.plan, cs.released, thisMonth), [data.plan, cs.released, thisMonth])
  const PLAN_LEVEL = {
    on_track: { color: STATUS.good, label: 'plan_onTrack' },
    at_risk: { color: STATUS.warn, label: 'plan_atRisk' },
    behind: { color: STATUS.critical, label: 'plan_behind' }
  }

  const pipe = pipelineDistribution(convPool, stages)
  const overall =
    convPool.length === 0 ? 0 : convPool.reduce((s, tr) => s + conversionProgress(stages, tr.conv), 0) / convPool.length

  // ---- Overview (Instruktoren & Prüfer) — one summary band instead of a tile
  // per number. The per-qualification and Captain/FO counts all repeat in the
  // charts right below, so the tiles said everything twice; only these two
  // figures exist nowhere else on the page.
  // There is no "excluding X" variant any more: with the Rente tier gone, the
  // roster is one population and FTE is one number.
  const ovHero = (
    <div className="kpi kpi-hero">
      <div className="kpi-hero-metric">
        <div className="kpi-value">{hc.total}</div>
        <div className="kpi-label">{t('kpi_totalTrainers')}</div>
      </div>
      <div className="kpi-hero-metric kpi-hero-fte">
        <div className="kpi-value">{fte1(hc.fte)}</div>
        <div className="kpi-label">FTE</div>
      </div>
    </div>
  )
  const ovChart = [
    { id: 'qual', node: <Card title={t('stat_qual')} total={total}><HBars data={qualData} /></Card> },
    { id: 'qualAc', node: <Card title={t('chart_qualByAircraft')} total={total}><StackedBars data={qualAc} series={acSeries} /></Card> },
    {
      id: 'role',
      node: (
        <Card title={t('chart_role')} total={total}>
          <Donut
            data={[
              { key: t('role_captain'), count: hc.captains, color: ROLE_COLORS.captain },
              { key: t('role_fo'), count: hc.firstOfficers, color: ROLE_COLORS.fo }
            ]}
            centerBottom="CPT / FO"
          />
        </Card>
      )
    },
    { id: 'base', node: <Card title={t('stat_base')} total={total}><HBars data={bases} /></Card> },
    {
      id: 'capBase',
      node: (
        <Card title={t('chart_headFteBase')} total={capBase.totals.heads}>
          <NestedBars data={capBase.rows} series={headFte} format={fte1} totals={capBase.totals} />
          <p className="stat-hint">{t('headFteHint')} {t('fteDefinition')}</p>
        </Card>
      )
    },
    {
      id: 'capAircraft',
      node: (
        <Card title={t('chart_headFteAircraft')} total={capAc.totals.heads}>
          <NestedBars data={capAc.rows} series={headFte} format={fte1} totals={capAc.totals} />
          <p className="stat-hint">{t('headFteHint')} {t('fteDefinition')}</p>
        </Card>
      )
    },
    { id: 'aircraft', node: <Card title={t('stat_aircraft')} total={total}><Donut data={aircraft} /></Card> },
    { id: 'authority', node: <Card title={t('stat_authority')} total={total}><HBars data={auth} /></Card> },
    { id: 'partTime', node: <Card title={t('stat_partTime')} total={total}><HBars data={pt} /></Card> },
    {
      id: 'function',
      node: (
        <Card title={t('stat_function')} total={total}>
          <Donut
            data={[
              { key: t('withFunction'), count: fn.withFunction, color: CATEGORICAL[0] },
              { key: t('withoutFunction'), count: fn.withoutFunction, color: CATEGORICAL[1] }
            ]}
          />
        </Card>
      )
    },
    {
      id: 'staff',
      node: (
        <Card title={t('filterStaff')} total={total}>
          <Donut
            data={[
              { key: t('staff_internal'), count: staffInternal, color: STAFF_TYPE.internal.color },
              { key: t('staff_external'), count: staffExternal, color: STAFF_TYPE.external.color }
            ]}
          />
        </Card>
      )
    }
  ]

  // ---- B737 Umschulung
  //
  // EVERY tile in this section counts the conversion pool only – SEN/TRE/TRI/
  // LTC, not SFI or TKI – so every tile says so. Without it "50 noch nicht
  // gestartet" reads as "50 of everyone", and the reader has no way to tell
  // that the population differs from the one in the section above.
  const convScope = t('convPoolOf')
    .replace('{n}', String(convPool.length))
    .replace('{q}', CONVERSION_QUALS.join('/'))
  const cvKpi = [
    { id: 'released', node: <KpiTile value={cs.released} label={t('kpi_released')} accent={STATUS.good} sub={convScope} /> },
    { id: 'inProgress', node: <KpiTile value={cs.inProgress} label={t('kpi_inProgress')} accent={BRAND.burgundy} sub={convScope} /> },
    { id: 'notStarted', node: <KpiTile value={cs.notStarted} label={t('kpi_notStarted')} accent={STATUS.neutral} sub={convScope} /> },
    // The FTE pair carries its denominator as well as the scope: an unlabelled
    // second "FTE" total reads as a contradiction, not as a different group.
    // Formatted through fte1 like every other figure – raw numbers printed
    // "38.9" next to the formatter's "38,9".
    {
      id: 'fteInConv',
      node: (
        <KpiTile
          value={fte1(fteS.inConversion)}
          label={t('kpi_fteInConversion')}
          accent={BRAND.burgundy}
          sub={`/ ${fte1(fteS.total)} FTE · ${convScope}`}
        />
      )
    },
    {
      id: 'fteAvail',
      node: (
        <KpiTile
          value={fte1(fteS.available)}
          label={t('kpi_fteAvailable')}
          accent={STATUS.good}
          sub={`/ ${fte1(fteS.total)} FTE · ${convScope}`}
        />
      )
    }
  ]
  const cvChart = [
    {
      id: 'pipeline',
      node: (
        <section className="card">
          <h2 className="card-title">{t('chart_pipeline')}</h2>
          <div className="pipeline-row">
            <ProgressRing value={overall} label={t('overallProgress')} />
            <div className="pipeline-flex"><PipelineBar stages={pipe} /></div>
          </div>
        </section>
      )
    },
    {
      id: 'ore',
      // Total = the people with a tier, not the whole pool: the chart only
      // counts A–C, and a header saying 50 above four slices adding to 48 is
      // the kind of mismatch that makes a reader distrust the rest of the page.
      node: (
        <Card title={t('chart_byOre')} total={ore.reduce((n, r) => n + r.count, 0)}>
          <Donut data={ore} centerBottom="ORE" />
        </Card>
      )
    },
    {
      id: 'trend',
      node: (
        <Card title={t('chart_trend')} total={trend.length ? trend[trend.length - 1].total : null}>
          {/* One month is a dot, not a development – say so instead of drawing
              a single column that looks like a finished chart. */}
          {trend.length < 2 ? (
            <p className="trend-empty">{t('trend_empty')}</p>
          ) : (
            <>
              <TrendColumns
                data={trend}
                series={trendSeries}
                labelOf={(k) => monthLabelShort(k, lang)}
                markOf={(k) => planFor(plan.series, k)}
                markLabel={t('plan_line')}
              />
              <p className="stat-hint">
                {t('trend_hint')}
                {plan.series.length > 0 && ' ' + t('plan_line') + ': ' + t('trend_markHint')}
              </p>
            </>
          )}
        </Card>
      )
    },
    {
      id: 'planVsActual',
      node: (
        <Card title={t('chart_planVsActual')}>
          {plan.level === 'none' ? (
            <>
              <p className="trend-empty">{t('plan_none')}</p>
              {plan.next && (
                <p className="stat-hint plan-next">
                  {t('plan_next').replace('{n}', String(plan.next.released)).replace('{m}', monthLabel(plan.next.id, lang))}
                </p>
              )}
            </>
          ) : (
            <>
              <div className="plan-status">
                <span className="plan-dot" style={{ background: tint(PLAN_LEVEL[plan.level].color) }} />
                <span className="plan-verdict">{t(PLAN_LEVEL[plan.level].label)}</span>
              </div>
              <div className="plan-numbers">
                <div className="plan-num">
                  <div className="kpi-value">{plan.target}</div>
                  <div className="kpi-label">{t('plan_targetDue').replace('{m}', monthLabel(plan.due.id, lang))}</div>
                </div>
                <div className="plan-num">
                  <div className="kpi-value">{plan.actual}</div>
                  <div className="kpi-label">{t('plan_actual')}</div>
                </div>
                <div className="plan-num">
                  {/* One number, named for its sign: "Rückstand -2" would be a
                      riddle, so being ahead is labelled as being ahead. */}
                  <div className="kpi-value" style={{ color: tint(PLAN_LEVEL[plan.level].color) }}>
                    {plan.gap > 0 ? plan.gap : plan.actual - plan.target}
                  </div>
                  <div className="kpi-label">{plan.gap > 0 ? t('plan_gap') : t('plan_ahead')}</div>
                </div>
              </div>
              {plan.next && (
                <p className="stat-hint plan-next">
                  {t('plan_next').replace('{n}', String(plan.next.released)).replace('{m}', monthLabel(plan.next.id, lang))}
                </p>
              )}
              <p className="stat-hint">{t('plan_slack')}</p>
            </>
          )}
        </Card>
      )
    }
  ]

  return (
    <div className="tab-pane">
      <div className="toolbar no-print">
        <h2 className="pane-title">Dashboard</h2>
        <span className="push-right" />
        <button
          className={'btn no-capture ' + (editing ? 'btn-primary' : 'btn-ghost')}
          onClick={() => setEditing((v) => !v)}
        >
          {editing ? '✓ ' + t('dashDone') : '⠿ ' + t('dashArrange')}
        </button>
      </div>
      {editing && <p className="planning-note no-capture">{t('dashArrangeHint')}</p>}

      <h3 className="dash-section-title">{t('section_overview')}</h3>
      {/* Not a ReorderZone: a single band has nothing to arrange. Any stored
          order.ovKpi from the old tile grid is simply ignored. */}
      {ovHero}
      <ReorderZone zone="ovChart" items={ordered(ovChart, order.ovChart)} className="grid-3 dash-charts" editing={editing} onReorder={setDashboardOrder} t={t} />

      <h3 className="dash-section-title">{t('section_conversion')}</h3>
      <ReorderZone zone="cvKpi" items={ordered(cvKpi, order.cvKpi)} className="kpi-grid" editing={editing} onReorder={setDashboardOrder} t={t} />
      <ReorderZone zone="cvChart" items={ordered(cvChart, order.cvChart)} className="grid-2 dash-charts" editing={editing} onReorder={setDashboardOrder} t={t} />
    </div>
  )
}
