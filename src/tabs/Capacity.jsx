import React, { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import DateInput from '../components/DateInput.jsx'
import { capacityByBase, capacityByQual, capacityByAircraft, conversionFteSummary, qualRankIndex } from '../lib/stats.js'
import { targetsByMonth, monthLabel, stageName } from '../lib/alerts.js'
import { useSort, Th } from '../components/sortable.jsx'
import { CONV_STATUS, stageLabel, firstStageId, releasedStageId } from '../data/pipeline.js'
import { qualLabel, conversionTrainers } from '../data/qualifications.js'
import { AIRCRAFT } from '../data/aircraft.js'
import { formatDate, formatFte1 } from '../lib/format.js'

// One sortable capacity table (per base or per qualification). Qualification
// rows default to the canonical rank (SEN → TRE → TRI → LTC → SFI → TKI).
function CapTable({ title, firstCol, cap, keyKind, labelFor }) {
  const { lang } = useStore()
  const fte1 = (v) => formatFte1(v, lang)
  const { t } = useStore()
  const accessors = useMemo(() => {
    const a = {
      key: keyKind === 'qual' ? (r) => qualRankIndex(r.key) : (r) => r.key,
      headcount: (r) => r.headcount,
      total: (r) => r.total,
      inConversion: (r) => r.inConversion,
      available: (r) => r.available
    }
    for (const ac of cap.aircraft) a['ac_' + ac] = (r) => r.ac[ac]
    return a
  }, [cap.aircraft, keyKind])
  const { sorted, sortKey, dir, toggle } = useSort(cap.rows, accessors, 'key')
  const sp = { sortKey, dir, onSort: toggle }
  return (
    <section className="card">
      <h3 className="card-title">{title}</h3>
      <div className="table-wrap">
        <table className="data-table cap-table">
          <thead>
            <tr>
              <Th label={firstCol} k="key" {...sp} />
              <Th label={t('cap_head')} k="headcount" className="num" {...sp} />
              <Th label={t('cap_total')} k="total" className="num" {...sp} />
              <Th label={t('cap_inConv')} k="inConversion" className="num" {...sp} />
              <Th label={t('cap_avail')} k="available" className="num" {...sp} />
              {cap.aircraft.map((a) => (
                <Th key={a} label={a} k={'ac_' + a} className="num" {...sp} />
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.key}>
                <td className="strong">{labelFor ? labelFor(r.key) : r.key}</td>
                <td className="num">{r.headcount}</td>
                <td className="num">{fte1(r.total)}</td>
                <td className="num">{fte1(r.inConversion)}</td>
                <td className="num strong avail">{fte1(r.available)}</td>
                {cap.aircraft.map((a) => (
                  <td key={a} className="num">{fte1(r.ac[a])}</td>
                ))}
              </tr>
            ))}
            <tr className="total-row">
              <td className="strong">{t('total')}</td>
              <td className="num">{cap.totals.headcount}</td>
              <td className="num">{fte1(cap.totals.total)}</td>
              <td className="num">{fte1(cap.totals.inConversion)}</td>
              <td className="num strong avail">{fte1(cap.totals.available)}</td>
              {cap.aircraft.map((a) => (
                <td key={a} className="num">{fte1(cap.totals.ac[a])}</td>
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
function ConversionEditor({ trainers, stages, quals }) {
  const { t, lang, setConversion } = useStore()
  const [q, setQ] = useState('')
  const [fBase, setFBase] = useState('')
  const [hideDone, setHideDone] = useState(false)
  const bases = useMemo(() => [...new Set(trainers.map((x) => x.base))].filter(Boolean).sort(), [trainers])
  const releasedId = releasedStageId(stages)
  const firstId = firstStageId(stages)

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase()
    return trainers
      .filter((x) => (fBase ? x.base === fBase : true))
      .filter((x) => (hideDone ? (x.conv?.stage || firstId) !== releasedId : true))
      .filter((x) => (n ? [x.name, x.tlc, x.base, qualLabel(quals, x.qual)].join(' ').toLowerCase().includes(n) : true))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }, [trainers, q, fBase, hideDone, quals, firstId, releasedId])

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
                  <div className="muted small">{x.base} · {qualLabel(quals, x.qual)}{x.aircraft ? ' · ' + x.aircraft : ''}</div>
                </td>
                <td>
                  <select
                    className="input"
                    value={x.conv?.stage || firstId}
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
                  <DateInput
                    value={x.conv?.target || ''}
                    onChange={(v) => setConversion(x.id, { target: v })}
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

// Conversion milestones and monthly intake targets.
//
// A six-month window rather than one long list: the planner works a couple of
// quarters ahead, and a slider that walks to the end of 2027 shows the far
// months without burying the near ones. Every month owns BOTH its numbers and
// is edited in place – no "add" form, because a target you cannot see is a
// target you forget to set.
export default function Capacity() {
  const { data, t, lang } = useStore()
  const fte1 = (v) => formatFte1(v, lang)
  const { trainers, stages, quals } = data
  // Conversion-specific views (editor, timeline, FTE pills) only cover the
  // qualifications that actually convert; the capacity tables cover everyone.
  const convPool = useMemo(() => conversionTrainers(trainers), [trainers])
  const capBase = useMemo(() => capacityByBase(trainers, AIRCRAFT, stages), [trainers, stages])
  const capQual = useMemo(() => capacityByQual(trainers, AIRCRAFT, stages), [trainers, stages])
  const capAircraft = useMemo(() => capacityByAircraft(trainers, AIRCRAFT, stages), [trainers, stages])
  const fteS = conversionFteSummary(convPool, stages)
  const months = useMemo(() => targetsByMonth(convPool, null, stages), [convPool, stages])

  return (
    <div className="tab-pane">
      <div className="toolbar no-print">
        <h2 className="pane-title">{t('capacity_title')}</h2>
      </div>
      <p className="planning-note">{t('capacity_hint')} {t('fteDefinition')}</p>

      <div className="fte-summary">
        <span className="fte-pill fte-in">{t('fteInConversionShort')}: <b>{fte1(fteS.inConversion)}</b></span>
        <span className="fte-pill fte-av">{t('fteAvailableShort')}: <b>{fte1(fteS.available)}</b></span>
        <span className="fte-pill fte-total">FTE {t('total')}: <b>{fte1(fteS.total)}</b></span>
      </div>

      <CapTable title={t('capacity_byQual')} firstCol={t('f_qual')} cap={capQual} keyKind="qual" labelFor={(k) => qualLabel(quals, k)} />
      <CapTable title={t('capacity_byAircraft')} firstCol={t('f_aircraft')} cap={capAircraft} keyKind="aircraft" />
      <CapTable title={t('capacity_byBase')} firstCol={t('f_base')} cap={capBase} keyKind="base" />


      <ConversionEditor trainers={convPool} stages={stages} quals={quals} />

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
