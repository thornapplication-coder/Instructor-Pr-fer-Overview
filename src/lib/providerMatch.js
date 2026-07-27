// Match providers to a planning step by the LABELS of their offered courses
// (course entries store ids; custom courses have random ids, so ids must be
// resolved against the course list first). "SIM only" counts as type rating.
const STEP_COURSE_KW = { tr: ['type rating', 'sim'], tri: ['tri'], tre: ['tre'], lifus: ['lifus'] }
export function providersForStep(providers, step, courseDefs) {
  const kws = STEP_COURSE_KW[step.id]
  if (!kws) return providers
  const labelOf = (id) => {
    const c = (courseDefs || []).find((x) => x.id === id)
    return String(c ? c.label : id).toLowerCase()
  }
  const matched = providers.filter((p) =>
    (p.courses || []).some((cid) => {
      const label = labelOf(cid)
      return kws.some((kw) => label.includes(kw))
    })
  )
  return matched.length ? matched : providers
}
