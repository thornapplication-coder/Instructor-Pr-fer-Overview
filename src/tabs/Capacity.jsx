import React, { useMemo } from 'react'
import { useStore } from '../lib/store.jsx'
import { capacityByBase, conversionFteSummary } from '../lib/stats.js'
import { targetsByMonth, monthLabel, stageName } from '../lib/alerts.js'
import { AIRCRAFT } from '../data/aircraft.js'
import { formatDate } from '../lib/format.js'

export default function Capacity() {
  const { data, t, lang } = useStore()
  const { trainers, stages } = data
  const cap = useMemo(() => capacityByBase(trainers, AIRCRAFT), [trainers])
  const fteS = conversionFteSummary(trainers)
  const months = useMemo(() => targetsByMonth(trainers), [trainers])

  return (
    <div className="tab-pane">
      <div className="toolbar no-print">
        <h2 className="pane-title">{t('capacity_title')}</h2>
      </div>
      <p className="planning-note">{t('capacity_hint')}</p>

      <div className="fte-summary">
        <span className="fte-pill fte-in">{t('fteInConversionShort')}: <b>{fteS.inConversion}</b></span>
        <span className="fte-pill fte-av">{t('fteAvailableShort')}: <b>{fteS.available}</b></span>
        <span className="fte-pill fte-total">FTE {t('total')}: <b>{fteS.total}</b></span>
      </div>

      <section className="card">
        <h3 className="card-title">{t('capacity_byBase')}</h3>
        <div className="table-wrap">
          <table className="data-table cap-table">
            <thead>
              <tr>
                <th>{t('f_base')}</th>
                <th className="num">{t('cap_head')}</th>
                <th className="num">{t('cap_total')}</th>
                <th className="num">{t('cap_inConv')}</th>
                <th className="num">{t('cap_avail')}</th>
                {cap.aircraft.map((a) => (
                  <th key={a} className="num">{a}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cap.rows.map((r) => (
                <tr key={r.base}>
                  <td className="strong">{r.base}</td>
                  <td className="num">{r.headcount}</td>
                  <td className="num">{r.total}</td>
                  <td className="num">{r.inConversion}</td>
                  <td className="num strong avail">{r.available}</td>
                  {cap.aircraft.map((a) => (
                    <td key={a} className="num">{r.ac[a]}</td>
                  ))}
                </tr>
              ))}
              <tr className="total-row">
                <td className="strong">{t('total')}</td>
                <td className="num">{cap.totals.headcount}</td>
                <td className="num">{cap.totals.total}</td>
                <td className="num">{cap.totals.inConversion}</td>
                <td className="num strong avail">{cap.totals.available}</td>
                {cap.aircraft.map((a) => (
                  <td key={a} className="num">{cap.totals.ac[a]}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h3 className="card-title">{t('capacity_timeline')}</h3>
        {months.length === 0 ? (
          <p className="muted small">{t('capacity_noTargets')}</p>
        ) : (
          <div className="timeline">
            {months.map(({ month, items }) => (
              <div className="tl-col" key={month}>
                <div className="tl-head">
                  <span className="tl-month">{monthLabel(month, lang)}</span>
                  <span className="tl-count">{items.length}</span>
                </div>
                <div className="tl-body">
                  {items.map(({ trainer, level, date }) => (
                    <div
                      className={'tl-chip' + (level ? ' ' + level : '')}
                      key={trainer.id}
                      title={`${trainer.name} · ${formatDate(trainer.conv.target, lang)}`}
                    >
                      <span className="tl-name">{trainer.name}</span>
                      <span className="tl-meta">
                        {trainer.base} · {stageName(stages, trainer.conv?.stage)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
