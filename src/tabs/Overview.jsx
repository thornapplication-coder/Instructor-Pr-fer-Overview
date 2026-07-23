import React from 'react'
import { useStore } from '../lib/store.jsx'
import KpiTile from '../components/KpiTile.jsx'
import { Donut, HBars, ProgressRing, PipelineBar } from '../components/charts.jsx'
import {
  headcount,
  conversionSummary,
  byBase,
  byQual,
  byOre,
  pipelineDistribution
} from '../lib/stats.js'
import { conversionProgress } from '../data/pipeline.js'

const ORE_COLORS = { A: '#AF1E65', B: '#00A6CF', C: '#6BCCE0', Rente: '#BDBABA' }

export default function Overview() {
  const { data, t } = useStore()
  const { trainers, stages, quals: qualDefs } = data

  const qualColor = (key) => (qualDefs.find((q) => q.id === key) || {}).color
  const hc = headcount(trainers)
  const cs = conversionSummary(trainers)
  const bases = byBase(trainers)
  const quals = byQual(trainers, qualDefs.map((q) => q.id)).map((r) => ({ ...r, color: qualColor(r.key) }))
  const ore = byOre(trainers).map((r) => ({ ...r, color: ORE_COLORS[r.key] }))
  const pipe = pipelineDistribution(trainers, stages).map((s) => ({ ...s, label: s.label }))

  // Overall progress = mean per-trainer pipeline progress (retiring excluded).
  const relevant = trainers.filter((tr) => tr.ore !== 'Rente')
  const overall =
    relevant.length === 0
      ? 0
      : relevant.reduce((s, tr) => s + conversionProgress(stages, tr.conv), 0) / relevant.length

  return (
    <div className="tab-pane">
      <div className="kpi-grid">
        <KpiTile value={hc.total} label={t('kpi_totalTrainers')} sub={`FTE ≈ ${hc.fte}`} />
        <KpiTile value={hc.examiners} label={t('kpi_examiners')} accent="#AF1E65" />
        <KpiTile value={hc.instructors} label={t('kpi_instructors')} accent="#00A6CF" />
        <KpiTile value={hc.active} label={t('kpi_active')} />
        <KpiTile value={cs.released} label={t('kpi_released')} accent="#2FA36B" />
        <KpiTile value={cs.inProgress} label={t('kpi_inProgress')} accent="#E8A33D" />
        <KpiTile value={cs.notStarted} label={t('kpi_notStarted')} accent="#871C54" />
        <KpiTile value={hc.retiring} label={t('kpi_retiring')} accent="#787878" />
      </div>

      <div className="grid-2">
        <section className="card">
          <h2 className="card-title">{t('chart_pipeline')}</h2>
          <div className="pipeline-row">
            <ProgressRing value={overall} label={t('overallProgress')} />
            <div className="pipeline-flex">
              <PipelineBar stages={pipe} />
            </div>
          </div>
        </section>

        <section className="card">
          <h2 className="card-title">{t('chart_byOre')}</h2>
          <Donut data={ore} centerBottom="ORE" />
        </section>
      </div>

      <div className="grid-2">
        <section className="card">
          <h2 className="card-title">{t('chart_byBase')}</h2>
          <HBars data={bases} />
        </section>
        <section className="card">
          <h2 className="card-title">{t('chart_byQual')}</h2>
          <HBars data={quals} colorFn={(d) => d.color || '#787878'} />
        </section>
      </div>
    </div>
  )
}
