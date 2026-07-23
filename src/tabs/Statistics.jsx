import React from 'react'
import { useStore } from '../lib/store.jsx'
import { Donut, HBars } from '../components/charts.jsx'
import { byQual, byBase, byOre, byAuthority, byPartTime, byFunction } from '../lib/stats.js'
import { STAFF_TYPE } from '../data/pipeline.js'

const ORE_COLORS = { A: '#AF1E65', B: '#00A6CF', C: '#6BCCE0', Rente: '#BDBABA' }

function Card({ title, total, children }) {
  const { t } = useStore()
  return (
    <section className="card">
      <div className="card-head">
        <h3 className="card-title">{title}</h3>
        <span className="card-total">{t('total')}: {total}</span>
      </div>
      {children}
    </section>
  )
}

export default function Statistics() {
  const { data, t } = useStore()
  const { trainers, quals: qualDefs } = data
  const total = trainers.length
  const qualColor = (key) => (qualDefs.find((q) => q.id === key) || {}).color || '#787878'

  const quals = byQual(trainers, qualDefs.map((q) => q.id))
  const bases = byBase(trainers)
  const ore = byOre(trainers).map((r) => ({ ...r, color: ORE_COLORS[r.key] }))
  const auth = byAuthority(trainers)
  const pt = byPartTime(trainers)
  const fn = byFunction(trainers)
  const staffInternal = trainers.filter((x) => (x.staffType || 'internal') === 'internal').length
  const staffExternal = trainers.length - staffInternal

  return (
    <div className="tab-pane">
      <div className="toolbar">
        <h2 className="pane-title">{t('statistics_title')}</h2>
        <span className="stat-hint push-right">{t('stat_hint')}</span>
      </div>
      <p className="planning-note">{t('categoriesEditableHint')}</p>

      <div className="grid-3">
        <Card title={t('stat_qual')} total={total}>
          <HBars data={quals} colorFn={(d) => qualColor(d.key)} />
        </Card>

        <Card title={t('stat_base')} total={total}>
          <HBars data={bases} />
        </Card>

        <Card title={t('stat_ore')} total={total}>
          <Donut data={ore} centerBottom="ORE" />
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
