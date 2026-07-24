import React, { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import KpiTile from '../components/KpiTile.jsx'
import { Donut, HBars, ProgressRing, PipelineBar, StackedBars } from '../components/charts.jsx'
import {
  headcount,
  conversionSummary,
  byBase,
  byQual,
  byOre,
  byAuthority,
  byPartTime,
  byFunction,
  byRole,
  qualByAircraft,
  pipelineDistribution,
  conversionFteSummary
} from '../lib/stats.js'
import { conversionProgress, STAFF_TYPE } from '../data/pipeline.js'
import { qualLabel, conversionTrainers } from '../data/qualifications.js'
import { AIRCRAFT } from '../data/aircraft.js'

const ORE_COLORS = { A: '#AF1E65', B: '#00A6CF', C: '#6BCCE0', Rente: '#BDBABA' }
const AC_COLORS = { A320: '#AF1E65', B737: '#2196F3' }
const ROLE_COLORS = { captain: '#AF1E65', fo: '#00A6CF' }

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
function ReorderZone({ zone, items, className, editing, onReorder }) {
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
  return (
    <div className={className + ' dash-editing'}>
      {items.map((it) => (
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
          <span className="dash-drag" aria-hidden="true">⠿</span>
          {it.node}
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { data, t, setDashboardOrder } = useStore()
  const { trainers, stages, quals: qualDefs } = data
  const [editing, setEditing] = useState(false)
  const order = (data.dashboard && data.dashboard.order) || {}
  const total = trainers.length

  const qualColor = (key) => (qualDefs.find((q) => q.id === key) || {}).color || '#787878'
  const qualOrder = qualDefs.map((q) => q.id)
  const hc = headcount(trainers)
  // The conversion only applies to SEN / TRE / TRI / LTC (not SFI / TKI).
  const convPool = conversionTrainers(trainers)
  const cs = conversionSummary(convPool, stages)
  const fteS = conversionFteSummary(convPool, stages)
  const role = byRole(trainers)
  const qualData = byQual(trainers, qualOrder).map((r) => ({ ...r, label: qualLabel(qualDefs, r.key) }))
  const qualAc = qualByAircraft(trainers, qualOrder).map((r) => ({ ...r, label: qualLabel(qualDefs, r.key) }))
  const bases = byBase(trainers)
  // ORE is the conversion priority, so it follows the conversion scope.
  const ore = byOre(convPool).map((r) => ({ ...r, color: ORE_COLORS[r.key] }))
  const auth = byAuthority(trainers)
  const pt = byPartTime(trainers)
  const fn = byFunction(trainers)
  const staffInternal = trainers.filter((x) => (x.staffType || 'internal') === 'internal').length
  const staffExternal = trainers.length - staffInternal
  const aircraft = AIRCRAFT.map((a) => ({ key: a, count: trainers.filter((x) => x.aircraft === a).length, color: AC_COLORS[a] }))
  const acSeries = [
    { key: 'A320', label: 'A320', color: AC_COLORS.A320 },
    { key: 'B737', label: 'B737', color: AC_COLORS.B737 }
  ]
  const pipe = pipelineDistribution(convPool, stages)
  const relevant = convPool.filter((tr) => tr.ore !== 'Rente')
  const overall =
    relevant.length === 0 ? 0 : relevant.reduce((s, tr) => s + conversionProgress(stages, tr.conv), 0) / relevant.length

  // ---- Overview (Instruktoren & Prüfer) — KPI tiles in SEN·TRE·TRI·LTC·SFI·TKI order
  const ovKpi = [
    { id: 'total', node: <KpiTile value={hc.total} label={t('kpi_totalTrainers')} sub={`FTE ≈ ${hc.fte}`} /> },
    { id: 'examiners', node: <KpiTile value={hc.examiners} label={t('kpi_examiners')} accent="#701745" /> },
    { id: 'tri', node: <KpiTile value={hc.tri} label={t('kpi_tri')} accent="#00A6CF" /> },
    { id: 'ltc', node: <KpiTile value={hc.ltc} label={t('kpi_ltc')} accent="#871C54" /> },
    { id: 'sfitki', node: <KpiTile value={hc.sfiTki} label={t('kpi_sfiTki')} accent="#2FA36B" /> },
    { id: 'captain', node: <KpiTile value={hc.captains} label={t('kpi_captain')} accent={ROLE_COLORS.captain} /> },
    { id: 'fo', node: <KpiTile value={hc.firstOfficers} label={t('kpi_fo')} accent={ROLE_COLORS.fo} /> },
    { id: 'active', node: <KpiTile value={hc.active} label={t('kpi_active')} /> }
  ]
  const ovChart = [
    { id: 'qual', node: <Card title={t('stat_qual')} total={total}><HBars data={qualData} colorFn={(d) => qualColor(d.key)} /></Card> },
    { id: 'qualAc', node: <Card title={t('chart_qualByAircraft')} total={total}><StackedBars data={qualAc} series={acSeries} /></Card> },
    {
      id: 'role',
      node: (
        <Card title={t('chart_role')} total={total}>
          <Donut
            data={[
              { key: t('role_captain'), count: role.captains, color: ROLE_COLORS.captain },
              { key: t('role_fo'), count: role.fo, color: ROLE_COLORS.fo }
            ]}
            centerBottom="CPT / FO"
          />
        </Card>
      )
    },
    { id: 'base', node: <Card title={t('stat_base')} total={total}><HBars data={bases} /></Card> },
    { id: 'aircraft', node: <Card title={t('stat_aircraft')} total={total}><Donut data={aircraft} /></Card> },
    { id: 'authority', node: <Card title={t('stat_authority')} total={total}><HBars data={auth} /></Card> },
    { id: 'partTime', node: <Card title={t('stat_partTime')} total={total}><HBars data={pt} /></Card> },
    {
      id: 'function',
      node: (
        <Card title={t('stat_function')} total={total}>
          <Donut
            data={[
              { key: t('withFunction'), count: fn.withFunction, color: '#AF1E65' },
              { key: t('withoutFunction'), count: fn.withoutFunction, color: '#6BCCE0' }
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
    { id: 'released', node: <KpiTile value={cs.released} label={t('kpi_released')} accent="#2FA36B" /> },
    { id: 'inProgress', node: <KpiTile value={cs.inProgress} label={t('kpi_inProgress')} accent="#E8A33D" /> },
    { id: 'notStarted', node: <KpiTile value={cs.notStarted} label={t('kpi_notStarted')} accent="#871C54" /> },
    { id: 'fteInConv', node: <KpiTile value={fteS.inConversion} label={t('kpi_fteInConversion')} accent="#E8A33D" sub={`/ ${fteS.total} FTE`} /> },
    { id: 'fteAvail', node: <KpiTile value={fteS.available} label={t('kpi_fteAvailable')} accent="#2FA36B" sub={`/ ${fteS.total} FTE`} /> }
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
      <ReorderZone zone="ovKpi" items={ordered(ovKpi, order.ovKpi)} className="kpi-grid" editing={editing} onReorder={setDashboardOrder} />
      <ReorderZone zone="ovChart" items={ordered(ovChart, order.ovChart)} className="grid-3 dash-charts" editing={editing} onReorder={setDashboardOrder} />

      <h3 className="dash-section-title">{t('section_conversion')}</h3>
      <ReorderZone zone="cvKpi" items={ordered(cvKpi, order.cvKpi)} className="kpi-grid" editing={editing} onReorder={setDashboardOrder} />
      <ReorderZone zone="cvChart" items={ordered(cvChart, order.cvChart)} className="grid-2 dash-charts" editing={editing} onReorder={setDashboardOrder} />
    </div>
  )
}
