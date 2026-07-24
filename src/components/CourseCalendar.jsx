import React, { useMemo } from 'react'
import { useStore } from '../lib/store.jsx'
import { courseEntries, courseMonths, monthGrid, monthTitle, stepAbbrev, WEEKDAYS } from '../lib/courseCalendar.js'
import { shortName } from '../lib/format.js'

// Compact month calendar of course starts: one card per month, a Monday-based
// day grid, and a small chip per trainer/step. Designed to stay readable when
// printed (months never break across pages).
export default function CourseCalendar({ trainers, steps, providers }) {
  const { t, lang } = useStore()
  // Rebuilt only when the underlying data changes, not on every parent render
  // (the Planung search box re-renders this on every keystroke).
  const months = useMemo(() => {
    const entries = courseEntries(trainers, steps, providers)
    return { list: courseMonths(entries), count: entries.length }
  }, [trainers, steps, providers])
  const wd = WEEKDAYS[lang === 'de' ? 'de' : 'en']

  if (!months.list.length) {
    return (
      <section className="card">
        <h3 className="card-title">{t('planning_calendar')}</h3>
        <p className="muted small">{t('planning_calendarEmpty')}</p>
      </section>
    )
  }

  return (
    <section className="card cal-card">
      <div className="card-head">
        <h3 className="card-title">{t('planning_calendar')}</h3>
        <span className="card-total">{t('planning_calendarStarts')}: {months.count}</span>
      </div>
      <p className="muted small no-print">{t('planning_calendarHint')}</p>

      {/* Legend: which colour belongs to which course/step. */}
      <ul className="legend legend-wrap cal-legend">
        {steps.map((s) => (
          <li key={s.id}>
            <span className="dot" style={{ background: s.color }} />
            <span className="legend-key">
              <b>{stepAbbrev(s.label)}</b> {s.label}
            </span>
          </li>
        ))}
      </ul>

      <div className="cal-months">
        {months.list.map((m) => (
          <div className="cal-month" key={m.month}>
            <div className="cal-month-head">
              <span className="cal-month-name">{monthTitle(m.month, lang)}</span>
              <span className="cal-month-count">{m.items.length}</span>
            </div>
            <div className="cal-weekdays">
              {wd.map((d) => <span key={d}>{d}</span>)}
            </div>
            <div className="cal-grid">
              {monthGrid(m.year, m.monthIndex, m.items).map((cell, i) =>
                cell === null ? (
                  <div className="cal-cell empty" key={'e' + i} />
                ) : (
                  <div className={'cal-cell' + (cell.items.length ? ' has-items' : '')} key={cell.day}>
                    <span className="cal-day">{cell.day}</span>
                    {cell.items.map((it, j) => (
                      <span
                        className="cal-chip"
                        key={j}
                        style={{ background: it.step.color }}
                        title={`${it.trainer.name} · ${it.step.label}${it.where ? ' · ' + it.where : ''}`}
                      >
                        <b>{it.trainer.tlc || shortName(it.trainer.name)}</b>
                        <span className="cal-chip-step">{stepAbbrev(it.step.label)}</span>
                      </span>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
