import React, { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { capacityByBase, capacityByQual, conversionFteSummary } from '../lib/stats.js'
import { targetsByMonth, monthLabel, stageName } from '../lib/alerts.js'
import { CONV_STATUS, stageLabel } from '../data/pipeline.js'
import { AIRCRAFT } from '../data/aircraft.js'
import { formatDate } from '../lib/format.js'

// One capacity table (per base or per qualification).
function CapTable({ title, firstCol, cap }) {
  const { t } = useStore()
  return (
    <section className="card">
      <h3 className="card-title">{title}</h3>
      <div className="table-wrap">
        <table className="data-table cap-table">
          <thead>
            <tr>
              <th>{firstCol}</th>
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
              <tr key={r.key}>
                <td className="strong">{r.key}</td>
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
  )
}

// Inline editor for phase / status / target date per person. Drives the
// timeline below and the alerts on the dashboard.
function ConversionEditor({ trainers, stages }) {
  const { t, lang, setConversion } = useStore()
  const [q, setQ] = useState('')
  const [fBase, setFBase] = useState('')
  const [hideDone, setHideDone] = useState(false)
  const bases = useMemo(() => [...new Set(trainers.map((x) => x.base))].filter(Boolean).sort(), [trainers])

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase()
    return trainers
      .filter((x) => x.ore !== 'Rente')
      .filter((x) => (fBase ? x.base === fBase : true))
      .filter((x) => (hideDone ? (x.conv?.stage || 'nominated') !== 'released' : true))
      .filter((x) => (n ? [x.name, x.tlc, x.base, x.qual].join(' ').toLowerCase().includes(n) : true))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }, [trainers, q, fBase, hideDone])

  const statusOptions = Object.entries(CONV_STATUS).sort((a, b) =>
    (lang === 'de' ? a[1].de : a[1].en).localeCompare(lang === 'de' ? b[1].de : b[1].en)
  )

  return (
    <section className="card">
      <h3 className="card-title">{t('capacity_edit')}</h3>
      <p className="muted small">{t('capacity_editHint')}</p>
      <div className="toolbar no-print" style={{ marginTop: 6 }}>
        <input className="input search" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" value={fBase} onChange={(e) => setFBase(e.target.value)}>
          <option value="">{t('filterBase')}: {t('all')}</option>
          {bases.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <label className="check-inline">
          <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} />
          {t('capacity_hideDone')}
        </label>
        <span className="count-pill">{rows.length} {t('showing')}</span>
      </div>
      <div className="table-wrap">
        <table className="data-table edit-table">
          <thead>
            <tr>
              <th>{t('f_name')}</th>
              <th>{t('stage')}</th>
              <th>{t('status')}</th>
              <th>{t('targetDate')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.id}>
                <td>
                  <div className="strong">{x.name}</div>
                  <div className="muted small">{x.base} · {x.qual}{x.aircraft ? ' · ' + x.aircraft : ''}</div>
                </td>
                <td>
                  <select
                    className="input"
                    value={x.conv?.stage || 'nominated'}
                    onChange={(e) => setConversion(x.id, { stage: e.target.value })}
                  >
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>{stageLabel(s)}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    className="input"
                    value={x.conv?.status || 'on_track'}
                    onChange={(e) => setConversion(x.id, { status: e.target.value })}
                  >
                    {statusOptions.map(([k, v]) => (
                      <option key={k} value={k}>{lang === 'de' ? v.de : v.en}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    className="input"
                    type="date"
                    value={x.conv?.target || ''}
                    onChange={(e) => setConversion(x.id, { target: e.target.value })}
                  />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={4} className="empty-row">{t('noTrainers')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function Capacity() {
  const { data, t, lang } = useStore()
  const { trainers, stages } = data
  const capBase = useMemo(() => capacityByBase(trainers, AIRCRAFT), [trainers])
  const capQual = useMemo(() => capacityByQual(trainers, AIRCRAFT), [trainers])
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

      <div className="grid-2">
        <CapTable title={t('capacity_byBase')} firstCol={t('f_base')} cap={capBase} />
        <CapTable title={t('capacity_byQual')} firstCol={t('f_qual')} cap={capQual} />
      </div>

      <ConversionEditor trainers={trainers} stages={stages} />

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
                  {items.map(({ trainer, level }) => (
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
