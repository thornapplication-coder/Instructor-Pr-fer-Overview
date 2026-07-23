import React from 'react'
import { useStore } from '../lib/store.jsx'
import { Donut, HBars } from '../components/charts.jsx'
import { byQual, byBase, byOre, byAuthority, byPartTime, byFunction } from '../lib/stats.js'

const ORE_COLORS = { A: '#AF1E65', B: '#00A6CF', C: '#6BCCE0', Rente: '#BDBABA' }

function StatTable({ rows, total }) {
  const { t } = useStore()
  return (
    <table className="mini-table">
      <thead>
        <tr>
          <th>{t('category')}</th>
          <th className="num">{t('count')}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key}>
            <td>{r.label || r.key}</td>
            <td className="num">{r.count}</td>
          </tr>
        ))}
        <tr className="total-row">
          <td>{t('total')}</td>
          <td className="num">{total}</td>
        </tr>
      </tbody>
    </table>
  )
}

export default function Statistics() {
  const { data, t, lang } = useStore()
  const { trainers } = data
  const total = trainers.length

  const quals = byQual(trainers)
  const bases = byBase(trainers)
  const ore = byOre(trainers).map((r) => ({ ...r, color: ORE_COLORS[r.key] }))
  const auth = byAuthority(trainers)
  const pt = byPartTime(trainers)
  const fn = byFunction(trainers)
  const fnRows = [
    { key: t('withFunction'), count: fn.withFunction },
    { key: t('withoutFunction'), count: fn.withoutFunction }
  ]

  return (
    <div className="tab-pane">
      <div className="toolbar">
        <h2 className="pane-title">{t('statistics_title')}</h2>
        <span className="stat-hint push-right">{t('stat_hint')}</span>
      </div>

      <div className="grid-3">
        <section className="card">
          <h3 className="card-title">{t('stat_qual')}</h3>
          <HBars data={quals} colorFn={(_, i) => ['#AF1E65', '#871C54', '#00A6CF', '#6BCCE0', '#D41370'][i % 5]} />
          <StatTable rows={quals} total={total} />
        </section>

        <section className="card">
          <h3 className="card-title">{t('stat_base')}</h3>
          <HBars data={bases} />
          <StatTable rows={bases} total={total} />
        </section>

        <section className="card">
          <h3 className="card-title">{t('stat_ore')}</h3>
          <Donut data={ore} centerBottom="ORE" />
          <StatTable rows={ore} total={total} />
        </section>

        <section className="card">
          <h3 className="card-title">{t('stat_authority')}</h3>
          <HBars data={auth} />
          <StatTable rows={auth} total={total} />
        </section>

        <section className="card">
          <h3 className="card-title">{t('stat_partTime')}</h3>
          <HBars data={pt} />
          <StatTable rows={pt} total={total} />
        </section>

        <section className="card">
          <h3 className="card-title">{t('stat_function')}</h3>
          <Donut
            data={[
              { key: t('withFunction'), count: fn.withFunction, color: '#AF1E65' },
              { key: t('withoutFunction'), count: fn.withoutFunction, color: '#6BCCE0' }
            ]}
          />
          <StatTable rows={fnRows} total={total} />
        </section>
      </div>
    </div>
  )
}
