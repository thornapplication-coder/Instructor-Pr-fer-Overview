import React from 'react'
import { useStore } from '../lib/store.jsx'
import KpiTile from '../components/KpiTile.jsx'
import ExportBar from '../components/ExportBar.jsx'
import { Donut, HBars, ProgressRing, PipelineBar } from '../components/charts.jsx'
import {
  headcount,
  conversionSummary,
  byBase,
  byQual,
  byOre,
  byAuthority,
  byPartTime,
  byFunction,
  pipelineDistribution,
  conversionFteSummary
} from '../lib/stats.js'
import { conversionProgress, STAFF_TYPE } from '../data/pipeline.js'
import { AIRCRAFT } from '../data/aircraft.js'

const ORE_COLORS = { A: '#AF1E65', B: '#00A6CF', C: '#6BCCE0', Rente: '#BDBABA' }
const AC_COLORS = { A320: '#AF1E65', B737: '#2196F3' }

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

export default function Dashboard() {
  const { data, t } = useStore()
  const { trainers, stages, quals: qualDefs } = data
  const total = trainers.length

  const qualColor = (key) => (qualDefs.find((q) => q.id === key) || {}).color || '#787878'
  const hc = headcount(trainers)
  const cs = conversionSummary(trainers)
  const fteS = conversionFteSummary(trainers)
  const quals = byQual(trainers, qualDefs.map((q) => q.id))
  const bases = byBase(trainers)
  const ore = byOre(trainers).map((r) => ({ ...r, color: ORE_COLORS[r.key] }))
  const auth = byAuthority(trainers)
  const pt = byPartTime(trainers)
  const fn = byFunction(trainers)
  const staffInternal = trainers.filter((x) => (x.staffType || 'internal') === 'internal').length
  const staffExternal = trainers.length - staffInternal
  const aircraft = AIRCRAFT.map((a) => ({ key: a, count: trainers.filter((x) => x.aircraft === a).length, color: AC_COLORS[a] }))
  const pipe = pipelineDistribution(trainers, stages).map((s) => ({ ...s, label: s.label }))

  const relevant = trainers.filter((tr) => tr.ore !== 'Rente')
  const overall =
    relevant.length === 0 ? 0 : relevant.reduce((s, tr) => s + conversionProgress(stages, tr.conv), 0) / relevant.length

  return (
    <div className="tab-pane">
      <div className="toolbar no-print">
        <h2 className="pane-title">Dashboard</h2>
        <span className="push-right" />
        <ExportBar />
      </div>
      <div className="kpi-grid">
        <KpiTile value={hc.total} label={t('kpi_totalTrainers')} sub={`FTE ≈ ${hc.fte}`} />
        <KpiTile value={hc.examiners} label={t('kpi_examiners')} accent="#AF1E65" />
        <KpiTile value={hc.instructors} label={t('kpi_instructors')} accent="#00A6CF" />
        <KpiTile value={hc.active} label={t('kpi_active')} />
        <KpiTile value={cs.released} label={t('kpi_released')} accent="#2FA36B" />
        <KpiTile value={cs.inProgress} label={t('kpi_inProgress')} accent="#E8A33D" />
        <KpiTile value={cs.notStarted} label={t('kpi_notStarted')} accent="#871C54" />
        <KpiTile value={fteS.inConversion} label={t('kpi_fteInConversion')} accent="#E8A33D" sub={`/ ${fteS.total} FTE`} />
        <KpiTile value={fteS.available} label={t('kpi_fteAvailable')} accent="#2FA36B" sub={`/ ${fteS.total} FTE`} />
      </div>

      <div className="grid-2">
        <section className="card">
          <h2 className="card-title">{t('chart_pipeline')}</h2>
          <div className="pipeline-row">
            <ProgressRing value={overall} label={t('overallProgress')} />
            <div className="pipeline-flex"><PipelineBar stages={pipe} /></div>
          </div>
        </section>
        <Card title={t('chart_byOre')} total={total}>
          <Donut data={ore} centerBottom="ORE" />
        </Card>
      </div>

      <div className="grid-3">
        <Card title={t('stat_qual')} total={total}>
          <HBars data={quals} colorFn={(d) => qualColor(d.key)} />
        </Card>
        <Card title={t('stat_base')} total={total}>
          <HBars data={bases} />
        </Card>
        <Card title={t('stat_aircraft')} total={total}>
          <Donut data={aircraft} />
        </Card>
        <Card title={t('stat_authority')} total={total}>
          <HBars data={auth} />
        </Card>
        <Card title={t('stat_partTime')} total={total}>
          <HBars data={pt} />
        </Card>
        <Card title={t('stat_function')} total={total}>
          <Donut
            data={[
              { key: t('withFunction'), count: fn.withFunction, color: '#AF1E65' },
              { key: t('withoutFunction'), count: fn.withoutFunction, color: '#6BCCE0' }
            ]}
          />
        </Card>
        <Card title={t('filterStaff')} total={total}>
          <Donut
            data={[
              { key: t('staff_internal'), count: staffInternal, color: STAFF_TYPE.internal.color },
              { key: t('staff_external'), count: staffExternal, color: STAFF_TYPE.external.color }
            ]}
          />
        </Card>
      </div>
    </div>
  )
}
