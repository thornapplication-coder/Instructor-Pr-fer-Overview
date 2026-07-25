import React, { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import KpiTile from '../components/KpiTile.jsx'
import { Donut, GroupedBars, HBars, ProgressRing, PipelineBar, StackedBars, colorAt } from '../components/charts.jsx'
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
import { qualLabel, conversionTrainers } from '../data/qualifications.js'
import { AIRCRAFT } from '../data/aircraft.js'
import { CATEGORICAL, OVERFLOW, STATUS, BRAND, stageRamp } from '../lib/palette.js'

// ORE is a priority tier (A before B before C), so it reads as an ordinal ramp –
// darker means more urgent – with retirement dropping out to the neutral.
// Everything else here is identity and takes documented categorical slots.
const ORE_RAMP = stageRamp(3)
const ORE_COLORS = { A: ORE_RAMP[2], B: ORE_RAMP[1], C: ORE_RAMP[0], Rente: OVERFLOW }
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
  const headFte = [
    { key: 'heads', label: t('metric_heads'), color: CATEGORICAL[0] },
    { key: 'fte', label: t('metric_fte'), color: CATEGORICAL[1] }
  ]
  const toHeadFte = (r) => ({ key: r.key, label: r.key, heads: r.headcount, fte: r.total })
  const capBase = capacityByBase(trainers, AIRCRAFT, stages).rows.map(toHeadFte)
  const capAc = capacityByAircraft(trainers, AIRCRAFT, stages).rows.map(toHeadFte)
  const fte1 = (v) => (Math.round(v * 10) / 10).toString().replace('.', lang === 'de' ? ',' : '.')

  const pipe = pipelineDistribution(convPool, stages)
  const relevant = convPool.filter((tr) => tr.ore !== 'Rente')
  const overall =
    relevant.length === 0 ? 0 : relevant.reduce((s, tr) => s + conversionProgress(stages, tr.conv), 0) / relevant.length

  // ---- Overview (Instruktoren & Prüfer) — KPI tiles in SEN·TRE·TRI·LTC·SFI·TKI order
  const ovKpi = [
    { id: 'total', node: <KpiTile value={hc.total} label={t('kpi_totalTrainers')} sub={`FTE ≈ ${hc.fte}`} /> },
    { id: 'examiners', node: <KpiTile value={hc.examiners} label={t('kpi_examiners')} accent={BRAND.burgundy} /> },
    { id: 'tri', node: <KpiTile value={hc.tri} label={t('kpi_tri')} accent={BRAND.burgundy} /> },
    { id: 'ltc', node: <KpiTile value={hc.ltc} label={t('kpi_ltc')} accent={BRAND.burgundy} /> },
    { id: 'sfitki', node: <KpiTile value={hc.sfiTki} label={t('kpi_sfiTki')} accent={BRAND.burgundy} /> },
    { id: 'captain', node: <KpiTile value={hc.captains} label={t('kpi_captain')} accent={ROLE_COLORS.captain} /> },
    { id: 'fo', node: <KpiTile value={hc.firstOfficers} label={t('kpi_fo')} accent={ROLE_COLORS.fo} /> },
    { id: 'active', node: <KpiTile value={hc.active} label={t('kpi_active')} /> }
  ]
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
        <Card title={t('chart_headFteBase')}>
          <GroupedBars data={capBase} series={headFte} format={fte1} />
          <p className="stat-hint">{t('headFteHint')}</p>
        </Card>
      )
    },
    {
      id: 'capAircraft',
      node: (
        <Card title={t('chart_headFteAircraft')}>
          <GroupedBars data={capAc} series={headFte} format={fte1} />
          <p className="stat-hint">{t('headFteHint')}</p>
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
  const cvKpi = [
    { id: 'released', node: <KpiTile value={cs.released} label={t('kpi_released')} accent={STATUS.good} /> },
    { id: 'inProgress', node: <KpiTile value={cs.inProgress} label={t('kpi_inProgress')} accent={BRAND.burgundy} /> },
    { id: 'notStarted', node: <KpiTile value={cs.notStarted} label={t('kpi_notStarted')} accent={STATUS.neutral} /> },
    { id: 'fteInConv', node: <KpiTile value={fteS.inConversion} label={t('kpi_fteInConversion')} accent={BRAND.burgundy} sub={`/ ${fteS.total} FTE`} /> },
    { id: 'fteAvail', node: <KpiTile value={fteS.available} label={t('kpi_fteAvailable')} accent={STATUS.good} sub={`/ ${fteS.total} FTE`} /> }
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
    { id: 'ore', node: <Card title={t('chart_byOre')} total={convPool.length}><Donut data={ore} centerBottom="ORE" /></Card> }
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
      <ReorderZone zone="ovKpi" items={ordered(ovKpi, order.ovKpi)} className="kpi-grid" editing={editing} onReorder={setDashboardOrder} t={t} />
      <ReorderZone zone="ovChart" items={ordered(ovChart, order.ovChart)} className="grid-3 dash-charts" editing={editing} onReorder={setDashboardOrder} t={t} />

      <h3 className="dash-section-title">{t('section_conversion')}</h3>
      <ReorderZone zone="cvKpi" items={ordered(cvKpi, order.cvKpi)} className="kpi-grid" editing={editing} onReorder={setDashboardOrder} t={t} />
      <ReorderZone zone="cvChart" items={ordered(cvChart, order.cvChart)} className="grid-2 dash-charts" editing={editing} onReorder={setDashboardOrder} t={t} />
    </div>
  )
}
